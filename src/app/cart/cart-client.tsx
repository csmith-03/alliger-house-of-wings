"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo } from "react";
import { useCart } from "../cart-provider";
import { money, shippingFor, taxFor } from "@/lib/order-math";  // <-- import

export default function CartClient() {
  const { items, setQty, remove, clear, subtotal, currency } = useCart();

  const shipping = useMemo(() => shippingFor(subtotal), [subtotal]);
  const tax = useMemo(() => taxFor(subtotal), [subtotal]);
  const total = useMemo(() => subtotal + shipping + tax, [subtotal, shipping, tax]);

  if (!items.length) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-gray-600">Your cart is empty.</p>
        <Link href="/" className="mt-4 underline">Continue shopping</Link>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <ul className="space-y-4">
        {items.map(it => (
          <li key={it.productId} className="flex gap-4 items-center">
            <div className="relative w-20 h-16 overflow-hidden rounded">
              {it.image && <Image src={it.image} alt={it.name ?? ""} fill className="object-cover" sizes="80px" />}
            </div>

            <div className="flex-1">
              <p className="font-medium">{it.name}</p>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={it.qty}
                  onChange={e => setQty(it.productId, parseInt(e.target.value || "1", 10))}
                  className="w-16 rounded border border-foreground/20 bg-background px-2 py-1 text-sm"
                />
                <button onClick={() => remove(it.productId)} className="text-xs text-foreground/60 hover:text-foreground">
                  Remove
                </button>
              </div>
            </div>

            {/* Price only — no currency code suffix, no line total */}
            <div className="text-right">
              <div className="text-sm text-foreground/60">
                {it.price != null ? money(it.price, currency ?? "USD") : "--"}
              </div>
            </div>
          </li>
        ))}
      </ul>

      {/* Order summary */}
      <div className="mt-6 border-t pt-4 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Subtotal</span>
          <span className="font-medium">{money(subtotal, currency ?? "USD")}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-foreground/70">
            Shipping {subtotal >= 75_00 ? "(free over $75.00)" : ""}
          </span>
          <span className="font-medium">{shipping === 0 ? "Free" : money(shipping, currency ?? "USD")}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-foreground/70">Tax (est.)</span>
          <span className="font-medium">{money(tax, currency ?? "USD")}</span>
        </div>

        <div className="flex items-center justify-between border-t pt-4 text-base">
          <span className="font-semibold">Total (est.)</span>
          <span className="font-semibold">{money(total, currency ?? "USD")}</span>
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <button onClick={clear} className="text-sm underline hover:text-foreground">Clear cart</button>
        <Link href="/" className="text-sm underline hover:text-foreground">Continue shopping</Link>
      </div>

      <p className="mt-3 text-xs text-foreground/60">
        Prices shown in USD. Shipping &amp; tax will be finalized at payment.
      </p>
    </div>
  );
}