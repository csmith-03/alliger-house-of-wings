import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Info, ChevronDown } from "lucide-react";

export default function AboutDropdown() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  // close on outside click or Esc
  useEffect(() => {
    function onDocMouseDown(e: MouseEvent) {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocMouseDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocMouseDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div ref={rootRef} className="relative inline-block">
      <button
        type="button"
        // open by hover OR click
        onMouseEnter={() => setOpen(true)}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border border-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5 transition-colors"
      >
        <Info className="h-4 w-4" />
        About
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full mt-2 w-56 rounded-xl bg-background shadow-lg border border-foreground/10"
          role="menu"
          // keep open while hovered; close when leaving the panel
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <ul className="py-2">
            <li>
              <Link href="/about/our-story" className="block px-4 py-2 hover:bg-foreground/5">
                Our Story
              </Link>
            </li>
            <li>
              <Link href="/about/benefits-of-cayenne" className="block px-4 py-2 hover:bg-foreground/5">
                Benefits of Cayenne
              </Link>
            </li>
            <li>
              <Link href="/about/hours-location#hours" className="block px-4 py-2 hover:bg-foreground/5">
                Hours &amp; Location
              </Link>
            </li>
            <li>
              <Link href="/about/contact" className="block px-4 py-2 hover:bg-foreground/5">
                Contact Us
              </Link>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
}
