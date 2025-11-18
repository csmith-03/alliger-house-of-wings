export const dynamic = "force-dynamic";

export default function MenuPage() {
  const pdfPath = "/Bar%20Menu.pdf";

  return (
    <main className="mx-auto max-w-5xl p-6 space-y-4">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Bar Menu</h1>
        <a
          href={pdfPath}
          download="Alligers-Bar-Menu.pdf"
          className="inline-flex items-center rounded-md border px-3 py-2 text-sm hover:bg-foreground/5"
        >
          Download PDF
        </a>
      </header>

      {/* inline PDF viewer */}
      <div className="rounded-md border overflow-hidden" style={{ height: "80vh" }}>
        <iframe
          title="Alliger's Menu"
          src={`${pdfPath}#view=FitH&toolbar=1&navpanes=0`}
          className="w-full h-full border-0"
        />
      </div>

      {/* fallback for browsers that block inline PDFs */}
      <p className="text-sm text-foreground/70">
        Can’t see the menu above?{" "}
        <a href={pdfPath} className="underline">
          Open the PDF in a new tab
        </a>.
      </p>
    </main>
  );
}