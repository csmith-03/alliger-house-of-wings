"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import CartItems from "@/components/cart/CartItems";
import OrderSummary from "@/components/cart/OrderSummary";
import { useRouter } from "next/navigation";
import {
  Elements,
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/app/cart-provider";
import { sanitize, breakdown, estimateTax, money } from "@/lib/order-math";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function CheckoutPage() {
  const { items, currency } = useCart();

  // Normalize cart and compute base totals (no destination tax/shipping yet)
  const norm = useMemo(() => sanitize(items), [items]);
  const base = useMemo(() => breakdown(norm, 0), [norm]);
  const cartDisabled = norm.length === 0 || base.subtotal <= 0;

  // Stripe currency
  const safeCurrency =
    typeof currency === "string" && currency.trim()
      ? currency.toLowerCase()
      : "usd";

  // Address / shipping state
  const [addr, setAddr] = useState<any | null>(null);
  const [addrComplete, setAddrComplete] = useState(false);
  const [addrConfirmed, setAddrConfirmed] = useState(false);
  const [editingAddress, setEditingAddress] = useState(true);

  const [shipOpts, setShipOpts] = useState<any[]>([]);
  const [chosen, setChosen] = useState<any | null>(null);
  const [busyRates, setBusyRates] = useState(false);

  // PaymentIntent state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [uiErr, setUiErr] = useState<string | null>(null);

  // Fetch USPS rates after confirming address
  useEffect(() => {
    if (!addrConfirmed || !addr || cartDisabled) return;
    let cancelled = false;

    (async () => {
      try {
        setBusyRates(true);
        setUiErr(null);

        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, items: norm }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch rates.");
        if (cancelled) return;

        setShipOpts(data?.rates ?? []);
        setChosen((prev) => prev ?? data?.rates?.[0] ?? null);
      } catch (e: any) {
        if (!cancelled) setUiErr(e?.message || "Could not get rates.");
      } finally {
        if (!cancelled) setBusyRates(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [addrConfirmed, addr, JSON.stringify(norm), cartDisabled]);

  // Create/refresh PaymentIntent once address + rate are ready
  useEffect(() => {
    const ready = addrConfirmed && !!addr && !!chosen && !cartDisabled;
    if (!ready) return;

    let cancelled = false;
    (async () => {
      try {
        setUiErr(null);
        const shipCents = Math.max(0, Math.round(Number(chosen!.amount) || 0));
        const res = await fetch("/api/stripe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: norm,
            currency: safeCurrency,
            shipCents,
            address: addr,
            rateId: chosen!.id,
          }),
        });
        const data = await res.json();
        if (!res.ok || !data?.clientSecret) {
          throw new Error(data?.error || "Couldn't start payment.");
        }
        if (!cancelled) setClientSecret(data.clientSecret);
      } catch (e: any) {
        if (!cancelled) setUiErr(e?.message || "Payment setup failed.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    addrConfirmed,
    addr?.postal_code,
    addr?.line1,
    addr?.city,
    addr?.state,
    chosen?.id,
    JSON.stringify(norm),
    safeCurrency,
    cartDisabled,
  ]);

  // Keep <Elements> stable until PI exists (prevents address form reset)
  const elementsOptions = useMemo(() => {
    return clientSecret
      ? { clientSecret, appearance: { labels: "floating" as const } }
      : {
          mode: "payment" as const,
          currency: safeCurrency,
          amount: Math.max(50, base.total),
          appearance: { labels: "floating" as const },
        };
  }, [clientSecret, safeCurrency, base.total]);
  const elementsKey = clientSecret ? `cs_${clientSecret}` : "deferred";

  // Shipping label logic for OrderSummary
  type ShipPhase = "beforeAddress" | "selectRate" | "ready";
  const shippingPhase: ShipPhase = !addrConfirmed
    ? "beforeAddress"
    : chosen
      ? "ready"
      : "selectRate";

  const selectedShipping: number | null =
    shippingPhase === "ready"
      ? Math.max(0, Math.round(Number(chosen!.amount) || 0))
      : null;

  // Address-aware tax preview
  const taxPreview =
    addrConfirmed && addr
      ? estimateTax({
          subTotal: base.subtotal,
          shippingCents: selectedShipping ?? 0,
          toAddress: addr,
        })
      : base.tax;

  return (
    <main>
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-3xl font-bold mb-6">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* LEFT: Address / USPS / Payment */}
          <section className="lg:col-span-2 space-y-4">
            <Elements
              stripe={stripePromise}
              options={elementsOptions}
              key={elementsKey}
            >
              <CheckoutFlowUI
                cartDisabled={cartDisabled}
                addr={addr}
                addrComplete={addrComplete}
                addrConfirmed={addrConfirmed}
                editingAddress={editingAddress}
                onAddressChange={(a, complete) => {
                  setAddr(a);
                  setAddrComplete(complete);
                }}
                onConfirmAddress={() => {
                  if (!addrComplete) return;
                  setAddrConfirmed(true);
                  setEditingAddress(false);
                  setUiErr(null);
                  setShipOpts([]);
                  setChosen(null);
                  setClientSecret(null);
                }}
                onEditAddress={() => {
                  setEditingAddress(true);
                  setAddrConfirmed(false);
                  setShipOpts([]);
                  setChosen(null);
                  setClientSecret(null);
                }}
                shipOpts={shipOpts}
                chosen={chosen}
                setChosen={(opt) => setChosen(opt)}
                busyRates={busyRates}
                uiErr={uiErr}
                hasClientSecret={!!clientSecret}
              />
            </Elements>
          </section>

          {/* RIGHT: aligned cards with the same outline + padding */}
          <aside className="lg:col-span-1 space-y-4">
            <OrderSummary
              subtotal={base.subtotal}
              tax={taxPreview}
              chosenShippingCents={selectedShipping}
              shippingPhase={shippingPhase}
              cartDisabled={cartDisabled}
            />

            <div className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
              <h2 className="text-base font-semibold mb-2">Your Cart</h2>
              <CartItems items={norm} />
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function CheckoutFlowUI(props: {
  cartDisabled: boolean;

  // address
  addr: any;
  addrComplete: boolean;
  addrConfirmed: boolean;
  editingAddress: boolean;
  onAddressChange: (a: any, complete: boolean) => void;
  onConfirmAddress: () => void;
  onEditAddress: () => void;

  // shipping
  shipOpts: any[];
  chosen: any | null;
  setChosen: (o: any) => void;
  busyRates: boolean;

  // payment
  uiErr: string | null;
  hasClientSecret: boolean;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const canConfirmAddress = props.addrComplete && !props.busyRates;

  async function handlePay() {
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout/confirmation`,
      },
    });

    if (error) {
      console.error(error);
      alert(error.message || "Payment failed. Please try again.");
    }
  }

  return (
    <form className="space-y-4">
      {/* Shipping Address */}
      <section className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
        <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>

        {props.editingAddress ? (
          <>
            <AddressElement
              options={{
                mode: "shipping",
                allowedCountries: ["US"],
                fields: { phone: "never" },
                // keeps the full form open (optional)
                defaultValues: {
                  address: { country: "US", state: "NY" },
                },
              }}
              onChange={(e) => {
                const a = e.value?.address || {};
                const flat = {
                  name: e.value?.name || "",
                  line1: a.line1 || "",
                  line2: a.line2 || "",
                  city: a.city || "",
                  state: a.state || "",
                  postal_code: a.postal_code || "",
                  country: a.country || "",
                };
                props.onAddressChange(flat, e.complete);
              }}
            />

            <div className="mt-3">
              <button
                type="button"
                disabled={!canConfirmAddress}
                onClick={props.onConfirmAddress}
                className={`rounded-md px-3 py-2 text-white ${
                  !canConfirmAddress
                    ? "bg-gray-400"
                    : "bg-[#7a0d0d] hover:brightness-110"
                }`}
              >
                {props.busyRates ? "Checking rates…" : "Confirm address"}
              </button>
            </div>
          </>
        ) : (
          // Read-only summary with edit
          <div className="space-y-2">
            <div className="rounded-md border p-3 bg-neutral-50 text-sm">
              <div>{props.addr?.name}</div>
              <div>{props.addr?.line1}</div>
              {props.addr?.line2 ? <div>{props.addr?.line2}</div> : null}
              <div>
                {props.addr?.city}, {props.addr?.state}{" "}
                {props.addr?.postal_code}
              </div>
              <div>{props.addr?.country || "US"}</div>
            </div>
            <button
              type="button"
              onClick={props.onEditAddress}
              className="rounded-md px-3 py-2 border hover:bg-neutral-50"
            >
              Edit address
            </button>
          </div>
        )}
      </section>

      {/* USPS shipping options */}
      <section className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
        <h2 className="text-lg font-semibold mb-2">USPS Shipping</h2>

        {!props.addrConfirmed ? (
          <p className="text-sm text-gray-600">
            Confirm your address to see USPS options.
          </p>
        ) : props.busyRates ? (
          <p className="text-sm text-gray-600">Fetching rates…</p>
        ) : props.shipOpts.length === 0 ? (
          <p className="text-sm text-red-600">
            No rates available. Try editing your address.
          </p>
        ) : (
          <div className="space-y-2">
            {props.shipOpts.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center justify-between rounded-md border p-3 text-sm hover:bg-neutral-50"
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="ship"
                    checked={props.chosen?.id === opt.id}
                    onChange={() => props.setChosen(opt)}
                  />
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className="text-gray-600">
                      {opt.daysMin}–{opt.daysMax} days
                    </div>
                  </div>
                </div>
                <div className="font-medium">${money(opt.amount)}</div>
              </label>
            ))}
          </div>
        )}
      </section>

      {/* Payment */}
      {props.hasClientSecret ? (
        <>
          <section className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
            <h3 className="text-lg font-semibold mb-2">Payment</h3>
            <PaymentElement />
          </section>
          <button
            type="button"
            onClick={handlePay}
            className="w-full rounded-md py-2.5 font-medium text-white bg-[#7a0d0d] hover:brightness-110"
          >
            Pay
          </button>
        </>
      ) : (
        <>
          {props.uiErr && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {props.uiErr}
            </div>
          )}
          {props.addrConfirmed &&
            props.shipOpts.length > 0 &&
            !props.busyRates && (
              <p className="text-sm text-gray-600">Preparing secure payment…</p>
            )}
        </>
      )}
    </form>
  );
}
