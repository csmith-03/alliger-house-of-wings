/**
 * ClearCartOnArrival
 *
 * Purpose:
 *   Cleanup component that clears any persisted/cart state
 *   the moment this page mounts (on order confirmation page).
 *
 * Behavior:
 *   - Runs once on mount (guards with a ref).
 *   - Wipes known/local cart keys from localStorage, sessionStorage, and cookies.
 *   - Also clears the in-memory cart via CartProvider (clear/remove).
 *   - Repeats cleanup in micro/next ticks (setTimeout 0 & 200ms) to handle
 *     any late writes from other effects/components.
 *
 * Inputs/Outputs:
 *   - No props. Returns null; it’s purely a side-effect component.
 */

"use client";

import { useEffect, useRef } from "react";
import { useCart } from "@/app/cart-provider";

export default function ClearCartOnArrival() {
  // pull cart state from context
  const { items, clear, remove } = useCart() as {
    items: any[];
    clear?: () => void;
    remove?: (id: string) => void;
  };

  // only runs once per mount
  const didRun = useRef(false);

  useEffect(() => {
    if (didRun.current) return;
    didRun.current = true;

    // wipe known cart keys from storage/cookies
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
          // remove any other local storage keys with "cart" in them
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
        // clear sessionStorage keys with "cart" in them
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
        // clear cookies with "cart" in the name
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

    // clear react/cart state
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

    // run cleanup immediately and in a couple follow-ups
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
