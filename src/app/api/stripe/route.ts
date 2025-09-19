import Stripe from "stripe";
import { NextResponse } from "next/server";
import { breakdown, sanitize, estimateTax, CartLine } from "@/lib/order-math";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function POST(req: Request) {
  try {
    const {
      items = [],
      currency = "usd",
      shipCents = 0,
      address,
      rateId,
    } = await req.json();

    const safeItems = sanitize(items as CartLine[]);
    const ship = Number.isFinite(shipCents)
      ? Math.max(0, Math.round(shipCents))
      : 0;

    const base = breakdown(safeItems, 0); // subtotal only here
    const tax = estimateTax({
      subTotal: base.subtotal,
      shippingCents: ship,
      toAddress: address,
    });
    const total = base.subtotal + ship + tax;

    const amount = Math.max(50, Math.round(total)); // Stripe wants integer >= min

    const pi = await stripe.paymentIntents.create({
      amount,
      currency,
      automatic_payment_methods: { enabled: true },
      shipping: address
        ? {
            name: address.name || "",
            address: {
              line1: address.line1,
              line2: address.line2 || undefined,
              city: address.city,
              state: address.state,
              postal_code: address.postal_code,
              country: address.country || "US",
            },
          }
        : undefined,
      metadata: {
        subtotal: String(base.subtotal),
        shipping: String(ship),
        tax: String(tax),
        total: String(amount),
        rate_id: rateId || "",
        cart: JSON.stringify(safeItems).slice(0, 4900),
      },
    });

    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "failed" },
      { status: 500 },
    );
  }
}
