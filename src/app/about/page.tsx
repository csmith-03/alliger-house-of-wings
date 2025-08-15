import Link from "next/link";
import Image from "next/image";

export default function AboutPage() {
    return (
        <div className="font-sans min-h-screen bg-background text-foreground">
            <main>
                <section className="mx-auto max-w-6xl px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-10">
                    <div>
                        <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
                            About Alliger&apos;s House of Wings
                        </h2>
                        <p className="mt-3 text-foreground/80">
                            Family-owned and operated since 1983, Alliger&apos;s has been serving the Twin Tiers with unforgettable wings and
                            sauces made on the premises from closely guarded family recipes.
                        </p>

                        <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-maroon/10 text-maroon px-3 py-1 text-xs font-semibold">
                            26 unique wing sauce flavors
                        </div>

                        <figure className="mt-8 rounded-xl overflow-hidden border border-foreground/10 bg-foreground/[0.03]">
                            <div className="relative w-full aspect-[16/8] sm:aspect-[16/6]">
                                <Image
                                    src="/images/house-wings.jpg"
                                    alt="Alliger's House of Wings exterior"
                                    fill
                                    priority
                                    className="object-cover"
                                    sizes="(max-width:768px) 100vw, 800px"
                                />
                            </div>
                        </figure>

                        {/* Section headers with accent bar */}
                        <h3 className="mt-10 flex items-center gap-3 text-xl font-semibold">
                            <span className="inline-block h-1 w-6 rounded-full bg-maroon" />
                            Our story
                        </h3>
                        <p className="mt-2 text-foreground/80">
                            In 1983, owners Henry and Karen Fratarcangeli purchased Alliger&apos;s Tavern in Sayre, Pennsylvania, incorporated, and
                            introduced chicken wings to the Valley Area in three classic flavors: mild, medium, and hot. A couple of years later,
                            Barbeque and South joined the lineup. Since then, we&apos;ve grown to 26 distinct flavors—and locals still say
                            we have the best wings around.
                        </p>

                        <h3 className="mt-10 flex items-center gap-3 text-xl font-semibold">
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

                        <div className="mt-6 flex flex-wrap gap-3">
                            <Link
                                href="/sauces"
                                className="inline-flex items-center rounded-full bg-maroon text-pure px-5 py-2 text-sm font-semibold hover:brightness-110"
                            >
                                Shop sauces
                            </Link>
                            <a
                                href="tel:+15708889805"
                                className="inline-flex items-center rounded-full border border-foreground/20 text-foreground px-5 py-2 text-sm font-semibold hover:bg-foreground/5"
                            >
                                (570) 888-9805
                            </a>

                        </div>
                    </div>

                    <div
                        id="location"
                        className="rounded-xl overflow-hidden border border-black/10 dark:border-white/10 bg-pure flex flex-col h-full"
                    >
                        <div className="flex-1 min-h-[320px]">
                            <iframe
                                title="Alliger's House of Wings Map"
                                src="https://www.google.com/maps?q=201+Spring+Street,+Sayre,+PA+18840&output=embed"
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                className="h-full w-full border-0 block"
                            />
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}