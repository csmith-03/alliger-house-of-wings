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
}

const CartContext = createContext<CartCtx | null>(null);
const LS_KEY = "how_cart_v1";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

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

  function add(item: Omit<CartItem,"qty">, qty=1) {
    setItems(prev => {
      const ex = prev.find(i => i.productId === item.productId);
      if (ex) return prev.map(i => i.productId === item.productId ? { ...i, qty: i.qty + qty } : i);
      return [...prev, { ...item, qty }];
    });
  }
  function remove(productId: string) { setItems(p => p.filter(i => i.productId !== productId)); }
  function setQty(productId: string, qty: number) {
    if (qty <= 0) return remove(productId);
    setItems(p => p.map(i => i.productId === productId ? { ...i, qty } : i));
  }
  function clear() { setItems([]); }

  const count = items.reduce((n,i)=>n+i.qty,0);
  const subtotal = items.reduce((s,i)=>s + (i.price||0)*i.qty,0);
  const currency = items[0]?.currency || null;

  const value = useMemo(()=>({ items, add, remove, setQty, clear, count, subtotal, currency }), [items, count, subtotal, currency]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used within CartProvider");
  return c;
}