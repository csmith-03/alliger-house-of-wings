/**
 * POST /api/stripe
 *
 * Input (JSON body):
 *   {
 *     items: CartLine[],     // cart items with id, name, qty, price, etc.
 *     currency?: string,     // currency code, defaults to "usd"
 *     shipCents?: number,    // shipping cost in cents
 *     address?: {            // optional shipping address
 *       name?: string,
 *       line1?: string,
 *       line2?: string,
 *       city?: string,
 *       state?: string,
 *       postal_code?: string,
 *       country?: string
 *     },
 *     rateId?: string        // optional shipping rate id
 *   }
 *
 * Behavior:
 *   - Sanitizes cart items and computes subtotal.
 *   - Validates/rounds shipping cost and calculates tax estimate.
 *   - Ensures total amount is an integer >= 50 cents (Stripe requirement).
 *   - Creates a PaymentIntent with automatic payment methods.
 *   - Embeds metadata (subtotal, shipping, tax, rate_id, cart JSON).
 *
 * Output (200 OK):
 *   {
 *     clientSecret: string   // Stripe client_secret for the PaymentIntent
 *   }
 *
 * Errors:
 *   - 500 with { error } if Stripe or calculation fails.
 */

import { NextResponse } from "next/server";
import { breakdown, sanitize, estimateTax, CartLine } from "@/lib/order-math";
import { stripe } from "@/lib/stripe";


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

    const amount = Math.max(50, Math.round(total));

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
        rate_id: rateId || "",
        cart: JSON.stringify(
          safeItems.map((it) => ({
            productId: String(it.productId ?? it.id),
            quantity: Number(it.qty ?? it.quantity ?? 1),
          }))
        ),
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
