import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";
import { getSauceProducts } from "../lib/productFetch";
import Image from "next/image";
import AddToCartButton from "../components/add-to-cart-btn";

export const revalidate = 300;

export default async function Page() {
  let items: any[] = [];
  try {
    items = await getSauceProducts();
  } catch {
    items = [];
  }

  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-maroon via-fire to-rooster" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="inline-flex items-center gap-2 rounded-full bg-pure/90 text-maroon px-3 py-1 text-xs font-semibold shadow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-maroon" />
              2009 Rookie of the Year
            </div>
            <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight text-pure">
              26 Flavors. Endless Cravings.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-cream/95 max-w-2xl">
              Located on Spring Street in Sayre, Pennsylvania, we&apos;ve been serving the Twin Tiers with unforgettable wings.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
              <a
                href="https://store.houseofwings.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-full bg-pure text-maroon hover:bg-cream transition-colors px-6 py-3 text-sm sm:text-base font-semibold shadow"
              >
                Buy sauces online
              </a>
              <a
                href="#sauces"
                className="inline-flex items-center justify-center rounded-full border border-pure/70 text-pure hover:bg-pure hover:text-maroon transition-colors px-6 py-3 text-sm sm:text-base font-semibold"
              >
                See our flavors
              </a>
            </div>
          </div>
        </section>

        <section id="sauces" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Our Sauces (Live from Stripe)</h2>
          <p className="mt-2 text-foreground/70">
            Pulled live from Stripe (test mode). Pricing & descriptions managed in your Stripe dashboard.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p: any) => (
              <article key={p.id} className="card overflow-hidden group">
                <div className={`h-1 ${p.barClass}`} />
                {p.image && (
                  <div className="relative w-full aspect-[4/3] overflow-hidden">
                    <Image
                      src={p.image}
                      alt={p.name}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width:768px) 100vw, (max-width:1200px) 33vw, 300px"
                    />
                  </div>
                )}
                <div className="card-body pt-5">
                  <h3 className="font-semibold text-lg">{p.name}</h3>
                  {p.desc && (
                    <p className="mt-1 text-sm text-foreground/70">
                      {p.desc || "Delicious house-made wing sauce."}
                    </p>
                  )}
                  <div className="mt-4 flex items-center justify-between">
                    {p.price && p.currency && (
                      <span className="text-sm text-foreground/60">
                        ${(p.price / 100).toFixed(2)} {p.currency.toUpperCase()}
                      </span>
                    )}
                    <AddToCartButton
                      product={{
                        productId: p.id,
                        priceId: p.priceId,
                        name: p.name,
                        price: p.price,
                        currency: p.currency,
                        image: p.image,
                      }}
                    />
                  </div>
                </div>
              </article>
            ))}

            {items.length === 0 && (
              <div className="card">
                <div className="card-body">
                  <p className="text-sm text-foreground/70">
                    No active Stripe products found. Add products and metadata (bar_color, flavor_description) in Stripe.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-10">
            <Link
              href="/sauces"
              className="inline-flex items-center rounded-full bg-maroon text-pure px-5 py-2 text-sm font-semibold hover:brightness-110"
            >
              View all sauces
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}