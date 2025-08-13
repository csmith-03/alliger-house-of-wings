import { stripe } from "./stripeclient";
import type Stripe from "stripe";

const BAR: Record<string,string> = {
  maroon: "bg-maroon",
  fire: "bg-fire",
  rooster: "bg-rooster",
};

export interface SauceItem {
  id: string;
  name: string;
  desc: string;
  barClass: string;
  price: number | null;
  currency: string | null;
  priceId: string | null;
}

export async function getSauceProducts(): Promise<SauceItem[]> {
  console.log("[getSauceProducts] start");
  let products: Stripe.ApiList<Stripe.Product>;
  try {
    products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });
  } catch (e) {
    console.error("[getSauceProducts] stripe.products.list error:", e);
    return [];
  }

  console.log("[getSauceProducts] fetched count:", products.data.length);

  // Lightweight, readable snapshot (no giant objects)
  console.dir(
    products.data.map(p => ({
      id: p.id,
      name: p.name,
      metadata: p.metadata,
      default_price_id: (p.default_price as Stripe.Price | null)?.id || null,
      amount: (p.default_price as Stripe.Price | null)?.unit_amount || null,
      currency: (p.default_price as Stripe.Price | null)?.currency || null,
    })),
    { depth: null }
  );

  const mapped = products.data.map(p => {
    const defaultPrice = p.default_price as Stripe.Price | null;
    return {
      id: p.id,
      name: p.name,
      desc: p.metadata.flavor_description || p.description || "",
      barClass: BAR[(p.metadata.bar_color || "").toLowerCase()] || "bg-maroon",
      price: defaultPrice?.unit_amount ?? null,
      currency: defaultPrice?.currency ?? null,
      priceId: defaultPrice?.id || null,
    };
  });

  console.log("[getSauceProducts] mapped items:", mapped.length);
  return mapped;
}