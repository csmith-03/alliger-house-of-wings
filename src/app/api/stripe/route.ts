export const runtime = "nodejs";

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
 *   - Fetches unit prices from Stripe if not provided.
 *   - Computes subtotal, shipping, and tax.
 *   - Creates a PaymentIntent with correct totals and minimal metadata.
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

    // normalize missing prices from Stripe
    const enriched = await Promise.all(
      safeItems.map(async (it) => {
        const productId = String(it.id);
        let unitAmount = Number(it.unitAmount ?? 0);

        // if unitAmount not provided, look up from Stripe
        if (!unitAmount || unitAmount <= 0) {
          const product = await stripe.products.retrieve(productId);
          if (product.default_price) {
            const price =
              typeof product.default_price === "string"
                ? await stripe.prices.retrieve(product.default_price)
                : product.default_price;
            unitAmount = price?.unit_amount ?? 0;
          }
        }

        return {
          ...it,
          id: productId,
          productId,
          unitAmount,
          quantity: Number(it.quantity ?? 1),
        };
      })
    );

    const ship = Number.isFinite(shipCents)
      ? Math.max(0, Math.round(shipCents))
      : 0;

    const base = breakdown(enriched, 0);
    const tax = estimateTax({
      subTotal: base.subtotal,
      shippingCents: ship,
      toAddress: address,
    });
    const total = base.subtotal + ship + tax;
    const amount = Math.max(50, Math.round(total));

    // create PaymentIntent with minimal metadata
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
          enriched.map((it) => ({
            productId: String(it.productId ?? it.id),
            quantity: Number(it.quantity ?? 1),
          }))
        ),
      },
    });

    return NextResponse.json({ clientSecret: pi.client_secret });
  } catch (err: any) {
    console.error("Stripe route error:", err);
    return NextResponse.json(
      { error: err?.message ?? "failed" },
      { status: 500 }
    );
  }
}
