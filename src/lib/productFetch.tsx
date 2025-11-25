import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";

const BAR: Record<string, string> = {
  maroon: "bg-maroon",
  fire: "bg-fire",
  rooster: "bg-rooster",
};

export interface SaucePriceVariant {
  priceId: string;
  unitAmount: number;
  currency: string;
  size: string;          // "12oz" | "Gallon" | fallback
  displayLabel: string;  // e.g. "12oz - USD $9.99"
  isDefault: boolean;    // true only when there is exactly one variant
}

export interface SauceItem {
  id: string;
  name: string;
  desc: string;
  barClass: string;
  image: string | null;
  variants: SaucePriceVariant[];
  // Shortcut fields present ONLY when single variant (else null)
  price: number | null;
  currency: string | null;
  priceId: string | null;
}

function formatMoney(cents: number, currency: string) {
  return `${currency.toUpperCase()} $${(cents / 100).toFixed(2)}`;
}

function deriveSize(price: Stripe.Price): string {
  const nickname = (price.nickname || "").trim().toLowerCase();
  if (nickname === "single") return "12oz";
  if (nickname === "gallon") return "Gallon";

  const metaSize =
    price.metadata.size ||
    price.nickname ||
    price.metadata.volume ||
    "";
  let s = metaSize.trim().toLowerCase();

  s = s
    .replace(/single/gi, "12oz")
    .replace(/ounces?/g, "oz")
    .replace(/ounce/g, "oz")
    .replace(/bottle/gi, "12oz")
    .replace(/gal(ln)?/g, "gallon");

  if (/gallon/.test(s)) return "Gallon";
  if (/12\s?oz/.test(s)) return "12oz";

  const m = s.match(/^(\d+)\s?oz$/);
  if (m) return `${m[1]}oz`;

  // Fallbacks
  if (!s) return "12oz";
  return s;
}

export async function getSauceProducts(): Promise<SauceItem[]> {
  let products: Stripe.ApiList<Stripe.Product>;
  try {
    products = await stripe.products.list({
      active: true,
      limit: 100,
      expand: ["data.default_price"],
    });
  } catch {
    return [];
  }

  console.log(
    "[getSauceProducts] products:",
    products.data.map((p) => ({
      id: p.id,
      name: p.name,
      default_price:
        typeof p.default_price === "string"
          ? p.default_price
          : (p.default_price as Stripe.Price | null)?.id,
    }))
  );

  const items: SauceItem[] = [];

  for (const p of products.data) {
    let prices: Stripe.ApiList<Stripe.Price>;
    try {
      prices = await stripe.prices.list({
        product: p.id,
        active: true,
        limit: 50,
      });
    } catch {
      prices = { object: "list", data: [], url: "", has_more: false };
    }

    console.log(
      `[getSauceProducts] prices for product ${p.id}:`,
      prices.data.map((pr) => ({
        id: pr.id,
        unit_amount: pr.unit_amount,
        currency: pr.currency,
        nickname: pr.nickname,
        metadata_size: pr.metadata.size,
      }))
    );

    const rawVariants: SaucePriceVariant[] = prices.data
      .filter((pr) => pr.type === "one_time" && typeof pr.unit_amount === "number")
      .map((pr) => {
        const size = deriveSize(pr);
        return {
          priceId: pr.id,
          unitAmount: pr.unit_amount!,
          currency: pr.currency,
          size,
          displayLabel: `${size} - ${formatMoney(pr.unit_amount!, pr.currency)}`,
          isDefault: false, // set true only if this is the sole variant
        };
      })
      .sort((a, b) => a.unitAmount - b.unitAmount);

    if (rawVariants.length === 1) {
      rawVariants[0].isDefault = true;
    }

    const img = p.images?.[0] || null;
    const single = rawVariants.length === 1 ? rawVariants[0] : null;

    items.push({
      id: p.id,
      name: p.name,
      desc: p.metadata.flavor_description || p.description || "",
      barClass: BAR[(p.metadata.bar_color || "").toLowerCase()] || "bg-maroon",
      image: img,
      variants: rawVariants,
      price: single ? single.unitAmount : null,
      currency: single ? single.currency : null,
      priceId: single ? single.priceId : null,
    });
  }

  console.log(
    "[getSauceProducts] assembled items:",
    items.map((it) => ({
      id: it.id,
      name: it.name,
      variant_count: it.variants.length,
      single_variant_default: !!it.priceId,
    }))
  );

  return items;
}