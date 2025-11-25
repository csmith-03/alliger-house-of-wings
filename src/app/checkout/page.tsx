/**
 * Checkout Page
 *
 * Flow (three phases):
 *   1) Address: user enters and confirms shipping address (Stripe AddressElement).
 *   2) Shipping: we POST /api/shipping with { address, items } to fetch UPS rates; user picks one.
 *   3) Payment: on Pay click we POST /api/stripe to create a PaymentIntent, then confirm it.
 *
 * State overview:
 *   - addr / addrComplete / addrConfirmed / editingAddress
 *   - shipOpts / chosen / busyRates
 *   - uiErr: general UI error surface
 *
 * Rendering strategy:
 *   - Elements mounted in deferred mode (no clientSecret until Pay).
 *   - Right-hand OrderSummary recomputes totals with selected shipping.
 */

"use client";

import { useEffect, useMemo, useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Pencil, Loader2 } from "lucide-react";
import { getThemeClasses } from "@/components/class-themes";
import CartItems from "@/components/cart/CartItems";
import OrderSummary from "@/components/cart/OrderSummary";
// import { useRouter } from "next/navigation";
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

  // UI error
  const [uiErr, setUiErr] = useState<string | null>(null);

  // Create PaymentIntent only when user clicks Pay
  const createPaymentIntent = async (): Promise<string> => {
    if (!addrConfirmed || !addr || !chosen) {
      throw new Error("Address and shipping must be selected.");
    }
    const shipCents = Math.max(0, Math.round(Number(chosen.amount) || 0));
    const res = await fetch("/api/stripe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: norm.map((it) => ({
          id: String(it.id),
          quantity: Number(it.quantity ?? 1),
        })),
        currency: safeCurrency,
        shipCents,
        address: addr,
        rateId: chosen.id,
      }),
    });
    const data = await res.json();
    if (!res.ok || !data?.clientSecret) {
      throw new Error(data?.error || "Couldn't start payment.");
    }
    return data.clientSecret;
  };

  // Phase 2: fetch UPS rates after confirming address
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
          body: JSON.stringify({
            address: addr,
            items: norm.map((it) => ({
              quantity: Number(it.quantity ?? 1),
              weightOz: Number(it.weightOz ?? 0),
            })),
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || "Failed to fetch rates.");
        if (cancelled) return;

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

  // Elements deferred mode
  const elementsOptions = useMemo(() => {
    const appearance = {
      theme: theme === "dark" ? ("night" as const) : ("stripe" as const),
      labels: "floating" as const,
      variables: {
        colorPrimary: theme === "dark" ? "#e0e0e0" : "#202020",
        colorBackground: theme === "dark" ? "#121212" : "#ffffff",
        colorText: theme === "dark" ? "#e0e0e0" : "#202020",
        colorDanger: "#df1b41",
        fontFamily: '"Inter", sans-serif',
      },
    };
    return {
      mode: "payment" as const,
      currency: safeCurrency,
      amount: Math.max(50, base.total),
      appearance,
    };
  }, [safeCurrency, base.total, theme]);

  const elementsKey = `${theme}_deferred`;

  // shipping label logic for OrderSummary
  type ShipPhase = "beforeAddress" | "selectRate" | "ready";
  const shippingPhase: ShipPhase = !addrConfirmed
    ? "beforeAddress"
    : chosen
    ? "ready"
    : "selectRate";

  // normalize shipping cents for summary
  const selectedShipping: number | null =
    shippingPhase === "ready"
      ? Math.max(0, Math.round(Number(chosen!.amount) || 0))
      : null;

  // address-aware tax preview (placeholder logic)
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
          {/* LEFT: Address / Shipping / Payment */}
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
                  // clientSecret reset commented (deferred)
                }}
                onEditAddress={() => {
                  setEditingAddress(true);
                  setAddrConfirmed(false);
                  setShipOpts([]);
                  setChosen(null);
                  // clientSecret reset commented (deferred)
                }}
                shipOpts={shipOpts}
                chosen={chosen}
                setChosen={(opt) => setChosen(opt)}
                busyRates={busyRates}
                uiErr={uiErr}
                createPaymentIntent={createPaymentIntent}
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
  addr: any;
  addrComplete: boolean;
  addrConfirmed: boolean;
  editingAddress: boolean;
  onAddressChange: (a: any, complete: boolean) => void;
  onConfirmAddress: () => void;
  onEditAddress: () => void;
  shipOpts: any[];
  chosen: any | null;
  setChosen: (o: any) => void;
  busyRates: boolean;
  uiErr: string | null;
  createPaymentIntent: () => Promise<string>;
}) {
  const stripe = useStripe();
  const elements = useElements();
  // const router = useRouter();
  const { theme } = useTheme?.() || { theme: "dark" };
  const themeClass = getThemeClasses(theme);
  const [payBusy, setPayBusy] = useState(false);
  const [payErr, setPayErr] = useState<string | null>(null);

  const canConfirmAddress = props.addrComplete && !props.busyRates;
  const canShowPayment =
    props.addrConfirmed && !!props.chosen && !props.busyRates && !props.cartDisabled;

  async function handlePay() {
    if (!stripe || !elements) return;
    setPayBusy(true);
    setPayErr(null);
    try {
      // Stripe requires elements.submit() first (validation)
      const { error: submitErr } = await elements.submit();
      if (submitErr) {
        setPayErr(submitErr.message || "Please check your details.");
        setPayBusy(false);
        return;
      }

      // Create PaymentIntent now
      const clientSecret = await props.createPaymentIntent();
      const origin =
        typeof window !== "undefined"
          ? window.location.origin
          : (process.env.NEXT_PUBLIC_SITE_URL ?? "");

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: `${origin}/checkout/confirmation`,
        },
      });
      if (error) {
        setPayErr(error.message || "Payment failed. Please try again.");
      }
    } catch (e: any) {
      setPayErr(e?.message || "Could not start payment.");
    } finally {
      setPayBusy(false);
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
                className={`rounded-md px-3 py-2 font-semibold ${themeClass.buttonPrimary} ${
                  !canConfirmAddress ? "opacity-60 cursor-not-allowed" : ""
                }`}
              >
                {props.busyRates ? "Checking rates…" : "Confirm address"}
              </button>
            </div>
          </>
        ) : (
          <div className="space-y-2">
            <div
              className={`relative rounded-md border p-3 text-sm ${themeClass.muted} ${themeClass.border}`}
            >
              <div>{props.addr?.name}</div>
              <div>{props.addr?.line1}</div>
              {props.addr?.line2 ? <div>{props.addr?.line2}</div> : null}
              <div>
                {props.addr?.city}, {props.addr?.state} {props.addr?.postal_code}
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

      {/* UPS shipping options */}
      <section className={`rounded-md border p-4 ${themeClass.surface}`}>
        <h2 className="text-lg font-semibold mb-2">UPS Shipping</h2>

        {!props.addrConfirmed ? (
          <p className="text-sm text-foreground/60">
            Confirm your address to see UPS options.
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

      {/* General error */}
      {props.uiErr && (
        <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {props.uiErr}
        </div>
      )}

      {/* Payment (deferred) */}
      {canShowPayment ? (
        <>
          {payErr && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 mb-2">
              {payErr}
            </div>
          )}
          <section className={`rounded-md border p-4 ${themeClass.surface}`}>
            <h3 className="text-lg font-semibold mb-2">Payment</h3>
            <PaymentElement />
          </section>
          <button
            type="button"
            onClick={handlePay}
            disabled={payBusy || !stripe || !elements}
            className={`w-full rounded-md py-2.5 font-medium text-white bg-[#7a0d0d] hover:brightness-110 ${
              payBusy ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {payBusy ? "Processing…" : "Pay"}
          </button>
        </>
      ) : null}
    </form>
  );
}