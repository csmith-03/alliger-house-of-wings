import Image from "next/image";
export const metadata = { title: "Benefits | Alliger's House of Wings" };

export default function BenefitsPage() {
  return (
    <main className="mx-auto max-w-4xl px-6 py-16 font-sans text-foreground">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
        Health Benefits of Cayenne Pepper
      </h1>
      <p className="mt-4 text-foreground/80 text-base">
        Our hotter wing and bottled sauce varieties use super cayenne peppers (around 120,000 Scoville). Beyond heat, cayenne
        has been studied for potential wellness advantages tied to capsaicin, the active compound that delivers the burn.
      </p>

      <figure className="mt-8 rounded-xl overflow-hidden border border-foreground/10 bg-foreground/[0.03]">
        <div className="relative w-full aspect-[16/7] sm:aspect-[16/6]">
          <Image
            src="/images/pepper.jpg"
            alt="Fresh super cayenne peppers used in our hotter wing sauces"
            fill
            priority
            className="object-cover"
            sizes="(max-width:768px) 100vw, 800px"
          />
        </div>
      </figure>

      <h2 className="mt-10 flex items-center gap-3 text-xl font-semibold">
        <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
        Key Points
      </h2>
      <ul className="mt-3 space-y-2 list-disc pl-5 text-foreground/80">
        <li>Capsaicin may help alleviate certain joint and cluster headache discomfort when used appropriately.</li>
        <li>Stimulating properties can support circulation and may aid the body’s natural healing responses.</li>
        <li>Traditionally noted for helping clear congestion and supporting a feeling of warmth.</li>
        <li>Activates endorphin release, contributing to a natural sense of relief after the initial heat.</li>
      </ul>

      <h2 className="mt-10 flex items-center gap-3 text-xl font-semibold">
        <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
        Broader Reported Uses
      </h2>
      <p className="mt-3 text-foreground/80">
        Historically, cayenne pepper has been used to help with circulation, minor digestive stimulation, and topical comfort
        applications. Some sources cite support in managing occasional headache feelings, easing stuffiness, and complementing
        personal wellness routines.
      </p>

      <h2 className="mt-10 flex items-center gap-3 text-xl font-semibold">
        <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
        Capsaicin & Research
      </h2>
      <p className="mt-3 text-foreground/80">
        Capsaicin appears in various over‑the‑counter topical preparations for temporary joint or muscle comfort. Laboratory
        studies have explored its cellular effects, including impacts on certain pain pathways and specific cell lines.
      </p>

      <h2 className="mt-10 flex items-center gap-3 text-xl font-semibold">
        <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
        How the Heat Feels
      </h2>
      <p className="mt-3 text-foreground/80">
        The “burn” triggers nerve receptors, prompting the brain to release endorphins. After the peak, many experience a mild
        sense of relief or clarity—part of the appeal for heat enthusiasts.
      </p>

      <h2 className="mt-10 flex items-center gap-3 text-xl font-semibold">
        <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
        Enjoy Responsibly
      </h2>
      <p className="mt-3 text-foreground/80">
        Individual tolerance varies. Start modestly with very hot sauces. Avoid contact with eyes or sensitive skin. For any
        specific condition or persistent symptoms, consult a qualified professional—this page is informational only.
      </p>

      <div className="mt-10 flex flex-wrap gap-3">
        <a
          href="/sauces"
          className="inline-flex items-center rounded-full bg-maroon text-pure px-5 py-2 text-sm font-semibold hover:brightness-110"
        >
          Explore Sauces
        </a>
        <a
          href="#top"
          className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-5 py-2 text-sm font-semibold hover:bg-foreground/5"
        >
          Back to Top
        </a>
      </div>
    </main>
  );
}