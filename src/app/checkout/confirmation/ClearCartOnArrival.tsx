"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/app/cart-provider";

export default function ClearCartOnArrival({ pi }: { pi?: string }) {
  const done = useRef(false);
  const { clearCart, setItems } = useCart();

  useEffect(() => {
    if (done.current) return;
    if (!pi) return; // only clear when we know there's a real PI id

    try {
      if (typeof clearCart === "function") clearCart();
      else if (typeof setItems === "function") setItems([]);
      // If your provider persists in localStorage under a key, you can belt-and-suspenders clear it here:
      // localStorage.removeItem("your_cart_key");
    } finally {
      done.current = true;
    }
  }, [pi, clearCart, setItems]);

  return null;
}
