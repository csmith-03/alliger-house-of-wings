import Link from "next/link";
import Header from "../components/header";
import Footer from "../components/footer";

export default function Page() {
  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <Header />

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-maroon via-fire to-rooster" />
          <div className="relative mx-auto max-w-6xl px-6 py-20 sm:py-28">
            <div className="inline-flex items-center gap-2 rounded-full bg-pure/90 text-maroon px-3 py-1 text-xs font-semibold shadow">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-maroon" />
              2009 Rookie of the Year
            </div>
            <h1 className="mt-4 text-4xl sm:text-6xl font-black tracking-tight text-pure">
              Welcome to the Best Chicken Wing Sauces Around
            </h1>
            <p className="mt-4 text-base sm:text-lg text-cream/95 max-w-2xl">
              Located on Spring Street in Sayre, Pennsylvania, we&apos;ve been serving the Twin Tiers with
              unforgettable wings and nine signature sauces—now available online.
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

        {/* Sauce lineup */}
        <section id="sauces" className="mx-auto max-w-6xl px-6 py-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Nine unforgettable flavors</h2>
          <p className="mt-2 text-foreground/70">
            Not just another Buffalo imitation—our sauces are all flavor, crafted for wings and more.
          </p>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { name: "Nuclear", note: "Extreme heat • Super Cayenne 120,000 Scoville", bar: "bg-fire" },
              { name: "Kamikaze", note: "Very hot • Bold and fiery", bar: "bg-maroon" },
              { name: "Hot", note: "Classic heat • Balanced kick", bar: "bg-rooster" },
              { name: "Cajun", note: "Zesty • Savory spice blend", bar: "bg-maroon" },
              { name: "BBQ", note: "Smoky-sweet • Crowd favorite", bar: "bg-fire" },
              { name: "Singapore", note: "Sweet-heat • East-meets-West", bar: "bg-rooster" },
              { name: "Garlic", note: "Rich • Savory garlic finish", bar: "bg-maroon" },
              { name: "Southern", note: "Mild • Comforting and classic", bar: "bg-fire" },
              { name: "Honey Mustard", note: "Sweet • Tangy gold", bar: "bg-rooster" },
            ].map((sauce) => (
              <article
                key={sauce.name}
                className="group rounded-xl border border-black/10 dark:border-white/10 bg-pure text-foreground shadow-sm overflow-hidden"
              >
                <div className={`h-1 ${sauce.bar}`} />
                <div className="p-5">
                  <h3 className="font-semibold text-lg">{sauce.name}</h3>
                  <p className="mt-1 text-sm text-foreground/70">{sauce.note}</p>
                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-foreground/60">8 oz and 1 gal sizes</span>
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
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}