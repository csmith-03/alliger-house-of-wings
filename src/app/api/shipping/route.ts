/**
 * POST /api/shipping
 *
 * Input (JSON body):
 *   {
 *     address | toAddress | addr | address_to: {
 *       name?: string,
 *       line1?: string,
 *       line2?: string,
 *       city?: string,
 *       state?: string,
 *       postal_code?: string,
 *       country?: string
 *     },
 *     items: Array<{
 *       quantity?: number,
 *       qty?: number,
 *       weightOz?: number
 *     }>
 *   }
 *
 * Behavior:
 *   - Normalizes destination address (accepts multiple field names).
 *   - Only supports US addresses; requires ZIP code.
 *   - Computes total package weight in ounces from items.
 *   - Builds a parcel with fixed dimensions.
 *   - Calls Shippo API to create a shipment and get rates.
 *   - Filters for USPS services (ground, priority, express).
 *   - Returns rates in cents, sorted by price, with estimated days.
 *
 * Output (200 OK):
 *   {
 *     rates: Array<{
 *       id: string,       // Shippo object_id
 *       label: string,    // service name
 *       amount: number,   // price in cents
 *       daysMin: number,  // estimated minimum days
 *       daysMax: number   // estimated maximum days
 *     }>
 *   }
 *
 * Errors:
 *   - Returns { rates: [] } if invalid input, non-US, or Shippo error.
 *   - Logs errors server-side for debugging.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

type ShipLine = {
  quantity?: number;
  qty?: number;
  weightOz?: number;
  name?: string;
  productId?: string;
  priceId?: string | null;
  size?: string;
};

type ParcelSpec = {
  length: number;
  width: number;
  height: number;
  distance_unit: "in";
  weight: number; // lb
  mass_unit: "lb";
};

// customer-provided packing info
const BOX_SMALL = { length: 7, width: 7, height: 14 } as const; // 7x7x14
const BOX_MED = { length: 13.5, width: 7.875, height: 13.5625 } as const; // 13 1/2 x 7 7/8 x 13 9/16
const BOX_LARGE = { length: 13, width: 13, height: 13 } as const; // 13x13x13

const BOTTLE_WEIGHT_LB: Record<number, number> = {
  1: 3,
  2: 5,
  3: 6,
  4: 8,
  5: 10,
  6: 11,
  7: 12,
  8: 13,
  9: 14,
  10: 15,
  11: 17,
  12: 19,
};

const GALLON_WEIGHT_LB: Record<number, number> = {
  1: 11,
  2: 22,
  3: 33,
  4: 38,
};


const ORIGIN = {
  name: "Alliger House of Wings",
  street1: process.env.SHIP_FROM_STREET || "",
  city: process.env.SHIP_FROM_CITY || "",
  state: process.env.SHIP_FROM_STATE || "",
  zip: process.env.SHIP_FROM_ZIP || "",
  country: "US",
  phone: process.env.SHIP_FROM_PHONE || undefined,
  email: process.env.SHIP_FROM_EMAIL || undefined,
};

function classifyCounts(lines: ShipLine[]): { gallons: number; bottles: number } {
  let gallons = 0;
  let bottles = 0;

  for (const li of lines) {
    const qty = Math.max(1, Number(li?.quantity ?? li?.qty ?? 1));
    const name = String(li?.name ?? "").toLowerCase();
    const size = String(li?.size ?? "").toLowerCase();

    const isGallon = size.includes("gallon") || name.includes("gallon") || name.includes("(gallon)");
    const isBottle =
      size.includes("12oz") ||
      name.includes("12oz") ||
      name.includes("(12oz)") ||
      name.includes("bottle");

    if (isGallon) gallons += qty;
    else bottles += qty;
  }

  return { gallons, bottles };
}

function parcelsFromCounts(gallons: number, bottles: number): ParcelSpec[] {
  const parcels: ParcelSpec[] = [];

  // 1) calculate gallons (handles >4 by splitting into multiple 4-gal boxes)
  let g = Math.max(0, Math.floor(gallons));

  while (g >= 4) {
    parcels.push({ ...BOX_LARGE, distance_unit: "in", weight: GALLON_WEIGHT_LB[4], mass_unit: "lb" });
    g -= 4;
  }
  if (g === 3) {
    parcels.push({ ...BOX_LARGE, distance_unit: "in", weight: GALLON_WEIGHT_LB[3], mass_unit: "lb" });
  } else if (g === 2) {
    parcels.push({ ...BOX_MED, distance_unit: "in", weight: GALLON_WEIGHT_LB[2], mass_unit: "lb" });
  } else if (g === 1) {
    parcels.push({ ...BOX_SMALL, distance_unit: "in", weight: GALLON_WEIGHT_LB[1], mass_unit: "lb" });
  }

  // 2) calculate bottles (split into 12-bottle boxes + remainder)
  let b = Math.max(0, Math.floor(bottles));

  while (b > 0) {
    if (b >= 12) {
      parcels.push({ ...BOX_LARGE, distance_unit: "in", weight: BOTTLE_WEIGHT_LB[12], mass_unit: "lb" });
      b -= 12;
      continue;
    }
    if (b >= 6) {
      parcels.push({ ...BOX_LARGE, distance_unit: "in", weight: BOTTLE_WEIGHT_LB[b], mass_unit: "lb" });
      b = 0;
      continue;
    }
    parcels.push({ ...BOX_SMALL, distance_unit: "in", weight: BOTTLE_WEIGHT_LB[b] ?? 3, mass_unit: "lb" });
    b = 0;
  }

  return parcels;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // normalize destination address from multiple possible options
    let addr =
      body?.address ?? body?.toAddress ?? body?.addr ?? body?.address_to ?? {};

    if (addr?.address) addr = addr.address;

    const toAddress = {
      name: body?.name || addr?.name || "",
      street1: addr?.line1 || "",
      street2: addr?.line2 || "",
      city: addr?.city || "",
      state: addr?.state || "",
      zip: addr?.postal_code || addr?.postalCode || "",
      country: (addr?.country || "US").toUpperCase(),
    };

    // only for US now
    if (toAddress.country !== "US" || !toAddress.zip) {
      return NextResponse.json({ rates: [] }, { status: 200 });
    }

    const items: ShipLine[] = Array.isArray(body?.items) ? body.items : [];

    // try to use customer packing rules based on gallons/bottles
    const { gallons, bottles } = classifyCounts(items);
    const computedParcels = parcelsFromCounts(gallons, bottles);

    // legacy fallback: total weight in ounces and a generic parcel if computedParcels is empty
    const totalWeightOz = items.reduce((sum, li: any) => {
      const qty = Math.max(1, Number(li?.quantity ?? li?.qty ?? 1));
      const oz = Number(li?.weightOz ?? 0);
      return sum + qty * oz;
    }, 0);
    const legacyParcel = {
      length: 8,
      width: 6,
      height: 4,
      distance_unit: "in",
      weight: Math.max(1, Math.round(totalWeightOz || 1)),
      mass_unit: "oz",
    };

    const parcels = computedParcels.length > 0 ? computedParcels : [legacyParcel];

    // Call Shippo API to create shipment and get rates
    const resp = await fetch("https://api.goshippo.com/shipments/", {
      method: "POST",
      headers: {
        Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY!}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        address_from: ORIGIN,
        address_to: toAddress,
        parcels,
        async: false,
        carrier_accounts: process.env.SHIPPO_UPS_ACCOUNT_ID ? [process.env.SHIPPO_UPS_ACCOUNT_ID] : undefined,
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      return NextResponse.json(
        { rates: [], error: txt || "Shippo error" },
        { status: 200 },
      );
    }

    const shipment = await resp.json();
    const rawRates: any[] = shipment?.rates ?? [];

    console.log("[/api/shipping] rawRates:", rawRates.map((r: any) => ({
      provider: r.provider,
      amount: r.amount,
      currency: r.currency,
      token: r.servicelevel?.token,
      name: r.servicelevel?.name,
    })));

    console.log("[/api/shipping] shipment messages:", shipment?.messages);

    // UPS ONLY — filter/normalize into UI format
    const rates = rawRates
      .filter((r) => r.currency === "USD" && String(r.provider).toUpperCase() === "UPS")
      .map((r) => {
        const est = Number(r.estimated_days) || undefined;
        return {
          id: String(r.object_id),

          // Shippo service level info (for frontend filtering)
          serviceToken: r?.servicelevel?.token ? String(r.servicelevel.token) : null,
          serviceName: r?.servicelevel?.name ? String(r.servicelevel.name) : null,

          label: r?.servicelevel?.name
            ? `UPS ${r.servicelevel.name}`
            : (r?.servicelevel?.token ? `UPS ${r.servicelevel.token}` : "UPS"),
          amount: Math.round(Number(r.amount) * 100),
          daysMin: est ?? 2,
          daysMax: est ? est + 1 : 5,
        };
      })
      .sort((a, b) => a.amount - b.amount);

    return NextResponse.json({ rates }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/shipping] error:", e?.message);
    return NextResponse.json(
      { rates: [], error: "quote failed" },
      { status: 200 },
    );
  }
}
