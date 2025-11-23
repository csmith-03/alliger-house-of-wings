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
 *       qty?: number
 *     }>
 *   }
 *
 * Behavior:
 *   - Normalizes destination address (accepts multiple field names).
 *   - Only supports US addresses; requires ZIP code.
 *   - Determines number of bottles vs gallons based on product names:
 *       - name containing "gallon" => gallon
 *       - everything else => bottles
 *   - Uses lookup table for:
 *       - weight per bottle count (1–12) + box dimensions
 *       - weight per gallon count (1–4) + box dimensions
 *   - Builds parcels:
 *       - gallons grouped up to 4 per box
 *       - bottles grouped up to 12 per box
 *   - Converts pounds → ounces for Shippo.
 *   - Calls Shippo API to create a shipment and get UPS Ground rate(s) (or any UPS rate as a fallback).
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

type BoxDims = { length: number; width: number; height: number };

type BottleRule = {
  weightLbs: number;
  box: BoxDims;
};

type GallonRule = {
  weightLbs: number;
  box: BoxDims;
};

/**
 *  - Each key = # of bottles / gallons in the shipment.
 *  - weightLbs = total package weight in pounds.
 *  - box = the dimensions to use for that count.
 */

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
  2: { weightLbs: 22, box: { length: 13.5, width: 7.875, height: 13.5625 } },
  3: { weightLbs: 33, box: { length: 13, width: 13, height: 13 } },
  4: { weightLbs: 38, box: { length: 13, width: 13, height: 13 } },
};

/**
 * count bottles & gallons based on product names.
 * - "gallon" in name → that many gallons
 * - "12" in name     → that many 12oz bottles
 */
function parseUnits(items: any[]) {
  let bottles = 0;
  let gallons = 0;

  for (const item of items) {
    const name = String(item?.name ?? "").toLowerCase();
    const qtyRaw = item?.quantity ?? item?.qty ?? 1;
    const qty = Number.isFinite(Number(qtyRaw))
      ? Math.max(1, Number(qtyRaw))
      : 1;

    if (name.includes("gallon")) {
      gallons += qty;
    } else {
      // default everything else to bottles so there's always weight/dims
      bottles += qty;
    }
  }

  return { bottles, gallons };
}

function buildParcelsFromCounts(bottles: number, gallons: number) {
  const parcels: any[] = [];

  // handle gallons first
  let gLeft = Math.max(0, Math.round(gallons));
  const gMax = Math.max(...Object.keys(gallonConfig).map(Number));
  while (gLeft > 0) {
    const chunk = Math.min(gLeft, gMax);
    const rule = gallonConfig[chunk] ?? gallonConfig[gMax];
    parcels.push({
      length: rule.box.length,
      width: rule.box.width,
      height: rule.box.height,
      distance_unit: "in",
      weight: Math.max(1, Math.round(rule.weightLbs * 16)), // oz
      mass_unit: "oz",
    });
    gLeft -= chunk;
  }

  // handle bottles next
  let bLeft = Math.max(0, Math.round(bottles));
  const bMax = Math.max(...Object.keys(bottleConfig).map(Number));
  while (bLeft > 0) {
    const chunk = Math.min(bLeft, bMax);
    const rule = bottleConfig[chunk] ?? bottleConfig[bMax];
    parcels.push({
      length: rule.box.length,
      width: rule.box.width,
      height: rule.box.height,
      distance_unit: "in",
      weight: Math.max(1, Math.round(rule.weightLbs * 16)), // oz
      mass_unit: "oz",
    });
    bLeft -= chunk;
  }

  // fallback if necessary
  if (!parcels.length) {
    parcels.push({
      length: 7,
      width: 7,
      height: 14,
      distance_unit: "in",
      weight: 16, // 1 lb
      mass_unit: "oz",
    });
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
    if (toAddress.country !== "US") {
      return NextResponse.json(
        {
          rates: [],
          error: "We currently only ship within the United States.",
        },
        { status: 200 }
      );
    }

    if (!toAddress.zip) {
      return NextResponse.json(
        {
          rates: [],
          error: "Please enter a valid U.S. ZIP code.",
        },
        { status: 200 }
      );
    }

    const items: any[] = Array.isArray(body?.items) ? body.items : [];

    // use product-name logic
    const { bottles, gallons } = parseUnits(items);
    const parcels = buildParcelsFromCounts(bottles, gallons);

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
        { status: 200 }
      );
    }

    const shipment = await resp.json();
    const rawRates: any[] = Array.isArray(shipment?.rates) ? shipment.rates : [];

    // 1) try strict UPS Ground first
    let usableRates = rawRates.filter((r) => {
      const token = String(r?.servicelevel?.token ?? "").toLowerCase();
      return r.currency === "USD" && token === "ups_ground";
    });

    // TODO: check if this is what they want
    // 2) if that returns nothing but there ARE UPS rates, fall back to "any UPS" so there's something
    if (!usableRates.length) {
      const upsAny = rawRates.filter((r) => {
        const provider = String(r.provider ?? "").toUpperCase();
        return r.currency === "USD" && provider.includes("UPS");
      });
      usableRates = upsAny;
    }

    // 3) if there's still nothing, return a clear error
    if (!usableRates.length) {
      const messages = Array.isArray(shipment?.messages)
        ? shipment.messages
            .map((m: any) => m?.text || m?.code || JSON.stringify(m))
            .join(" | ")
        : "No messages from Shippo";

      console.error("No usable UPS rates from Shippo", {
        toAddress,
        parcels,
        rawRatesCount: rawRates.length,
        shipmentMessages: shipment?.messages,
      });

      return NextResponse.json(
        {
          rates: [],
          error:
            "No UPS shipping rates were returned for this address. Error: " +
            messages,
        },
        { status: 200 }
      );
    }

    const rates = usableRates
      .map((r) => {
        const est = Number(r.estimated_days) || undefined;
        return {
          id: String(r.object_id),
          label: r?.servicelevel?.name
            ? `UPS ${r.servicelevel.name}`
            : r?.servicelevel?.token
            ? `UPS ${r.servicelevel.token}`
            : "UPS",
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
      { status: 200 }
    );
  }
}
