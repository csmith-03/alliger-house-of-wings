// src/app/api/shipping/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { address, items } = await req.json();

  // Example: Calculate parcel dimensions/weight from items
  const parcel = {
    length: 10,
    width: 7,
    height: 4,
    distance_unit: "in",
    weight: 2,
    mass_unit: "lb",
  };

  const to_address = { ...address, country: "US" };
  const from_address = {
    name: "Your Business",
    street1: "123 Main St",
    city: "YourCity",
    state: "NY",
    zip: "10001",
    country: "US",
    phone: "555-555-5555",
    email: "info@yourdomain.com",
  };

  const res = await fetch("https://api.goshippo.com/shipments/", {
    method: "POST",
    headers: {
      Authorization: `ShippoToken ${process.env.SHIPPO_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      address_from: from_address,
      address_to: to_address,
      parcels: [parcel],
      async: false,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    return NextResponse.json({ error: data }, { status: 400 });
  }
  return NextResponse.json({ rates: data.rates });
}