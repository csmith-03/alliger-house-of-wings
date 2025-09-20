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

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Accept both shapes just in case
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

    // Basic guard: only US for now; require ZIP
    if (toAddress.country !== "US" || !toAddress.zip) {
      return NextResponse.json({ rates: [] }, { status: 200 });
    }

    const items: any[] = Array.isArray(body?.items) ? body.items : [];
    const totalWeightOz = items.reduce((sum, li) => {
      const qty = Math.max(1, Number(li?.quantity ?? li?.qty ?? 1));
      const oz = Number(li?.weightOz ?? 0);
      return sum + qty * oz;
    }, 0);

    const parcel = {
      length: 8,
      width: 6,
      height: 4,
      distance_unit: "in",
      weight: Math.max(1, Math.round(totalWeightOz || 1)),
      mass_unit: "oz",
    };

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

    // Only USPS, and map to the shape the UI expects
    const wanted = new Set([
      "usps_ground_advantage",
      "usps_priority",
      "usps_priority_express",
    ]);

    const rates = rawRates
      .filter((r) => r.currency === "USD" && r.provider === "USPS")
      .filter((r) => wanted.has(r?.servicelevel?.token))
      .map((r) => {
        const est = Number(r.estimated_days) || undefined;
        return {
          id: String(r.object_id),
          label: r?.servicelevel?.name || r?.servicelevel?.token || "USPS",
          amount: Math.round(Number(r.amount) * 100), // cents
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
