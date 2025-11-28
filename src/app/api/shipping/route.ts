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
 *       name?: string,
 *       quantity?: number,
 *       qty?: number,
 *       weightOz?: number
 *     }>
 *   }
 *
 * Behavior:
 *   - Normalizes destination address (accepts multiple field names).
 *   - Only supports US addresses; requires ZIP code.
 *   - Calculates package weight/dimensions using bottle/gallon rules from product name:
 *        - if name contains "gallon" → 1 gallon per unit
 *        - if name contains "12" → 1 bottle per unit
 *   - Falls back to weightOz and a generic box if no bottles/gallons detected.
 *   - Calls Shippo API to create a shipment and get rates.
 *   - Filters for UPS services.
 *   - Returns rates in cents, sorted by price, with estimated days.
 */

import { NextResponse } from "next/server";

export const runtime = "nodejs";

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

type Box = {
  length: number;
  width: number;
  height: number;
};

type BottleRule = {
  weightLbs: number;
  box: Box;
};

type GallonRule = {
  weightLbs: number;
  box: Box;
};

// bottle rules
const bottleConfig: Record<number, BottleRule> = {
  1: { weightLbs: 3, box: { length: 7, width: 7, height: 14 } },
  2: { weightLbs: 5, box: { length: 7, width: 7, height: 14 } },
  3: { weightLbs: 6, box: { length: 7, width: 7, height: 14 } },
  4: { weightLbs: 8, box: { length: 7, width: 7, height: 14 } },
  5: { weightLbs: 10, box: { length: 7, width: 7, height: 14 } },
  6: { weightLbs: 11, box: { length: 13, width: 13, height: 13 } },
  7: { weightLbs: 12, box: { length: 13, width: 13, height: 13 } },
  8: { weightLbs: 13, box: { length: 13, width: 13, height: 13 } },
  9: { weightLbs: 14, box: { length: 13, width: 13, height: 13 } },
  10: { weightLbs: 15, box: { length: 13, width: 13, height: 13 } },
  11: { weightLbs: 17, box: { length: 13, width: 13, height: 13 } },
  12: { weightLbs: 19, box: { length: 13, width: 13, height: 13 } },
};

// gallon rules
const gallonConfig: Record<number, GallonRule> = {
  1: { weightLbs: 11, box: { length: 7, width: 7, height: 14 } },
  2: { weightLbs: 22, box: { length: 13.5, width: 7.875, height: 13.5625 },},
  3: { weightLbs: 33, box: { length: 13, width: 13, height: 13 } },
  4: { weightLbs: 38, box: { length: 13, width: 13, height: 13 } },
};

function getBottleRule(totalBottles: number): BottleRule | null {
  if (!Number.isFinite(totalBottles) || totalBottles <= 0) return null;
  const rounded = Math.round(totalBottles);
  const maxKey = Math.max(...Object.keys(bottleConfig).map((k) => Number(k)));
  const key = Math.min(rounded, maxKey);
  return bottleConfig[key] ?? null;
}

function getGallonRule(totalGallons: number): GallonRule | null {
  if (!Number.isFinite(totalGallons) || totalGallons <= 0) return null;
  const rounded = Math.round(totalGallons);
  const maxKey = Math.max(...Object.keys(gallonConfig).map((k) => Number(k)));
  const key = Math.min(rounded, maxKey);
  return gallonConfig[key] ?? null;
}

