import CartClient from "./cart-client";
import PaymentForm from "./payment-form";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <main className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="text-3xl font-bold mb-8">Your Cart</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <section className="lg:col-span-1">
            <CartClient />
          </section>
          <aside className="lg:col-span-2">
            <PaymentForm />
          </aside>
        </div>

        <section className="mt-12 rounded-2xl bg-maroon text-pure px-6 sm:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-semibold">Ready for wings?</h3>
              <p className="text-cream/95 mt-1">Pickup or delivery in minutes.</p>
            </div>
            <div className="flex gap-3">
              <a href="#" className="rounded-full bg-pure text-maroon px-5 sm:px-6 py-3 text-sm font-semibold hover:bg-cream">
                Start pickup
              </a>
              <a href="#" className="rounded-full border border-pure text-pure px-5 sm:px-6 py-3 text-sm font-semibold hover:bg-pure hover:text-maroon">
                Delivery
              </a>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}