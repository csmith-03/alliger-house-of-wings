const ADDRESS = "201 Spring Street, Sayre, PA 18840";
const MAP_Q = encodeURIComponent(ADDRESS);

export default function HoursLocationPage() {
  return (
    <main className="mx-auto max-w-6xl px-6 py-16 font-sans text-foreground grid gap-10 lg:grid-cols-2">
      <section id="hours">
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
          Hours &amp; Location
        </h1>

        <div className="mt-6 space-y-3 text-sm">
          <div><span className="font-semibold">Mon–Thu:</span> 11:00 AM – 9:00 PM</div>
          <div><span className="font-semibold">Fri–Sat:</span> 11:00 AM – 10:00 PM</div>
          <div><span className="font-semibold">Sun:</span> 12:00 PM – 8:00 PM</div>

          <div className="mt-4">
            <div className="font-semibold">Address</div>
            <div>{ADDRESS}</div>
            <a
              className="text-[#7a0d0d] underline"
              target="_blank"
              href={`https://www.google.com/maps/search/?api=1&query=${MAP_Q}`}
            >
              Get Directions
            </a>
          </div>
        </div>
      </section>

      <section id="map" className="min-h-[320px]">
        <div className="aspect-video w-full overflow-hidden rounded-xl border border-foreground/10 bg-foreground/[0.03]">
          <iframe
            className="h-full w-full"
            loading="lazy"
            allowFullScreen
            referrerPolicy="no-referrer-when-downgrade"
            title="Alliger's House of Wings Map"
            src={`https://www.google.com/maps?q=${MAP_Q}&output=embed`}
          />
        </div>
      </section>
    </main>
  );
}
