// Server component that renders the order confirmation screen
import Link from "next/link";
import ClearCartOnArrival from "./ClearCartOnArrival";

type Props = { searchParams: { pi?: string; payment_intent?: string } };

async function getOrder(pi: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/orders/${pi}`,
    { cache: "no-store" },
  ).catch(() => null);

  if (!res || !res.ok) return null;
  return res.json();
}

export default async function ConfirmationPage({ searchParams }: Props) {
  const pi = searchParams.pi || searchParams.payment_intent || "";
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

  const order = await getOrder(pi);
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
      {/* clear cart once on mount */}
      <ClearCartOnArrival />

      <h1 className="text-3xl font-bold mb-2">Thanks for your order!</h1>
      <p className="text-gray-700 mb-6">
        Order <span className="font-mono">#{shortId}</span>
      </p>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left: address + items */}
        <section className="lg:col-span-2 space-y-4">
          <div className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
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
              <p className="text-gray-600">No shipping address found.</p>
            )}
          </div>

          <div className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
            <h2 className="text-lg font-semibold mb-3">Items</h2>
            {items.length === 0 ? (
              <p className="text-gray-600">No items captured.</p>
            ) : (
              <ul className="divide-y">
                {items.map((it) => {
                  const unit = Math.max(
                    0,
                    Math.round(Number(it.unitAmount) || 0),
                  );
                  const qty = Math.max(1, Math.round(Number(it.quantity) || 1));
                  const line = unit * qty; // cents
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
                          <div className="text-sm text-gray-600">
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
            className="inline-block rounded-md border px-4 py-2 hover:bg-neutral-50"
          >
            Continue shopping
          </Link>
        </section>

        {/* Right: summary */}
        <aside className="space-y-4">
          <div className="rounded-md border border-[color:var(--surface-border-strong)] bg-white p-4">
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
