import Stripe from "stripe";
import { stripe } from "./stripeclient";

const BAR: Record<string,string> = { maroon:"bg-maroon", fire:"bg-fire", rooster:"bg-rooster" };

export interface SauceItem {
  id: string;
  name: string;
  desc: string;
  barClass: string;
  price: number | null;
  currency: string | null;
  priceId: string | null;
  image: string | null;
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

  const mapped = products.data.map(p => {
    const defaultPrice = p.default_price as Stripe.Price | null;
    const img = p.images && p.images.length > 0 ? p.images[0] : null;
    return {
      id: p.id,
      name: p.name,
      desc: p.metadata.flavor_description || p.description || "",
      barClass: BAR[(p.metadata.bar_color || "").toLowerCase()] || "bg-maroon",
      price: defaultPrice?.unit_amount ?? null,
      currency: defaultPrice?.currency ?? null,
      priceId: defaultPrice?.id || null,
      image: img,
    };
  });

  console.log("[getSauceProducts] mapped items:", mapped.length);
  return mapped;
}