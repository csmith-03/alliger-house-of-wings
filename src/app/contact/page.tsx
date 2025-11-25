"use client";

export default function ContactPage() {
  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent mb-8 text-center">
        Contact Us
      </h1>
      <div className="space-y-6 rounded-lg border border-[color:var(--surface-border)] bg-surface p-6 shadow-sm">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Phone
          </h2>
          <p className="mt-1 text-lg font-medium">
            (570) 888-9801
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Email
          </h2>
          <p className="mt-1 text-lg font-medium">
            <a
              href="mailto:info@houseofwings.com"
              className="text-rooster hover:underline"
            >
              info@houseofwings.com
            </a>
          </p>
        </div>
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-foreground/70">
            Address
          </h2>
          <p className="mt-1 text-sm">
            Spring Street<br />
            Sayre, PA 18840
          </p>
        </div>
        <p className="text-xs text-foreground/60">
          Call during business hours for orders, catering, or questions.
        </p>
      </div>
    </section>
  );
}