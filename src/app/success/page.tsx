import Stripe from "stripe";
import Link from "next/link";

// ---- helpers ---------------------------------------------------------------

function money(cents: number, currency = "USD") {
  return new Intl.NumberFormat(undefined, { style: "currency", currency }).format(
    (cents || 0) / 100
  );
}

function ClearCartScript() {
  const LS_KEY = "how_cart_v1";
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `try{localStorage.removeItem(${JSON.stringify(LS_KEY)});}catch(e){}`,
      }}
    />
  );
}

// ---- page ------------------------------------------------------------------

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const piId =
    (typeof searchParams.payment_intent === "string" && searchParams.payment_intent) ||
    (typeof searchParams.payment_intent_client_secret === "string"
      ? searchParams.payment_intent_client_secret.split("_secret_")[0]
      : undefined);

  if (!piId) {
    return (
      <main className="mx-auto max-w-3xl px-6 py-16">
        <h1 className="text-3xl font-bold mb-6">Payment successful 🎉</h1>
        <p className="mb-6 text-foreground/70">
          We’re missing the payment reference in the URL, but your payment completed.
        </p>
        <Link href="/cart" className="underline">
          Back to cart
        </Link>
        <ClearCartScript />
      </main>
    );
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" });
  const pi = await stripe.paymentIntents.retrieve(piId);

  const currency = (pi.currency || "usd").toUpperCase();
  const total = typeof pi.amount === "number" ? pi.amount : 0;

  // read server-side metadata we set when creating the PI
  const subtotal = Number(pi.metadata?.subtotal ?? 0);
  const shipping = Number(pi.metadata?.shipping ?? 0);
  const tax = Number(pi.metadata?.tax ?? 0);

  let items: Array<{ productId?: string; name?: string; qty?: number; price?: number; image?: string }> = [];
  try {
    if (pi.metadata?.cart) items = JSON.parse(pi.metadata.cart);
  } catch {
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-bold mb-8">Payment successful 🎉</h1>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold mb-4">Order summary</h2>

        {items.length > 0 ? (
          <ul className="divide-y divide-gray-100 mb-4">
            {items.map((it, idx) => (
              <li key={it.productId ?? idx} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="font-medium truncate">{it.name ?? "Item"}</p>
                  <p className="text-sm text-foreground/60">Qty: {Math.max(1, it.qty ?? 1)}</p>
                </div>
                <div className="text-right text-sm text-foreground/80">
                  {it.price != null ? money(it.price, currency) : "--"}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-foreground/60 mb-4">Your order has been received.</p>
        )}

        <div className="mt-2 space-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Subtotal</span>
            <span className="font-medium">{money(subtotal, currency)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Shipping</span>
            <span className="font-medium">
              {shipping === 0 ? "Free" : money(shipping, currency)}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-foreground/70">Tax</span>
            <span className="font-medium">{money(tax, currency)}</span>
          </div>
          <div className="flex items-center justify-between border-t pt-3 text-base">
            <span className="font-semibold">Total charged</span>
            <span className="font-semibold">{money(total, currency)}</span>
          </div>
        </div>
      </section>

      <div className="mt-6">
        <Link href="/" className="underline">Continue shopping</Link>
      </div>

      <ClearCartScript />
    </main>
  );
}