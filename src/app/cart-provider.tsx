"use client";
import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export interface CartItem {
  productId: string;
  priceId: string | null;
  name: string;
  price: number | null; // cents
  currency: string | null;
  image?: string | null;
  qty: number;
}

interface CartCtx {
  items: CartItem[];
  add: (item: Omit<CartItem,"qty">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  currency: string | null;
  shippingRate: any;
  setShippingRate: (rate: any) => void;
}
const CartContext = createContext<CartCtx | null>(null);
const LS_KEY = "how_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [shippingRate, setShippingRate] = useState<any>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(LS_KEY, JSON.stringify(items));
    } catch {}
  }, [items]);

  function add(item: Omit<CartItem,"qty">, qty = 1) {
    setItems(prev => {
      // CHANGE: merge on productId + priceId (variant), not just productId
      const ex = prev.find(i => i.productId === item.productId && i.priceId === item.priceId);
      if (ex) {
        return prev.map(i =>
          i === ex ? { ...i, qty: i.qty + qty } : i
        );
      }
      return [...prev, { ...item, qty }];
    });
  }
  function remove(productId: string, priceId?: string | null) {
    // CHANGE: allow removing a specific variant; if priceId omitted remove all variants of product
    setItems(p =>
      priceId === undefined
        ? p.filter(i => i.productId !== productId)
        : p.filter(i => !(i.productId === productId && i.priceId === priceId))
    );
  }
  function setQty(productId: string, qty: number, priceId?: string | null) {
    if (qty <= 0) {
      return remove(productId, priceId);
    }
    setItems(p =>
      p.map(i =>
        i.productId === productId && (priceId === undefined || i.priceId === priceId)
          ? { ...i, qty }
          : i
      )
    );
  }
  function clear() { setItems([]); }

  const count = items.reduce((n,i)=>n+i.qty,0);
  const subtotal = items.reduce((s,i)=>s + (i.price||0)*i.qty,0);
  const currency = items[0]?.currency || null;

const value = useMemo(() => ({
    items,
    add,
    remove,        // NOTE: now accepts (productId, priceId?)
    setQty,        // NOTE: now accepts (productId, qty, priceId?)
    clear,
    count,
    subtotal,
    currency,
    shippingRate,
    setShippingRate,
  }), [items, count, subtotal, currency, shippingRate]);

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}
export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}