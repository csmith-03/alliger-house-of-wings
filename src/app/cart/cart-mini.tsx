"use client";
import { useCart } from "../../app/cart-provider";
import Link from "next/link";

export default function CartMini() {
  const { count, subtotal, currency } = useCart();
  return (
    <Link
      href="/cart"
      className="inline-flex items-center gap-2 rounded-full border border-foreground/20 px-4 py-1.5 text-sm hover:bg-foreground/5"
    >
      <span>Cart</span>
      <span className="inline-flex items-center justify-center rounded-full bg-maroon text-pure text-xs w-6 h-6">
        {count}
      </span>
      {count > 0 && (
        <span className="text-foreground/60">
          {(subtotal / 100).toFixed(2)} {currency?.toUpperCase()}
        </span>
      )}
    </Link>
  );
}