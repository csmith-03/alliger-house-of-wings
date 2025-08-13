"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Utensils, Info, ShoppingCart, Phone, MapPin, Sun, Moon } from "lucide-react";

// ...existing code...

export default function Header() {
  const pathname = usePathname();

  // Theme state
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("theme") : null;
    const preferredDark =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches;

    const initial = (stored as "light" | "dark") ?? (preferredDark ? "dark" : "light");
    setTheme(initial);
    document.documentElement.setAttribute("data-theme", initial);
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  return (
    <header className="sticky top-0 z-10 bg-pure/80 dark:bg-black/30 backdrop-blur border-b border-black/10 dark:border-white/10">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex items-center">
        {/* Brand left */}
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Alliger's House of Wings logo"
            width={48}
            height={48}
            priority
            className="h-12 w-12"
          />
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-maroon">Alliger&apos;s</span>
            <span className="text-sm sm:text-base font-medium text-foreground/70">House of Wings</span>
          </div>
        </div>

        {/* Nav right */}
        <nav className="ml-auto flex items-center gap-3">
          {/* Tabs */}
          <div className="flex items-center gap-2">
            <Link
              href="/"
              aria-current={pathname === "/" ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                pathname === "/" ? "border-maroon text-maroon bg-maroon/5" : "border-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <Utensils className="h-4 w-4" />
              Menu
            </Link>
            <Link
              href="/about"
              aria-current={pathname === "/about" ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                pathname === "/about" ? "border-maroon text-maroon bg-maroon/5" : "border-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <Info className="h-4 w-4" />
              About
            </Link>
            <Link
              href="/checkout"
              aria-current={pathname === "/checkout" ? "page" : undefined}
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors ${
                pathname === "/checkout" ? "border-maroon text-maroon bg-maroon/5" : "border-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5"
              }`}
            >
              <ShoppingCart className="h-4 w-4" />
              Checkout
            </Link>
          </div>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            aria-pressed={theme === "dark"}
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-foreground/20 text-foreground/80 hover:bg-foreground/5"
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {/* Actions */}
          <a
            href="tel:+15708889805"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-maroon text-maroon hover:bg-maroon hover:text-pure transition-colors px-4 py-2 text-sm font-medium"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            href="https://maps.apple.com/?q=201%20Spring%20Street%2C%20Sayre%2C%20PA%2018840"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-full border border-rooster text-rooster hover:bg-rooster hover:text-foreground transition-colors px-4 py-2 text-sm font-medium"
          >
            <MapPin className="h-4 w-4" />
            Directions
          </a>
          <Link
            href="https://store.houseofwings.com"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-full bg-fire text-pure hover:bg-maroon transition-colors px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fire"
          >
            <ShoppingCart className="h-4 w-4" />
            Shop sauces
          </Link>
        </nav>
      </div>
    </header>
  );
}