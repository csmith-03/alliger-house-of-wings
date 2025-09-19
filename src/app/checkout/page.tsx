"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { CartItems, OrderSummary } from "@/components/cart";
import { useRouter } from "next/navigation";
import {
  Elements,
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/app/cart-provider";
import {
  sanitize,
  sanitizeLine,
  breakdown,
  estimateTax,
  money,
} from "@/lib/order-math";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function CheckoutPage() {
  const { items, currency, updateQuantity, removeItem } = useCart();

  // Normalize cart and compute base totals (no shipping/tax-by-destination yet)
  const norm = useMemo(() => sanitize(items), [items]);
  const base = useMemo(() => breakdown(norm, 0), [norm]);
  const cartDisabled = norm.length === 0 || base.subtotal <= 0;

  // Safe currency for Stripe
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
  const [uiErr, setUiErr] = useState<string | null>(null);

  const [clientSecret, setClientSecret] = useState<string | null>(null);

  // 1) Fetch USPS rates ONLY after address confirmed
  useEffect(() => {
    if (!addrConfirmed || !addr || cartDisabled) return;

    setBusyRates(true);
    setUiErr(null);
    fetch("/api/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ toAddress: addr, items: norm }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Could not get USPS rates");
        setShipOpts(data.options || []);
        setChosen((data.options || [])[0] || null);
      })
      .catch((e) => setUiErr(e?.message || "Could not get USPS rates"))
      .finally(() => setBusyRates(false));
  }, [addrConfirmed, JSON.stringify(addr), JSON.stringify(norm), cartDisabled]);

  // 2) Auto-create (or refresh) the PaymentIntent once address is confirmed and a USPS option is chosen.
  //    If the user changes the rate after a PI exists, we re-create to update the amount.
  useEffect(() => {
    const ready = addrConfirmed && !!addr && !!chosen && !cartDisabled;
    if (!ready) return;

    let isCancelled = false;
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
        if (!isCancelled) setClientSecret(data.clientSecret);
      } catch (e: any) {
        if (!isCancelled) setUiErr(e?.message || "Couldn't start payment.");
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [
    addrConfirmed,
    addr?.line1,
    addr?.postal_code,
    chosen?.id,
    JSON.stringify(norm),
    safeCurrency,
    cartDisabled,
  ]);

  // Keep <Elements> stable until PI exists (address form won’t reset)
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

  // Address-aware summary (right column)
  const selectedShipping = chosen?.amount
    ? Math.max(0, Math.round(Number(chosen.amount)))
    : 0;
  const taxPreview =
    addrConfirmed && addr
      ? estimateTax({
          subTotal: base.subtotal,
          shippingCents: selectedShipping,
          toAddress: addr,
        })
      : base.tax;
  const displayTotal = base.subtotal + selectedShipping + taxPreview;

  return (
    <main className="">
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
                onAddressChange={(a: any, complete: boolean) => {
                  setAddr(a);
                  setAddrComplete(complete);
                  setAddrConfirmed(false);
                  setEditingAddress(true);
                  setShipOpts([]);
                  setChosen(null);
                  setClientSecret(null);
                }}
                onConfirmAddress={() => {
                  setAddrConfirmed(true);
                  setEditingAddress(false);
                }}
                onEditAddress={() => {
                  setEditingAddress(true);
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

          {/* RIGHT: stack Summary + Cart in ONE column */}
          <aside className="lg:col-span-1 space-y-4">
            <div className="space-y-4 lg:sticky lg:top-24 lg:max-h-[calc(100vh-6rem)] lg:overflow-auto">
              <OrderSummary
                subtotal={base.subtotal}
                tax={taxPreview}
                chosenShippingCents={selectedShipping}
                cartDisabled={cartDisabled}
              />

              <div className="rounded-lg border bg-white p-4">
                <h2 className="text-lg font-semibold mb-3">Your Cart</h2>
                <CartItems items={norm} />
              </div>
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

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url:
          (process.env.NEXT_PUBLIC_SITE_URL ?? "") + "/checkout/confirmation",
      },
    });
    if (result.error) {
      alert(result.error.message);
    } else if (
      result.paymentIntent &&
      result.paymentIntent.status === "succeeded"
    ) {
      if (typeof clearCart === "function") clearCart();
      else if (typeof setItems === "function") setItems([]);

      router.push(`/checkout/confirmation?pi=${result.paymentIntent.id}`);
    } else {
    }
  }

  // UI states
  const canConfirmAddress =
    props.addrComplete && !props.cartDisabled && !props.busyRates;

  return (
    <form className="space-y-4">
      {/* Address section */}
      <section className="rounded-lg border bg-white p-4">
        <h3 className="text-lg font-semibold mb-2">Shipping Address</h3>

        {props.editingAddress ? (
          <>
            <AddressElement
              options={{ mode: "shipping" }}
              onChange={(ev) => {
                const v = ev.value || {};
                const a = v.address || {};
                const complete = !!ev.complete;

                const flat = {
                  name: v.name || "",
                  line1: a.line1,
                  line2: a.line2 || "",
                  city: a.city,
                  state: a.state,
                  postal_code: a.postal_code,
                  country: a.country || "US",
                };

                props.onAddressChange(flat, complete);
              }}
            />

            <div className="mt-3">
              <button
                type="button"
                onClick={props.onConfirmAddress}
                disabled={!canConfirmAddress}
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
          // Read-only summary of the confirmed address with an Edit button
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

        {props.cartDisabled && (
          <p className="mt-2 text-sm text-red-600">
            Add items to your cart to continue.
          </p>
        )}
      </section>

      {/* USPS section (only after confirm) */}
      <section className="rounded-lg border bg-white p-4">
        <h3 className="text-lg font-semibold mb-2">USPS Shipping</h3>
        {!props.addr ? (
          <p className="text-sm text-gray-600">
            Enter your address to enable quoting.
          </p>
        ) : !props.addrConfirmed ? (
          <p className="text-sm text-gray-600">
            Confirm your address to see USPS options.
          </p>
        ) : props.busyRates ? (
          <p>Fetching rates…</p>
        ) : props.shipOpts.length === 0 ? (
          <p className="text-sm text-red-600">
            No USPS options available for this address.
          </p>
        ) : (
          <div className="space-y-2">
            {props.shipOpts.map((opt) => (
              <label
                key={opt.id}
                className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer"
              >
                <input
                  type="radio"
                  name="ship"
                  checked={props.chosen?.id === opt.id}
                  onChange={() => props.setChosen(opt)}
                />
                <div className="flex-1">
                  <div className="font-medium">{opt.serviceName}</div>
                  {opt.estDays ? (
                    <div className="text-sm text-gray-600">
                      Est. {opt.estDays} day(s)
                    </div>
                  ) : null}
                </div>
                <div className="font-semibold">${money(opt.amount)}</div>
              </label>
            ))}
          </div>
        )}
      </section>

      {props.hasClientSecret ? (
        <>
          <section className="rounded-lg border bg-white p-4">
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
