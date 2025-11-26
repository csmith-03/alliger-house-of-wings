"use client";

import { useState } from "react";
import Image from "next/image";
import { useCart } from "@/app/cart-provider";

export default function ProductCard({ product }: { product: any }) {
  const { add } = useCart();
  const variants = product.variants || [];
  const [added, setAdded] = useState(false);
  const [chosen, setChosen] = useState(
    variants.length === 1 ? variants[0] : null
  );

  return (
    <article className="card overflow-hidden">
      <div className={`h-1 ${product.barClass}`} />
      {product.image && (
        <div className="relative w-full aspect-[4/3] overflow-hidden">
          <Image
            src={product.image}
            alt={product.name}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width:768px) 100vw, (max-width:1200px) 33vw, 300px"
          />
        </div>
      )}
      <div className="card-body pt-5">
        <h3 className="font-semibold text-lg">{product.name}</h3>
        {product.desc && (
          <p className="mt-1 text-sm text-foreground/70">
            {product.desc || "Delicious house-made wing sauce."}
          </p>
        )}

        {/* Variant selector */}
        <div className="mt-4 space-y-2">
          {variants.map((v: any) => (
            <button
              key={v.priceId}
              type="button"
              onClick={() => setChosen(v)}
              className={`w-full text-left rounded-md border px-3 py-2 text-sm ${
                chosen?.priceId === v.priceId
                  ? "border-amber-600 bg-amber-50 dark:bg-amber-900/30"
                  : "hover:bg-neutral-50 dark:hover:bg-neutral-800"
              }`}
            >
              {v.displayLabel}
            </button>
          ))}
          {variants.length > 1 && !chosen && (
            <p className="text-xs text-neutral-500">
              Select a size before adding to cart.
            </p>
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {chosen && (
            <span className="text-sm text-foreground/60">
              {(chosen.unitAmount / 100).toFixed(2)}{" "}
              {chosen.currency.toUpperCase()}
            </span>
          )}
          <button
            type="button"
            disabled={!chosen}
            onClick={() => {
              if (!chosen) return;
              add(
                {
                  productId: product.id,
                  priceId: chosen.priceId,
                  name: `${product.name} (${chosen.size})`,
                  price: chosen.unitAmount,
                  currency: chosen.currency,
                  image: product.image,
                },
                1
              );
              setAdded(true);
              // Revert after 1.5s
              window.clearTimeout((window as any).__aw_added_to_cart_timeout);
              (window as any).__aw_added_to_cart_timeout = window.setTimeout(
                () => {
                  setAdded(false);
                },
                1500
              );
            }}
            className={[
              "rounded-md px-4 py-2 text-sm font-medium disabled:opacity-50 transition-colors",
              added
                ? "bg-amber-600 text-white hover:brightness-110"
                : "bg-[#7a0d0d] text-white hover:brightness-110",
            ].join(" ")}
          >
            {added ? "Added" : chosen ? `Add ${chosen.size}` : "Select a size"}
          </button>
        </div>
      </div>
    </article>
  );
}
