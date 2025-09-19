// src/app/api/shipping/route.ts
import { NextResponse } from "next/server";

const ORIGIN = {
  name: "Alliger House of Wings",
  street1: process.env.SHIP_FROM_STREET!,
  city: process.env.SHIP_FROM_CITY!,
  state: process.env.SHIP_FROM_STATE!,
  zip: process.env.SHIP_FROM_ZIP!,
  country: "US",
  phone: process.env.SHIP_FROM_PHONE ?? undefined,
  email: process.env.SHIP_FROM_EMAIL ?? undefined,
};

export async function POST(req: Request) {
  try {
    const { toAddress, items } = await req.json();

    const totalWeightOz = (items ?? []).reduce(
      (sum: number, li: any) =>
        sum + Number(li.weightOz || 0) * Math.max(1, Number(li.quantity || 0)),
      0,
    );

    const parcel = {
      length: 8,
      width: 6,
      height: 4,
      distance_unit: "in",
      weight: Math.max(totalWeightOz, 1),
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
        address_to: {
          name: toAddress?.name ?? "",
          street1: toAddress?.line1,
          street2: toAddress?.line2 ?? "",
          city: toAddress?.city,
          state: toAddress?.state,
          zip: toAddress?.postal_code,
          country: toAddress?.country ?? "US",
        },
        parcels: [parcel],
        async: false,
      }),
    });

    if (!resp.ok) {
      const t = await resp.text();
      return NextResponse.json({ error: t || "Shippo error" }, { status: 400 });
    }

    const shipment = await resp.json();
    const rates: any[] = shipment?.rates ?? [];

    const uspsRates = rates
      .filter((r) => r.currency === "USD" && r.provider === "USPS")
      .filter((r) =>
        [
          "usps_ground_advantage",
          "usps_priority",
          "usps_priority_express",
        ].includes(r?.servicelevel?.token),
      )
      .map((r) => ({
        id: r.object_id,
        serviceName: r.servicelevel?.name ?? r.servicelevel?.token,
        amount: Math.round(Number(r.amount) * 100),
        estDays: r.estimated_days,
      }))
      .sort((a, b) => a.amount - b.amount);

    if (uspsRates.length === 0) {
      return NextResponse.json(
        { error: "No USPS rates available" },
        { status: 404 },
      );
    }

    return NextResponse.json({ options: uspsRates.slice(0, 3) });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "quote failed" },
      { status: 500 },
    );
  }
}
