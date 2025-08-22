"use client";

import { useEffect, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { useCart } from "../cart-provider";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function Form() {
  const stripe = useStripe();
  const elements = useElements();

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/success` },
    });
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={!stripe}
        className="w-full rounded-md bg-maroon text-white py-2.5 font-medium hover:brightness-110 disabled:opacity-50"
      >
        Pay
      </button>
    </form>
  );
}

export default function PaymentForm() {
  const { items, currency } = useCart();
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [err, setErr] = useState("");

  useEffect(() => {
    if (!items.length) { setClientSecret(null); setStatus("idle"); return; }
    setStatus("loading");

    const payload = {
      currency: (currency ?? "usd").toLowerCase(),
      items: items.map(i => ({
        id: i.productId,
        name: i.name,
        qty: i.qty,
        price: i.price ?? 0,
        image: i.image ?? "",
      })),
    };

    fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then(async r => {
        if (!r.ok) throw new Error(await r.text());
        return r.json();
      })
      .then(d => { setClientSecret(d.clientSecret); setStatus("ready"); })
      .catch(e => { setErr(String(e)); setStatus("error"); setClientSecret(null); });
  }, [items, currency]);

  if (status === "loading") return <div className="rounded-xl border bg-white p-6 shadow-sm">Preparing payment…</div>;
  if (status === "error")   return <div className="rounded-xl border bg-white p-6 shadow-sm text-red-600">Couldn’t start payment.<pre className="mt-2 text-xs whitespace-pre-wrap">{err}</pre></div>;
  if (!clientSecret)        return null;

  return (
    <div className="sticky top-6 rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold mb-3">Pay</h2>
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <Form />
      </Elements>
    </div>
  );
}