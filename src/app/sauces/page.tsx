import { getSauceProducts } from "../../lib/productFetch";
import ProductCard from "./_components/ProductCard"; // NEW

export const metadata = { title: "Sauces" };
export const revalidate = 300;

export default async function SaucesPage() {
  let items: any[] = [];
  try {
    items = await getSauceProducts();
  } catch {
    items = [];
  }

  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <main>
        <section className="mx-auto max-w-6xl px-6 py-16">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
            Our Chicken Wing Sauces
          </h1>
          <p className="mt-4 text-foreground/80 max-w-3xl">
            For years, our sauces have been a favorite at our Sayre, PA restaurant—now available online.
          </p>
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {items.map((p: any) => (
              <ProductCard key={p.id} product={p} />
            ))}
            {items.length === 0 && (
              <div className="card">
                <div className="card-body">
                  <p className="text-sm text-foreground/70">No active products found.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}