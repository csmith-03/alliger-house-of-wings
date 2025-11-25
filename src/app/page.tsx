import Link from "next/link";
import { getSauceProducts } from "../lib/productFetch";
import Image from "next/image";
import ProductVariantCard from "../app/sauces/_components/ProductCard";

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
        <section className="relative overflow-hidden min-h-[400px] flex items-center">
          <div className="absolute inset-0 z-0 pointer-events-none select-none">
            <video
              src="/fire.mp4"
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
              style={{ opacity: 0.7 }}
            />
          </div>
          <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28 z-10">
            <div className="inline-flex items-center gap-2 rounded-full bg-pure/90 text-maroon px-3 py-1 text-xs font-semibold shadow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-maroon" />
              2009 Rookie of the Year
            </div>
            <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight text-pure">
              26 Flavors. Endless Cravings.
            </h1>
            <p className="mt-4 text-base sm:text-lg text-cream/95 max-w-2xl">
              Located on Spring Street in Sayre, Pennsylvania, we&apos;ve been
              serving the Twin Tiers with unforgettable wings since 1983.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3 sm:items-center">
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
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Our Sauces
          </h2>
            <p className="mt-2 text-foreground/70">
            Handcrafted, bold, and unforgettable. Select a size to add to cart.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p: any) => (
              <ProductVariantCard key={p.id} product={p} />
            ))}

            {items.length === 0 && (
              <div className="card">
                <div className="card-body">
                  <p className="text-sm text-foreground/70">
                    No active Stripe products found.
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
    </div>
  );
}