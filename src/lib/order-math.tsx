// All money in CENTS

export type CartLine = { price?: number; qty?: number };

export const SHIPPING_THRESHOLD = 75_00; // free shipping >= $75.00
export const FLAT_SHIP = 5_99;           // $5.99
export const TAX_RATE = 0.08;

export function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency })
    .format((cents || 0) / 100);
}

export function subtotalFrom(lines: CartLine[]) {
  return lines.reduce(
    (sum, l) => sum + Math.max(0, l.price ?? 0) * Math.max(1, l.qty ?? 1),
    0
  );
}

export function shippingFor(subtotal: number) {
  return subtotal === 0 || subtotal >= SHIPPING_THRESHOLD ? 0 : FLAT_SHIP;
}

export function taxFor(subtotal: number, rate = TAX_RATE) {
  return Math.round(subtotal * rate);
}

export function breakdown(lines: CartLine[]) {
  const subtotal = subtotalFrom(lines);
  const shipping = shippingFor(subtotal);
  const tax = taxFor(subtotal);
  const total = subtotal + shipping + tax;
  return { subtotal, shipping, tax, total };
}