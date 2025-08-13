import Header from "../../components/header";
import Footer from "../../components/footer";
import { getSauceProducts } from "../../lib/productFetch";

export const metadata = { title: "Sauces" };
export const revalidate = 300; // revalidate every 5 min (ISR).

export default async function SaucesPage() {
  let items: any[] = [];
  try {
    items = await getSauceProducts();
  } catch {
    items = [];
  }

  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
            Our Chicken Wing Sauces
          </h1>

          <p className="mt-4 text-foreground/80 max-w-3xl">
            For years, our sauces have been a favorite at our Sayre, PA restaurant—now available online.
          </p>
          <p className="mt-2 text-foreground/80 max-w-3xl">
            Pulled live from Stripe (test mode).
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p: any) => (
              <article key={p.id} className="card overflow-hidden">
                <div className={`h-1 ${p.barClass}`} />
                <div className="card-body pt-5">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  <p className="mt-1 text-sm text-foreground/70">{p.desc}</p>
                  <div className="mt-4 flex items-center justify-between">
                    {p.price && p.currency && (
                      <span className="text-sm text-foreground/60">
                        ${(p.price / 100).toFixed(2)} {p.currency.toUpperCase()}
                      </span>
                    )}
                    <a
                      href="https://store.houseofwings.com"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-full bg-maroon text-pure px-3 py-1.5 text-sm font-medium hover:brightness-110"
                    >
                      Shop
                    </a>
                  </div>
                </div>
              </article>
            ))}

            {items.length === 0 && (
              <div className="card">
                <div className="card-body">
                  <p className="text-sm text-foreground/70">
                    No active Stripe products found. Add products in Stripe (test mode) with metadata:
                    bar_color (maroon|fire|rooster) and flavor_description.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}