export type CartLine = Record<string, any>;

const TAX_RATE = Number(process.env.TAX_RATE ?? 0);
const TAX_APPLY_TO_SHIPPING =
  String(process.env.TAX_APPLY_TO_SHIPPING ?? "false").toLowerCase() === "true";
const TAX_ORIGIN_STATE = String(
  process.env.TAX_ORIGIN_STATE ?? "",
).toUpperCase();

export function money(cents: number): string {
  const safe = Number.isFinite(cents) ? Math.max(0, Math.round(cents)) : 0;
  return (safe / 100).toFixed(2);
}

function toCentsFlexible(v: unknown): number {
  if (v === null || v === undefined) return 0;
  let n = typeof v === "string" ? Number(v) : (v as number);
  if (!Number.isFinite(n)) return 0;
  if (!Number.isInteger(n) || Math.abs(n) < 100) n = Math.round(n * 100); // dollars→cents
  return Math.round(n);
}
function toInt(v: unknown, fallback = 0): number {
  const n = Number(v);
  return Number.isFinite(n) ? Math.round(n) : fallback;
}
function pickFirst<T = any>(
  obj: Record<string, any>,
  keys: string[],
  fallback?: T,
): T {
  for (const k of keys)
    if (obj[k] !== undefined && obj[k] !== null) return obj[k] as T;
  return fallback as T;
}

export function sanitizeLine(raw: CartLine) {
  const id = String(pickFirst(raw, ["id", "sku", "productId", "slug"], "item"));
  const name = String(pickFirst(raw, ["name", "title", "label"], "Item"));
  const quantity = Math.max(
    1,
    toInt(pickFirst(raw, ["quantity", "qty", "count"], 1), 1),
  );
  const unitAmount = toCentsFlexible(
    pickFirst(
      raw,
      [
        "unitAmount",
        "unit_amount",
        "priceCents",
        "amountCents",
        "unitPriceCents",
        "unit_price_cents",
        "price",
        "amount",
        "unit_price",
        "unitPrice",
      ],
      0,
    ),
  );

  const image =
    (pickFirst(raw, ["image", "imageUrl", "imageURL", "img"], null) as
      | string
      | null) || null;

  return {
    id,
    name,
    quantity,
    unitAmount,
    image,
    weightOz: toInt(
      pickFirst(raw, ["weightOz", "weight_oz", "weight", "oz"], 0),
      0,
    ),
    lengthIn: toInt(pickFirst(raw, ["lengthIn", "length_in", "length"], 0), 0),
    widthIn: toInt(pickFirst(raw, ["widthIn", "width_in", "width"], 0), 0),
    heightIn: toInt(pickFirst(raw, ["heightIn", "height_in", "height"], 0), 0),
  };
}
export function sanitize(lines: CartLine[]): ReturnType<typeof sanitizeLine>[] {
  return (lines ?? []).map(sanitizeLine);
}
export function subtotalFrom(lines: CartLine[]): number {
  const xs = sanitize(lines);
  return xs.reduce((sum, li) => sum + li.unitAmount * li.quantity, 0);
}

/** Estimate tax given the destination address (state-aware) */
export function estimateTax(opts: {
  subTotal: number;
  shippingCents: number;
  toAddress?: { state?: string | null } | null;
}): number {
  const toState = String(opts.toAddress?.state ?? "").toUpperCase();
  const shouldTax = TAX_ORIGIN_STATE ? toState === TAX_ORIGIN_STATE : true; // if no origin configured, apply flat TAX_RATE everywhere
  if (!shouldTax || TAX_RATE <= 0) return 0;

  const base = TAX_APPLY_TO_SHIPPING
    ? opts.subTotal + opts.shippingCents
    : opts.subTotal;

  return Math.round(base * TAX_RATE);
}

/** Simple breakdown that assumes flat TAX_RATE; use estimateTax for address-aware. */
export function breakdown(lines: CartLine[], shippingCents = 0) {
  const ship = Number.isFinite(shippingCents)
    ? Math.max(0, Math.round(shippingCents))
    : 0;
  const subtotal = subtotalFrom(lines);
  // Default: address-agnostic; callers doing address-aware calcs should call estimateTax instead.
  const tax = Math.round(
    (TAX_APPLY_TO_SHIPPING ? subtotal + ship : subtotal) * TAX_RATE,
  );
  const total = subtotal + ship + tax;
  return { subtotal, shipping: ship, tax, total };
}
