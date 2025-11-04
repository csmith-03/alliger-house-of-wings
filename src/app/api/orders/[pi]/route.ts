// API route: gets a PaymentIntent by id and returns relevant details

/**
 * GET /api/orders/[pi]
 *
 * Input:
 *   - pi (string): PaymentIntent ID, passed as a route parameter
 *
 * Behavior:
 *   - Retrieves the PaymentIntent from Stripe (expands shipping info)
 *   - Extracts relevant metadata (subtotal, shipping, tax, rate_id)
 *   - Parses and normalizes the "cart" array from metadata
 *
 * Output (200 OK):
 *   {
 *     id: string,               // Stripe PaymentIntent id
 *     amount: number,           // total amount in minor units (cents)
 *     currency: string,         // currency code (e.g., "usd")
 *     shipping: object|null,    // shipping { name, address } if present
 *     subtotal: number,         // subtotal in cents
 *     shipping_cents: number,   // shipping charge in cents
 *     tax: number,              // tax in cents
 *     rate_id: string,          // selected shipping rate id
 *     cart: Array<{             // parsed cart items from metadata
 *       id: string,
 *       name: string,
 *       quantity: number,
 *       unitAmount: number,
 *       image?: string|null
 *     }>,
 *     status: string            // Stripe PaymentIntent status
 *   }
 *
 * Errors:
 *   - 400 if pi param is missing
 *   - 500 for Stripe or parsing errors
 */

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

export async function GET(_: Request, { params }: { params: { pi: string } }) {
  try {
    // extract payment intent id from route params
    const piId = params.pi;
    if (!piId)
      return NextResponse.json({ error: "missing pi" }, { status: 400 });

    // retrieve the PaymentIntent from Stripe, include shipping info
    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["shipping"],
    });

    // parse metadata and cart details
    const md = pi.metadata || {};
    let cartParsed: Array<{
      id: string;
      name: string;
      quantity: number;
      unitAmount: number;
      image?: string | null;
    }> = [];

    try {
      // parse metadata.cart that is stored as JSON
      const raw = String(md.cart ?? "[]");
      const arr = JSON.parse(raw);

      // normalize each item into a predictable shape
      if (Array.isArray(arr)) {
        // step 1: normalize minimal items
        const metaItems = arr
          .map((x: any) => ({
            productId: String(x.productId ?? x.id ?? ""),
            quantity: Number(x.quantity ?? x.qty ?? 1),
          }))
          .filter((x) => x.productId);

        // step 2: reload from Stripe
        cartParsed = await Promise.all(
          metaItems.map(async ({ productId, quantity }) => {
            const product = await stripe.products.retrieve(productId);

            let unitAmount = 0;
            if (product.default_price) {
              const price =
                typeof product.default_price === "string"
                  ? await stripe.prices.retrieve(product.default_price)
                  : product.default_price;
              unitAmount = price?.unit_amount ?? 0;
            }

            return {
              id: product.id,
              name: product.name,
              quantity: Number.isFinite(quantity) ? Math.max(1, Math.round(quantity)) : 1,
              unitAmount,
              image:
                (Array.isArray(product.images) && product.images[0]) || null,
            };
          })
        );
      }
    } catch {
      // return empty cart if parsing fails
      cartParsed = [];
    }

    // return response object with important PaymentIntent info
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
