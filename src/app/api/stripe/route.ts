import Stripe from "stripe";
import { NextResponse } from "next/server";
import { breakdown, CartLine } from "@/lib/order-math"; // <-- shared math

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });

export async function POST(req: Request) {
  try {
    const { items = [], currency = "usd" } = await req.json();

    const { subtotal, shipping, tax, total } = breakdown(items as CartLine[]);

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