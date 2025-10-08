/**
 * Checkout Page
 *
 * Flow (three phases):
 *   1) Address: user enters and confirms shipping address (Stripe AddressElement).
 *   2) Shipping: we POST /api/shipping with { address, items } to fetch USPS rates; user picks one.
 *   3) Payment: we POST /api/stripe with { items, currency, shipCents, address, rateId } to create a PaymentIntent,
 *      then render <PaymentElement> and confirm the payment (redirect).
 *
 * State overview:
 *   - addr / addrComplete / addrConfirmed / editingAddress: address capture + confirmation.
 *   - shipOpts / chosen / busyRates: shipping quotes and selection.
 *   - clientSecret / uiErr: PaymentIntent lifecycle + UI error surface.
 *
 * Rendering strategy:
 *   - Keep <Elements> mounted; once clientSecret exists, we pass it via options to render PaymentElement.
 *   - Right-hand OrderSummary recomputes subtotals/tax and shows selected shipping if present.
 */

// TODO: split up into sub-components
"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Pencil, Loader2 } from "lucide-react";
import { getThemeClasses } from "@/components/class-themes";
import CartItems from "@/components/cart/CartItems";
import OrderSummary from "@/components/cart/OrderSummary";
import { useRouter } from "next/navigation";
import { useTheme } from "@/app/theme-provider";
import {
  Elements,
  AddressElement,
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useCart } from "@/app/cart-provider";
import { sanitize, breakdown, estimateTax, money } from "@/lib/order-math";
import { text } from "stream/consumers";

// one-time Stripe loader for client
const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
);

