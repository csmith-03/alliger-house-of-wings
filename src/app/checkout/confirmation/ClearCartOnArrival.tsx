"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/app/cart-provider";

export default function ClearCartOnArrival() {
  const { items, clear, remove } = useCart() as {
    items: any[];
    clear?: () => void;
    remove?: (id: string) => void;
  };

  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    const nukeStorage = () => {
      try {
        if (typeof localStorage !== "undefined") {
          [
            "cart",
            "cartItems",
            "ahow_cart",
            "ahow-cart",
            "ahow.cart",
            "order_cart",
            "checkout_cart",
          ].forEach((k) => localStorage.removeItem(k));
          for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i)!;
            if (/cart/i.test(k)) {
              try {
                localStorage.removeItem(k);
                i--;
              } catch {}
            }
          }
        }
        if (typeof sessionStorage !== "undefined") {
          for (let i = 0; i < sessionStorage.length; i++) {
            const k = sessionStorage.key(i)!;
            if (/cart/i.test(k)) {
              try {
                sessionStorage.removeItem(k);
                i--;
              } catch {}
            }
          }
        }
        if (typeof document !== "undefined") {
          document.cookie
            .split(";")
            .map((c) => c.trim())
            .filter(Boolean)
            .forEach((cstr) => {
              const [name] = cstr.split("=");
              if (/cart/i.test(name)) {
                document.cookie = `${name}=; Max-Age=0; path=/`;
              }
            });
        }
      } catch {}
    };

    const clearReactState = () => {
      try {
        if (typeof clear === "function") {
          clear();
        } else if (
          Array.isArray(items) &&
          items.length &&
          typeof remove === "function"
        ) {
          const ids = items
            .map((it: any) => it?.id ?? it?.productId ?? it?.sku ?? it?.name)
            .filter(Boolean);
          ids.forEach((id) => {
            try {
              remove(id as string);
            } catch {}
          });
        }
      } catch {}
    };

    nukeStorage();
    clearReactState();
    setTimeout(() => {
      nukeStorage();
      clearReactState();
    }, 0);
    setTimeout(() => {
      nukeStorage();
      clearReactState();
    }, 200);
  }, []);

  return null;
}
