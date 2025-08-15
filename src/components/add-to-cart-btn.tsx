"use client";
import { useState } from "react";
import { useCart } from "../app/cart-provider";

interface Props {
  product: {
    productId: string;
    priceId: string | null;
    name: string;
    price: number | null;
    currency: string | null;
    image?: string | null;
  };
}
export default function AddToCartButton({ product }: Props) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);
  function onClick() {
    add(product);
    setAdded(true);
    setTimeout(()=>setAdded(false), 1400);
  }
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
        added ? "bg-foreground text-background" : "bg-maroon text-pure hover:brightness-110"
      }`}
    >
      {added ? "Added" : "Add to Cart"}
    </button>
  );
}