import Stripe from "stripe";
import { NextResponse } from "next/server";
import { breakdown, CartLine } from "@/lib/order-math"; // <-- shared math

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const { items = [], currency = "usd", shippingRate } = await req.json();

    const shipping = shippingRate?.amount
      ? Math.round(parseFloat(shippingRate.amount) * 100)
      : 0;

    const subtotal = items.reduce((s, i) => s + (i.price || 0) * i.qty, 0);
    const tax = Math.round(subtotal * 0.08);
    const total = subtotal + shipping + tax;

    const pi = await stripe.paymentIntents.create({
      amount: total,
      currency,
      automatic_payment_methods: { enabled: true },
      metadata: {
        subtotal: String(subtotal),
        shipping: String(shipping),
        tax: String(tax),
        total: String(total),
        cart: JSON.stringify(items).slice(0, 4900),
      },
    });

    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err?.message ?? "failed" }, { status: 500 });
  }
}