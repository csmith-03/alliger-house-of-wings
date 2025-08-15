"use client";
import { useCart } from "../../app/cart-provider";
import Image from "next/image";

export default function CartClient() {
  const { items, setQty, remove, clear, subtotal, currency, count } = useCart();
  if (!count) return <p className="mt-6 text-sm text-foreground/60">Cart is empty.</p>;
  return (
    <div className="mt-8 space-y-6">
      <ul className="space-y-4">
        {items.map(it => (
          <li key={it.productId} className="flex gap-4 items-center">
            {it.image && (
              <div className="relative w-20 h-16 overflow-hidden rounded">
                <Image src={it.image} alt={it.name} fill className="object-cover" sizes="80px" />
              </div>
            )}
            <div className="flex-1">
              <p className="font-medium">{it.name}</p>
              {it.price != null && <p className="text-xs text-foreground/60">{(it.price/100).toFixed(2)} {it.currency?.toUpperCase()}</p>}
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  value={it.qty}
                  onChange={e => setQty(it.productId, parseInt(e.target.value)||1)}
                  className="w-16 rounded border border-foreground/20 bg-background px-2 py-1 text-sm"
                />
                <button onClick={()=>remove(it.productId)} className="text-xs text-foreground/60 hover:text-foreground">
                  Remove
                </button>
              </div>
            </div>
            {it.price != null && <div className="text-sm">{((it.price*it.qty)/100).toFixed(2)}</div>}
          </li>
        ))}
      </ul>
      <div className="flex justify-between items-center pt-4 border-t border-foreground/10">
        <div className="text-sm">Subtotal: <span className="font-semibold">{(subtotal/100).toFixed(2)} {currency?.toUpperCase()}</span></div>
        <div className="flex gap-2">
            <button onClick={clear} className="rounded-full border border-foreground/20 px-4 py-1.5 text-xs font-medium hover:bg-foreground/5">Clear</button>
            <a href="/checkout" className="rounded-full bg-maroon text-pure px-5 py-2 text-sm font-semibold hover:brightness-110">Checkout</a>
        </div>
      </div>
    </div>
  );
}