/**
 * ConfirmationPage (Server Component)
 *
 * Purpose:
 *   - Show the order confirmation after Stripe redirects back.
 *   - Reads the PaymentIntent id from the URL (Stripe may send `payment_intent`).
 *   - Fetches normalized order details from our API: /api/orders/[pi]
 *   - Clears any lingering cart state via <ClearCartOnArrival /> (client side).
 *
 * Input:
 *   - searchParams: { pi?: string; payment_intent?: string }
 *
 * Behavior:
 *   - If no PI is present or the lookup fails, render a friendly "not found" state.
 *   - When available, render shipping address, purchased items, and a totals summary.
 *
 * Notes:
 *   - This is a **server component**; it renders once with data from the server.
 *   - Uses `cache: "no-store"` to ensure we always read the latest order.
 */
"use client";
import Link from "next/link";
import ClearCartOnArrival from "./ClearCartOnArrival";
import { getThemeClasses } from "@/components/class-themes";
import { useTheme } from "@/app/theme-provider";
import { getOrder } from "./getOrder";
import { useEffect, useState } from "react";
import React from "react";
import { Loader2 } from "lucide-react";

type Props = { searchParams: { pi?: string; payment_intent?: string } };

export default function ConfirmationPage({ searchParams }: Props) {
  const { theme } = useTheme?.() ?? { theme: "dark" };
  const themeClass = getThemeClasses(theme);

  const pi = searchParams.pi || searchParams.payment_intent || "";
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(!!pi);

  const redirectStatus = (searchParams as any)?.redirect_status || "";
  const failedRedirect = redirectStatus && redirectStatus !== "succeeded";

  if (failedRedirect) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Payment was not completed</h1>
        <p className="mb-4">
          Your bank may have declined the charge or additional steps were required.
          Please review your details and try again.
        </p>
        <div className="space-x-3">
          <Link href={`/checkout?retry=1`} className="text-[#7a0d0d] underline">
            Return to checkout
          </Link>
          {pi ? (
            <Link href={`/checkout/confirmation?pi=${pi}`} className="text-[#7a0d0d] underline">
              Refresh order status
            </Link>
          ) : null}
        </div>
      </main>
    );
  }


  React.useEffect(() => {
    if (!pi) return;
    setLoading(true);
    getOrder(pi).then((data) => {
      setOrder(data);
      setLoading(false);
    });
  }, [pi]);

  if (!pi) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Order not found</h1>
        <p className="mb-6">
          We couldn&apos;t find a recent order. If you just paid, give it a
          second and refresh.
        </p>
        <Link href="/checkout" className="text-[#7a0d0d] underline">
          Back to checkout
        </Link>
      </main>
    );
  }

  if (loading) {
  return (
    <main className="max-w-3xl mx-auto p-6 flex flex-col items-center justify-center">
      <Loader2 className={`animate-spin h-8 w-8 ${themeClass.textMuted}`} />
    </main>
  );
}

  if (!order) {
    return (
      <main className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl font-semibold mb-4">Order not found</h1>
        <p className="mb-6">We couldn’t load your order details.</p>
        <Link href="/checkout" className="text-[#7a0d0d] underline">
          Back to checkout
        </Link>
      </main>
    );
  }

  // destructure fields returned by our /api/orders route
  const {
    id,
    amount,
    currency,
    shipping,
    subtotal,
    shipping_cents,
    tax,
    cart,
  } = order;

  const money = (cents: number) =>
    (Math.max(0, Math.round(cents)) / 100).toFixed(2);
  const shortId = id?.slice(-6)?.toUpperCase() ?? "—";

  const items: Array<{
    id: string;
    name: string;
    quantity: number;
    unitAmount: number; // cents
    image?: string | null;
  }> = cart ?? [];

  return (
    <main className="mx-auto max-w-4xl p-6">
      <ClearCartOnArrival />

      <h1 className="text-3xl font-bold mb-2">Thanks for your order!</h1>
      <p className={`${themeClass.textMuted} mb-6`}>
        Order <span className="font-mono">#{shortId}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        <section className="lg:col-span-2 space-y-4">
          <div className={`rounded-md border p-4 ${themeClass.surface}`}>
            <h2 className="text-lg font-semibold mb-3">Shipping To</h2>
            {shipping ? (
              <address className="not-italic text-sm leading-6">
                <div className="font-medium">{shipping.name}</div>
                <div>{shipping.address.line1}</div>
                {shipping.address.line2 ? (
                  <div>{shipping.address.line2}</div>
                ) : null}
                <div>
                  {shipping.address.city}, {shipping.address.state}{" "}
                  {shipping.address.postal_code}
                </div>
                <div>{shipping.address.country || "US"}</div>
              </address>
            ) : (
              <p className={themeClass.textMuted}>No shipping address found.</p>
            )}
          </div>

          <div className={`rounded-md border p-4 ${themeClass.surface}`}>
            <h2 className="text-lg font-semibold mb-3">Items</h2>
            {items.length === 0 ? (
              <p className={themeClass.textMuted}>No items captured.</p>
            ) : (
              <ul className="divide-y">
                {items.map((it) => {
                  const unit = Math.max(0, Math.round(Number(it.unitAmount) || 0));
                  const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
                  const line = unit * qty;
                  return (
                    <li
                      key={it.id}
                      className="py-3 flex items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-4">
                        {it.image ? (
                          <img
                            src={it.image}
                            alt={it.name ?? "Item image"}
                            className="h-12 w-12 rounded object-cover border"
                          />
                        ) : null}
                        <div>
                          <div className="font-medium">{it.name}</div>
                          <div className={`text-sm ${themeClass.textMuted}`}>
                            Qty: {qty}
                          </div>
                          <div className="text-xs text-gray-500">
                            (${(unit / 100).toFixed(2)} each)
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium">
                          ${(line / 100).toFixed(2)}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <Link
            href="/"
            className={`inline-block rounded-md border px-4 py-2 hover:bg-[color:var(--surface-muted)] ${themeClass.surface}`}
          >
            Continue shopping
          </Link>
        </section>

        <aside className="space-y-4">
          <div className={`rounded-md border p-4 ${themeClass.surface}`}>
            <h2 className="text-lg font-semibold mb-3">Order Summary</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt>Subtotal</dt>
                <dd>${money(subtotal ?? 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd>${money(shipping_cents ?? 0)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Tax</dt>
                <dd>${money(tax ?? 0)}</dd>
              </div>
              <div className="my-3 border-t" />
              <div className="flex justify-between text-base font-semibold">
                <dt>Total</dt>
                <dd>
                  ${money(amount ?? 0)} {currency?.toUpperCase()}
                </dd>
              </div>
            </dl>
          </div>
        </aside>
      </div>
    </main>
  );
}
