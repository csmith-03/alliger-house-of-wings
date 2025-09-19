"use client";

import { money } from "@/lib/order-math";

type Props = {
  subtotal: number;                // cents
  tax: number;                     // cents
  chosenShippingCents?: number;    // cents (optional)
  cartDisabled?: boolean;
  title?: string;
};

export default function OrderSummary({
  subtotal,
  tax,
  chosenShippingCents,
  cartDisabled,
  title = "Order Summary",
}: Props) {
  const shipping = Math.max(0, Math.round(chosenShippingCents ?? 0));
  const totalEst = subtotal + shipping + tax;

  return (
    <aside className="h-fit rounded-lg border bg-white p-4">
      <h2 className="text-lg font-semibold mb-3">{title}</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd>${money(subtotal)}</dd>
        </div>

        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd>
            {shipping ? `$${money(shipping)}` : (
              <span className="text-gray-600">Calculated below (USPS)</span>
            )}
          </dd>
        </div>

        <div className="flex justify-between">
          <dt>Estimated tax</dt>
          <dd>${money(tax)}</dd>
        </div>

        <div className="my-3 border-t" />

        <div className="flex justify-between text-base font-semibold">
          <dt>Order total (est.)</dt>
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
