"use client";

import { money } from "@/lib/order-math";

type ShipPhase = "beforeAddress" | "selectRate" | "ready";

type Props = {
  subtotal: number; // cents
  tax: number; // cents
  chosenShippingCents?: number | null;
  shippingPhase?: ShipPhase;
  cartDisabled?: boolean;
  title?: string;
};

export default function OrderSummary({
  subtotal,
  tax,
  chosenShippingCents = null,
  shippingPhase = "beforeAddress",
  cartDisabled,
  title = "Order Summary",
}: Props) {
  const ship =
    typeof chosenShippingCents === "number"
      ? Math.max(0, Math.round(chosenShippingCents))
      : null;

  const totalEst = (subtotal ?? 0) + (tax ?? 0) + (ship ?? 0);

  let shippingLabel: string;
  if (shippingPhase === "beforeAddress") {
    shippingLabel = "Calculated from address";
  } else if (shippingPhase === "selectRate") {
    shippingLabel = "Select USPS option";
  } else {
    shippingLabel = ship == null ? "TBD" : `$${money(ship)}`;
  }

  return (
    <aside className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
      <h2 className="text-base font-semibold mb-2">{title}</h2>

      <dl className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <dt className="text-foreground/80">Subtotal</dt>
          <dd className="text-foreground">${money(subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-foreground/80">Shipping</dt>
          <dd className="text-foreground">{shippingLabel}</dd>
        </div>

        <div className="flex items-center justify-between">
          <dt className="text-foreground/80">Estimated tax</dt>
          <dd className="text-foreground">${money(tax)}</dd>
        </div>

        <div className="my-3 border-t border-[color:var(--surface-border)]" />

        <div className="flex items-center justify-between text-base font-semibold">
          <dt>Total</dt>
          <dd>${money(totalEst)}</dd>
        </div>
      </dl>

      {cartDisabled && (
        <p className="mt-2 text-xs text-red-600">
          Add items to your cart to continue.
        </p>
      )}
    </aside>
  );
}
