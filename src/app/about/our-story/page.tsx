import Image from "next/image";

export default function OurStoryPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 font-sans text-foreground">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
        Our Story
      </h1>

<section className="mt-8 grid grid-cols-1 gap-40 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6 text-base leading-7">

          <p className="text-foreground/80">
            In 1983, owners Henry and Karen Fratalli opened Alliger&apos;s Tavern in
            Sayre, Pennsylvania, and introduced chicken wings to the Valley. They
            began with three classic flavors—mild, medium, and hot. A couple of years
            later, Barbeque and South joined the lineup. Since then, we&apos;ve grown to
            26 distinct flavors—made in-house—and locals still say we have the best
            wings around.
          </p>
                    <div className="w-[90%]  rounded-xl overflow-hidden border border-foreground/10 bg-foreground/[0.03]">
                      <div className="relative w-full aspect-[4/3]">
                        <Image
                          src="/images/house-wings.jpg"
                          alt="Alliger's House of Wings exterior"
                          fill
                          priority
                          className="object-cover"
                          sizes="(max-width: 1024px) 100vw, 50vw"
                        />
                      </div>
                    </div>
        </div>

        {/* RIGHT: Image */}
        <div>
          <h3 className=" flex items-center gap-3 text-xl font-semibold">
                           <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
                           What makes our wings different
                       </h3>
                       <ul className="mt-2 space-y-2 text-foreground/80 list-disc pl-5">
                           <li>Only the finest ingredients—no shortcuts.</li>
                           <li>Cooked in canola oil (low in saturated fat and carbs).</li>
                           <li>Low/zero trans-fat oils long before it was trendy.</li>
                           <li>Oil filtered daily and completely changed every three days.</li>
                       </ul>

                       <h3 className="mt-10 flex items-center gap-3 text-xl font-semibold">
                                                   <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
                                                   Bottled sauces since 1990
                                               </h3>
                                               <p className="mt-2 text-foreground/80">
                                                   At customers’ urging, we began bottling nine favorites in 1990: Barbeque, Cajun, Garlic, Honey Mustard, Hot, Kamikaze,
                                                   Nuclear, South, and Singapore. Available in 8 oz bottles and 1 gallon jugs—online, at select retailers, and at our Sayre location.
                                               </p>

                                               <h3 className="mt-10 flex items-center gap-3 text-xl font-semibold">
                                                   <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
                                                   Made on the premises
                                               </h3>
                                               <p className="mt-2 text-foreground/80">
                                                   Every batch is crafted in-house using family recipes for consistent, one-of-a-kind flavor.
                                               </p>
        </div>
      </section>
    </main>
  );
}