export default function CheckoutPage() {
  const { items, currency } = useCart();
  const { theme } = useTheme?.() || { theme: "dark" };
  
  // normalize cart and compute base totals (no destination tax/shipping yet)
  const norm = useMemo(() => sanitize(items), [items]);
  const base = useMemo(() => breakdown(norm, 0), [norm]);
  const cartDisabled = norm.length === 0 || base.subtotal <= 0;

  // stripe currency
  const safeCurrency =
    typeof currency === "string" && currency.trim()
      ? currency.toLowerCase()
      : "usd";

  // address + shipping state
  const [addr, setAddr] = useState<any | null>(null);
  const [addrComplete, setAddrComplete] = useState(false);
  const [addrConfirmed, setAddrConfirmed] = useState(false);
  const [editingAddress, setEditingAddress] = useState(true);

  const [shipOpts, setShipOpts] = useState<any[]>([]);
  const [chosen, setChosen] = useState<any | null>(null);
  const [busyRates, setBusyRates] = useState(false);

  // Stripe PaymentIntent (created when address and rate are ready)
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [uiErr, setUiErr] = useState<string | null>(null);

  // Phase 2: fetch USPS rates after confirming address
  useEffect(() => {
    if (!addrConfirmed || !addr || cartDisabled) return;
    let cancelled = false;

    (async () => {
      try {
        setBusyRates(true);
        setUiErr(null);

        // get USPS rates based on current address + cart from API
        const res = await fetch("/api/shipping", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ address: addr, items: norm }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch rates.");
        if (cancelled) return;

        // populate shipping options ()keep prior selection if present, otherwise pick first)
        setShipOpts(data?.rates ?? []);
        setChosen((prev: any) => prev ?? data?.rates?.[0] ?? null);
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

  // Phase 3: create/refresh PaymentIntent once address + rate are ready
  useEffect(() => {
    const ready = addrConfirmed && !!addr && !!chosen && !cartDisabled;
    if (!ready) return;

    let cancelled = false;
    (async () => {
      try {
        setUiErr(null);

        // normalize shipping cents to match UI
        const shipCents = Math.max(0, Math.round(Number(chosen!.amount) || 0));

        // create PaymentIntent for full amount (subtotal + ship + tax)
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
        // store clientSecret so <Elements> can render <PaymentElement>
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
  
  // keep <Elements> stable until PI exists (prevents address form reset)
  const elementsOptions = useMemo(() => {
  const appearance = {
    theme: theme === "dark" ? "night" as const : "stripe" as const,
    labels: "floating" as const,
    variables: {
      colorPrimary: theme === "dark" ? "#e0e0e0" : "#202020",
      colorBackground: theme === "dark" ? "#121212" : "#ffffff",
      colorText: theme === "dark" ? "#e0e0e0" : "#202020",
      colorDanger: "#df1b41",
      fontFamily: '"Inter", sans-serif',
    }
  };

  return clientSecret
    ? { clientSecret, appearance }
    : {
        mode: "payment" as const,
        currency: safeCurrency,
        amount: Math.max(50, base.total),
        appearance,
      };
}, [clientSecret, safeCurrency, base.total, theme]);
  // change key - forces Elements to remount when PI is available
  const elementsKey = `${theme}_${clientSecret ? `cs_${clientSecret}` : "deferred"}`;

  // shipping label logic for OrderSummary
  type ShipPhase = "beforeAddress" | "selectRate" | "ready";
  const shippingPhase: ShipPhase = !addrConfirmed
    ? "beforeAddress"
    : chosen
      ? "ready"
      : "selectRate";

  // normalize shipping cents for summary (null when N/A)
  const selectedShipping: number | null =
    shippingPhase === "ready"
      ? Math.max(0, Math.round(Number(chosen!.amount) || 0))
      : null;

  // address-aware tax preview
  // TODO: integrate Stripe Tax and fix this
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
                // address properties
                addr={addr}
                addrComplete={addrComplete}
                addrConfirmed={addrConfirmed}
                editingAddress={editingAddress}
                onAddressChange={(a, complete) => {
                  setAddr(a);
                  setAddrComplete(complete);
                }}
                onConfirmAddress={() => {
                  if (!addrComplete) return; // require form to be completed
                  setAddrConfirmed(true);
                  setEditingAddress(false);
                  setUiErr(null);
                  setShipOpts([]);
                  setChosen(null);
                  setClientSecret(null);
                }}
                // going back to edit address clears quotes, selection, PI
                onEditAddress={() => {
                  setEditingAddress(true);
                  setAddrConfirmed(false);
                  setShipOpts([]);
                  setChosen(null);
                  setClientSecret(null);
                }}
                // shipping properties
                shipOpts={shipOpts}
                chosen={chosen}
                setChosen={(opt) => setChosen(opt)}
                busyRates={busyRates}
                // payment UI status
                uiErr={uiErr}
                hasClientSecret={!!clientSecret}
              />
            </Elements>
          </section>

          {/* RIGHT: Summary and cart items */}
          <aside className="lg:col-span-1 space-y-4">
            <OrderSummary
              subtotal={base.subtotal}
              tax={taxPreview}
              chosenShippingCents={selectedShipping}
              shippingPhase={shippingPhase}
              cartDisabled={cartDisabled}
              theme={theme}
            />

            <div
              className={`rounded-md border p-4 ${
                theme === "dark"
                  ? "border-[color:var(--surface-border-strong)] bg-[color:var(--surface)] text-[color:var(--foreground)]"
                  : "border-[color:var(--surface-border-strong)] bg-white text-[color:var(--foreground)]"
              }`}
            >
              <h2 className="text-base font-semibold mb-2">Your Cart</h2>
              <CartItems items={norm} theme={theme} />
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
  const { theme } = useTheme?.() || { theme: "dark" };
  const themeClass = getThemeClasses(theme);

  // can't confirm address until it's complete and we're not fetching rates
  const canConfirmAddress = props.addrComplete && !props.busyRates;

  // Submit payment handler to Stripe, redirect to confirmation page
  async function handlePay() {
    if (!stripe || !elements) return;

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/checkout/confirmation`,
      },
    });
    // Stripe didn't redirect (an error occurred)
    if (error) {
      console.error(error);
      alert(error.message || "Payment failed. Please try again.");
    }
  }

  return (
    <form className="space-y-4">
      {/* Shipping Address */}
      <section className={`rounded-md border p-4 ${themeClass.surface}`}>
        <h2 className="text-lg font-semibold mb-3">Shipping Address</h2>

        {props.editingAddress ? (
          <>
            <AddressElement
              options={{
                mode: "shipping",
                allowedCountries: ["US"],
                fields: { phone: "never" },
                // keeps the full form open (optional - can change)
                defaultValues: {
                  address: { country: "US", state: "NY" },
                },
              }}
              onChange={(e) => {
                // flatten nested address for the state we use
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
                className={`rounded-md px-3 py-2 font-semibold ${themeClass.buttonPrimary} ${
                  !canConfirmAddress ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {props.busyRates ? "Checking rates…" : "Confirm address"}
              </button>
            </div>
          </>
        ) : (
          // read-only summary with edit
          <div className="space-y-2">
            <div
              className={`relative rounded-md border p-3 text-sm ${themeClass.muted} ${themeClass.border}`}
            >
              <div>{props.addr?.name}</div>
              <div>{props.addr?.line1}</div>
              {props.addr?.line2 ? <div>{props.addr?.line2}</div> : null}
              <div>
                {props.addr?.city}, {props.addr?.state}{" "}
                {props.addr?.postal_code}
              </div>
              <div>{props.addr?.country || "US"}</div>
              <button
                type="button"
                onClick={props.onEditAddress}
                aria-label="Edit address"
                className="absolute top-2 right-2 inline-flex items-center justify-center rounded-full p-2 hover:bg-[color:var(--surface-alt)] transition"
              >
                <Pencil
                  className={`h-4 w-4 ${
                    theme === "dark" ? "text-gray-300" : "text-gray-600"
                  }`}
                />
              </button>
            </div>
          </div>
        )}
      </section>

      {/* USPS shipping options */}
      <section className={`rounded-md border p-4 ${themeClass.surface}`}>
        <h2 className="text-lg font-semibold mb-2">USPS Shipping</h2>

        {!props.addrConfirmed ? (
          <p className="text-sm text-foreground/60">
            Confirm your address to see USPS options.
          </p>
        ) : props.busyRates ? (
          <div className="flex justify-center items-center py-8">
            <Loader2
              className={`animate-spin h-8 w-8 ${
                theme === "dark" ? "text-gray-300" : "text-gray-600"
              }`}
            />
          </div>
        ) : props.shipOpts.length === 0 ? (
          <p className="text-sm text-red-600">
            No rates available. Try editing your address.
          </p>
        ) : (
          <div className="space-y-2">
            {props.shipOpts.map((opt) => (
              <label
                key={opt.id}
                className={`flex items-center justify-between rounded-md border p-3 text-sm hover:bg-[color:var(--surface-muted)] ${themeClass.surface} ${themeClass.border}`}
              >
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="ship"
                    checked={props.chosen?.id === opt.id}
                    onChange={() => props.setChosen(opt)}
                    style={{
                      accentColor: theme === "dark" ? "#dfa32e" : "#7a0d0d",
                    }}
                  />
                  <div>
                    <div className="font-medium">{opt.label}</div>
                    <div className={themeClass.textMuted}>
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
          <section className={`rounded-md border p-4 ${themeClass.surface}`}>
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
              <p className={`text-sm ${themeClass.textMuted}`}>
                Preparing secure payment…
              </p>
            )}
        </>
      )}
    </form>
  );
}
