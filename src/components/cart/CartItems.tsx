"use client";

import { sanitizeLine, money } from "@/lib/order-math";
import { useCart } from "@/app/cart-provider";
import { Trash2 } from "lucide-react";

type Props = {
  items: any[]; // normalized or raw; we sanitize each line anyway
};

export default function CartItems({ items }: Props) {
  const { setQty, remove } = useCart();

  if (!items?.length) {
    return <p className="text-foreground/90">Your cart is empty.</p>;
  }

  return (
    <ul className="space-y-2.5">
      {items.map((raw: any) => {
        const it = sanitizeLine(raw);
        const lineTotal = it.unitAmount * it.quantity;
        const pid = it.productId ?? it.id;
        const img = it.image ?? raw?.image ?? null;

        return (
          <li
            key={pid}
            className="relative rounded-md border border-[color:var(--surface-border)] bg-surface p-2.5 sm:p-3"
          >
            <button
              onClick={() => remove(pid)}
              className="absolute right-2.5 top-2.5 inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs
                         border-maroon/30 text-maroon bg-maroon/5 hover:bg-maroon/10"
              aria-label={`Remove ${it.name} from cart`}
              title="Remove"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </button>

            <div className="grid grid-cols-[auto,1fr,auto] items-start gap-3">
              {img ? (
                <img
                  src={img}
                  alt={it.name ?? "Item image"}
                  className="h-12 w-12 sm:h-14 sm:w-14 rounded object-cover border border-[color:var(--surface-border)]"
                />
              ) : (
                <div className="h-12 w-12 sm:h-14 sm:w-14 rounded border border-[color:var(--surface-border)] bg-[color:var(--surface-muted)]" />
              )}

              <div className="pr-16">
                <div className="font-medium text-foreground leading-snug">{it.name}</div>

                <div className="mt-0.5 text-sm text-foreground/80">
                  Price: ${money(it.unitAmount)}
                </div>

                <div className="mt-0.5 text-sm text-foreground/80">
                  Qty:
                  <select
                    aria-label={`Quantity for ${it.name}`}
                    className="ml-2 rounded border border-[color:var(--surface-border)] bg-transparent px-2 py-1"
                    value={it.quantity}
                    onChange={(e) => setQty(pid, Number(e.target.value))}
                  >
                    {Array.from({ length: 20 }, (_, i) => i + 1).map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="text-right min-w-[5.5rem]">
                <div className="font-semibold text-foreground leading-snug">
                  ${money(lineTotal)}
                </div>
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
