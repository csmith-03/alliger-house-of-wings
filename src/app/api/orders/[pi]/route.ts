// API route: gets a PaymentIntent by id (pi) and returns details including variant prices.

import { NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";

function variantName(base: string, price: any) {
  const nn = (price?.nickname || "").toLowerCase();
  if (nn === "single") return `${base} (12oz)`;
  if (nn === "gallon") return `${base} (Gallon)`;
  return base;
}

// FIX: use destructured second arg; Next.js rejects a named second parameter.
export async function GET(request: Request, { params }: { params: { pi: string } }) {
  try {
    const piId = params.pi;
    if (!piId) {
      return NextResponse.json({ error: "missing pi" }, { status: 400 });
    }

    const pi = await stripe.paymentIntents.retrieve(piId, {
      expand: ["shipping"],
    });

    const md = pi.metadata || {};
    let cart: Array<{
      id: string;
      name: string;
      quantity: number;
      unitAmount: number;
      image?: string | null;
      priceId?: string | null;
    }> = [];

    try {
      const raw = String(md.cart ?? "[]");
      const arr = JSON.parse(raw);
      if (Array.isArray(arr)) {
        const metaItems = arr
          .map((x: any) => ({
            productId: String(x.productId || x.id || ""),
            priceId: x.priceId ? String(x.priceId) : null,
            quantity: Number(x.quantity ?? x.qty ?? 1),
          }))
          .filter((x) => x.productId);

        cart = await Promise.all(
          metaItems.map(async ({ productId, priceId, quantity }) => {
            const product = await stripe.products.retrieve(productId);
            let unitAmount = 0;
            let name = product.name;

            if (priceId) {
              try {
                const price = await stripe.prices.retrieve(priceId);
                if (price.unit_amount) {
                  unitAmount = price.unit_amount;
                  name = variantName(product.name, price);
                }
              } catch {}
            }

            if (!unitAmount && product.default_price) {
              const defPrice =
                typeof product.default_price === "string"
                  ? await stripe.prices.retrieve(product.default_price)
                  : product.default_price;
              if (defPrice?.unit_amount) {
                unitAmount = defPrice.unit_amount;
              }
            }

            return {
              id: product.id,
              name,
              quantity:
                Number.isFinite(quantity) && quantity > 0
                  ? Math.round(quantity)
                  : 1,
              unitAmount,
              image:
                (Array.isArray(product.images) && product.images[0]) || null,
              priceId,
            };
          })
        );
      }
    } catch {
      cart = [];
    }

    return NextResponse.json({
      id: pi.id,
      amount: pi.amount,
      currency: pi.currency,
      shipping: pi.shipping,
      subtotal: Number(md.subtotal ?? 0),
      shipping_cents: Number(md.shipping ?? 0),
      tax: Number(md.tax ?? 0),
      rate_id: md.rate_id ?? "",
      cart,
      status: pi.status,
    });
  } catch (err: any) {
    console.error("orders/[pi] GET error:", err);
    return NextResponse.json(
      { error: err?.message ?? "failed" },
      { status: 500 }
    );
  }
}