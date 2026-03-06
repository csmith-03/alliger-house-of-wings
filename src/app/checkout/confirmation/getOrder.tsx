"use server";

import { stripe } from "@/lib/stripe";

function variantName(base: string, price: any) {
  const nn = (price?.nickname || "").toLowerCase();
  if (nn === "single") return `${base} (12oz)`;
  if (nn === "gallon") return `${base} (Gallon)`;
  return base;
}

export async function getOrder(pi: string) {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(pi, {
      expand: ["shipping"],
    });

    const md = paymentIntent.metadata || {};
    let cart: any[] = [];

    try {
      const raw = Object.keys(md)
        .filter((k) => k === "cart" || k.startsWith("cart_"))
        .sort()
        .map((k) => {
          try { return JSON.parse(String(md[k] ?? "[]")); } catch { return []; }
        })
        .flat();

      const metaItems = raw
        .map((x: any) => ({
          productId: String(x.productId || x.p || x.id || ""),
          priceId: (x.priceId || x.r) ? String(x.priceId || x.r) : null,
          quantity: Number(x.quantity ?? x.q ?? 1),
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
            if (defPrice?.unit_amount) unitAmount = defPrice.unit_amount;
          }

          return {
            id: `${product.id}:${priceId ?? "default"}`,
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
    } catch {
      cart = [];
    }

    return {
      id: paymentIntent.id,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      shipping: paymentIntent.shipping,
      subtotal: Number(md.subtotal ?? 0),
      shipping_cents: Number(md.shipping ?? 0),
      tax: Number(md.tax ?? 0),
      rate_id: md.rate_id ?? "",
      ship_days_min: md.ship_days_min ? Number(md.ship_days_min) : null,
      ship_days_max: md.ship_days_max ? Number(md.ship_days_max) : null,
      cart,
      status: paymentIntent.status,
    };
  } catch {
    return null;
  }
}