import { ShoppingCart } from "lucide-react";
import { useState } from "react";
import Header from "../../components/header";
import Footer from "../../components/footer";

export default function CheckoutPage() {
  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <main>
        <section className="mx-auto max-w-3xl px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Checkout</h2>
          <p className="mt-2 text-foreground/70">Review your order and complete payment.</p>

          <div className="mt-6 space-y-4">
            <div className="rounded-lg border border-black/10 dark:border-white/10 bg-pure p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Kamikaze (10)</span>
                <span className="text-sm">$13.00</span>
              </div>
            </div>

            <div className="rounded-lg border border-black/10 dark:border-white/10 bg-pure p-4">
              <div className="flex items-center justify-between">
                <span className="font-medium">Honey Mustard (10)</span>
                <span className="text-sm">$12.00</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-black/10 dark:border-white/10">
              <span className="font-semibold">Total</span>
              <span className="font-semibold">$25.00</span>
            </div>

            <div className="pt-4">
              <button className="inline-flex items-center gap-2 rounded-full bg-fire text-pure hover:bg-maroon transition-colors px-6 py-3 text-sm font-semibold shadow-sm">
                <ShoppingCart className="h-4 w-4" />
                Proceed to payment
              </button>
            </div>
          </div>

          {/* Pickup/Delivery CTA */}
          <div id="order" className="mt-12">
            <div className="rounded-2xl bg-maroon text-pure px-8 py-10 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-bold">Ready for wings?</h3>
                <p className="text-cream/95 mt-1">Pickup or delivery in minutes.</p>
              </div>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="rounded-full bg-pure text-maroon px-6 py-3 text-sm font-semibold hover:bg-cream"
                >
                  Start pickup
                </a>
                <a
                  href="#"
                  className="rounded-full border border-pure text-pure px-6 py-3 text-sm font-semibold hover:bg-pure hover:text-maroon"
                >
                  Delivery
                </a>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

function ShippingRates({ address, items }) {
  const [rates, setRates] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRates = async () => {
    setLoading(true);
    const res = await fetch("/api/shipping", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address, items }),
    });
    const data = await res.json();
    setRates(data.rates || []);
    setLoading(false);
  };

  return (
    <div>
      <button onClick={fetchRates} disabled={loading}>
        {loading ? "Loading..." : "Get Shipping Rates"}
      </button>
      <ul>
        {rates.map(rate => (
          <li key={rate.object_id}>
            {rate.provider} {rate.servicelevel.name}: ${rate.amount}
          </li>
        ))}
      </ul>
    </div>
  );
}