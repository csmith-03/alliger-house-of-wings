import Stripe from "stripe";
import { NextResponse } from "next/server";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
});

export async function GET(_: Request, { params }: { params: { pi: string } }) {
  try {
    const piId = params.pi;
    if (!piId)
      return NextResponse.json({ error: "missing pi" }, { status: 400 });

    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["shipping"],
    });

    const md = pi.metadata || {};
    let cartParsed: Array<{
      id: string;
      name: string;
      quantity: number;
      unitAmount: number;
      image?: string | null;
    }> = [];

    try {
      const raw = String(md.cart ?? "[]");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        cartParsed = arr.map((x: any) => ({
          id: String(x.productId ?? x.id ?? ""),
          name: String(x.name ?? ""),
          quantity: Number(x.quantity ?? x.qty ?? 1),
          unitAmount: Number(x.unitAmount ?? x.price ?? 0),
          image: x.image ?? null,
        }));
      }
    } catch {
      cartParsed = [];
    }

    return NextResponse.json({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      shipping: pi.shipping, // { name, address }
      subtotal: Number(md.subtotal ?? 0),
      shipping_cents: Number(md.shipping ?? 0),
      tax: Number(md.tax ?? 0),
      rate_id: md.rate_id ?? "",
      cart: cartParsed, // array of { id, name, quantity, unitAmount }
      status: pi.status,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json(
      { error: err?.message ?? "failed" },
      { status: 500 },
    );
  }
}