export async function POST(req: Request) {
  console.log("[/api/shipping] INVOCATION", Date.now());
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
    // gather item counts for bottles/gallons and fallback weight
    const items: any[] = Array.isArray(body?.items) ? body.items : [];

    let totalBottles = 0;
    let totalGallons = 0;
    let totalWeightOzFallback = 0;

    for (const li of items) {
      const qty = Math.max(1, Number(li?.quantity ?? li?.qty ?? 1));
      const name = String(li?.name || "").toLowerCase();

      const isGallon = name.includes("gallon");
      const is12ozBottle = name.includes("12");

      const bottlesPerUnit = is12ozBottle ? 1 : 0;
      const gallonsPerUnit = isGallon ? 1 : 0;
      const weightOzPerUnit = Number(li?.weightOz ?? 0) || 0;

      totalBottles += qty * bottlesPerUnit;
      totalGallons += qty * gallonsPerUnit;
      totalWeightOzFallback += qty * weightOzPerUnit;
    }

    const hasConfigCounts = totalBottles > 0 || totalGallons > 0;

    let parcel: {
      length: number;
      width: number;
      height: number;
      distance_unit: "in";
      weight: number;
      mass_unit: "oz";
    };

    if (hasConfigCounts) {
      const bottleRule = totalBottles > 0 ? getBottleRule(totalBottles) : null;
      const gallonRule =
        totalGallons > 0 ? getGallonRule(totalGallons) : null;

      let totalWeightLbs = 0;
      let box: Box = { length: 8, width: 6, height: 4 };

      if (bottleRule && gallonRule) {
        // mixed bottles + gallons: combine weights and approximate a single larger box
        totalWeightLbs = bottleRule.weightLbs + gallonRule.weightLbs;
        box = {
          length: Math.max(bottleRule.box.length, gallonRule.box.length),
          width: Math.max(bottleRule.box.width, gallonRule.box.width),
          height: bottleRule.box.height + gallonRule.box.height,
        };
      } else if (bottleRule) {
        totalWeightLbs = bottleRule.weightLbs;
        box = bottleRule.box;
      } else if (gallonRule) {
        totalWeightLbs = gallonRule.weightLbs;
        box = gallonRule.box;
      } else {
        // safety fallback if something is off
        totalWeightLbs = Math.max(1, totalWeightOzFallback / 16 || 1);
      }

      const weightOz = Math.max(1, Math.round(totalWeightLbs * 16));

      parcel = {
        length: box.length,
        width: box.width,
        height: box.height,
        distance_unit: "in",
        weight: weightOz,
        mass_unit: "oz",
      };
    } else {
      // fallback path: use per-item ounces and a generic box
      const totalWeightOz = totalWeightOzFallback;
      parcel = {
        length: 8,
        width: 6,
        height: 4,
        distance_unit: "in",
        weight: Math.max(1, Math.round(totalWeightOz || 1)),
        mass_unit: "oz",
      };
    }

    console.log("[/api/shipping] package selection:", {
      totalBottles,
      totalGallons,
      hasConfigCounts,
      parcel,
    });


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
        parcels: [parcel],
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

    // UPS ONLY — choose UPS Ground if available, otherwise cheapest UPS rate
    const upsRaw = rawRates.filter(
      (r) =>
        r.currency === "USD" && String(r.provider).toUpperCase() === "UPS",
    );

    // TODO: change fallback
    // 1) try to find UPS Ground
    let chosenRaw =
      upsRaw.find(
        (r) =>
          String(r?.servicelevel?.token ?? "")
            .toLowerCase()
            .trim() === "ups_ground",
      ) ??
      upsRaw.find(
        (r) =>
          String(r?.servicelevel?.name ?? "")
            .toLowerCase()
            .trim() === "ground",
      );

    // 2) if no Ground, fall back to cheapest UPS rate
    if (!chosenRaw && upsRaw.length) {
      chosenRaw = upsRaw.reduce((min, r) =>
        Number(r.amount) < Number(min.amount) ? r : min,
      );
    }

    let rates: any[] = [];
    if (chosenRaw) {
      const est = Number(chosenRaw.estimated_days) || undefined;
      rates = [
        {
          id: String(chosenRaw.object_id),
          label: chosenRaw?.servicelevel?.name
            ? `UPS ${chosenRaw.servicelevel.name}`
            : chosenRaw?.servicelevel?.token
            ? `UPS ${chosenRaw.servicelevel.token}`
            : "UPS",
          amount: Math.round(Number(chosenRaw.amount) * 100),
          daysMin: est ?? 2,
          daysMax: est ? est + 1 : 5,
        },
      ];
    }

    return NextResponse.json({ rates }, { status: 200 });
  } catch (e: any) {
    console.error("[/api/shipping] error:", e?.message);
    return NextResponse.json(
      { rates: [], error: "quote failed" },
      { status: 200 },
    );
  }
}
