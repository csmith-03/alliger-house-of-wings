"use client";

import { sanitizeLine, money } from "@/lib/order-math";
import { useCart } from "@/app/cart-provider";

type Props = {
  items: any[]; // normalized or raw; we sanitize each line anyway
};

export default function CartItems({ items }: Props) {
  const { updateQuantity, removeItem } = useCart();

  if (!items?.length) {
    return <p className="text-gray-700">Your cart is empty.</p>;
  }

  return (
    <ul className="space-y-4">
      {items.map((raw: any) => {
        const it = sanitizeLine(raw);
        const lineTotal = it.unitAmount * it.quantity;

        return (
          <li
            key={it.id}
            className="flex items-start justify-between gap-4 rounded-lg border p-4"
          >
            <div className="flex-1">
              <div className="font-medium">{it.name}</div>
              <div className="mt-1 text-sm text-gray-600">
                Price: ${money(it.unitAmount)} · Qty:
                <select
                  className="ml-2 rounded border px-2 py-1"
                  value={it.quantity}
                  onChange={(e) =>
                    updateQuantity?.(it.id, Number(e.target.value))
                  }
                >
                  {Array.from({ length: 20 }, (_, i) => i + 1).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-right">
              <div className="font-semibold">${money(lineTotal)}</div>
              <button
                className="mt-2 text-sm text-red-600 hover:underline"
                onClick={() => removeItem?.(it.id)}
              >
                Remove
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
