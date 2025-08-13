"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Utensils,
  Info,
  ShoppingCart,
  Phone,
  MapPin,
  Sun,
  Moon,
  Menu,
  X,
  Flame,
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();

  // Theme (manual only)
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    if (typeof document !== "undefined") {
      const attr = document.documentElement.getAttribute("data-theme");
      if (attr === "light" || attr === "dark") return attr as "light" | "dark";
    }
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("theme");
      if (stored === "light" || stored === "dark") return stored as "light" | "dark";
    }
    return "light";
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("theme", theme);
    } catch {}
  }, [theme]);
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === "theme" && (e.newValue === "light" || e.newValue === "dark")) {
        setTheme(e.newValue as "light" | "dark");
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);
  const toggleTheme = () => setTheme((t) => (t === "dark" ? "light" : "dark"));

  // Mobile drawer
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const toggle = () => setOpen((o) => !o);

  // Close drawer on route change, ESC, and lock scroll
  useEffect(() => close(), [pathname]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    const prev = document.body.style.overflow;
    if (open) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const navLink = (href: string, label: string, Icon: any) => {
    const active = pathname === href;
    const cls =
      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors";
    const activeCls = "border-maroon text-maroon bg-maroon/5";
    const idleCls =
      "border-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5";
    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${cls} ${active ? activeCls : idleCls}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  return (
    <>
      <header className="sticky top-0 z-10 bg-pure/80 dark:bg-black/30 backdrop-blur border-b border-black/10 dark:border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center">
          {/* Brand left */}
          <Link
            href="/"
            aria-label="Alliger's House of Wings home"
            className="flex items-center gap-3 group transition-transform"
          >
            <Image
              src="/logo.png"
              alt="Alliger's House of Wings logo"
              width={56}
              height={56}
              priority
              className="h-12 w-12 sm:h-14 sm:w-14"
            />
            <div className="leading-tight">
              <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent drop-shadow-[0_1px_0_rgba(0,0,0,0.35)]">
                Alliger&apos;s
              </span>
              <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">
                House of Wings
              </span>
            </div>
            <span className="ml-2 hidden sm:inline-flex items-center rounded-full bg-maroon/10 text-maroon px-2.5 py-1 text-[10px] font-bold tracking-wide">
              Since 1983
            </span>
          </Link>

          {/* Nav right */}
          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
            {/* Mobile: hamburger */}
            <button
              type="button"
              onClick={toggle}
              aria-label="Open menu"
              aria-controls="mobile-drawer"
              aria-expanded={open}
              className="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-full border border-foreground/20 text-foreground/80 hover:bg-foreground/5"
            >
              <Menu className="h-4 w-4" />
            </button>

            {/* Tabs (desktop) */}
            <div className="hidden md:flex items-center gap-2">
              {navLink("/", "Menu", Utensils)}
              {navLink("/sauces", "Sauces", Flame)}
              {navLink("/about", "About", Info)}
              {navLink("/checkout", "Checkout", ShoppingCart)}
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

            {/* Mobile: icon-only Shop */}
            <Link
              href="https://store.houseofwings.com"
              target="_blank"
              className="inline-flex md:hidden items-center justify-center h-9 w-9 rounded-full bg-fire text-pure hover:bg-maroon"
              aria-label="Shop sauces"
            >
              <ShoppingCart className="h-4 w-4" />
            </Link>

            {/* Desktop: full Shop button */}
            <Link
              href="https://store.houseofwings.com"
              target="_blank"
              className="hidden md:inline-flex items-center gap-2 rounded-full bg-fire text-pure hover:bg-maroon transition-colors px-4 py-2 text-sm font-semibold shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-fire"
            >
              <ShoppingCart className="h-4 w-4" />
              Shop sauces
            </Link>

            {/* Actions (hidden on small) */}
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
          </nav>
        </div>
      </header>

      {/* Overlay */}
      <button
        aria-hidden={!open}
        onClick={close}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />

      {/* Drawer */}
      <aside
        id="mobile-drawer"
        className={`fixed left-0 top-0 z-50 h-full w-72 bg-background text-foreground border-r border-black/10 dark:border-white/10 md:hidden transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-4 flex items-center justify-between border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="" width={28} height={28} className="h-7 w-7" />
            <span className="text-base font-semibold">Alliger&apos;s</span>
          </div>
          <button
            onClick={close}
            aria-label="Close menu"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-foreground/20 text-foreground/80 hover:bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          <Link onClick={close} href="/" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5">
            <Utensils className="h-4 w-4" />
            Menu
          </Link>
          <Link onClick={close} href="/sauces" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5">
            <Flame className="h-4 w-4" />
            Sauces
          </Link>
          <Link onClick={close} href="/about" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5">
            <Info className="h-4 w-4" />
            About
          </Link>
          <Link onClick={close} href="/checkout" className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5">
            <ShoppingCart className="h-4 w-4" />
            Checkout
          </Link>
        </nav>

        <div className="mt-auto p-4 border-t border-black/10 dark:border-white/10 space-y-2">
          <button
            onClick={toggleTheme}
            className="w-full inline-flex items-center justify-between rounded-lg border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
          >
            <span>Theme</span>
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          <a
            href="tel:+15708889805"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-maroon text-maroon px-3 py-2 text-sm font-medium hover:bg-maroon hover:text-pure transition-colors"
          >
            <Phone className="h-4 w-4" />
            Call
          </a>
          <a
            href="https://maps.apple.com/?q=201%20Spring%20Street%2C%20Sayre%2C%20PA%2018840"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-rooster text-rooster px-3 py-2 text-sm font-medium hover:bg-rooster hover:text-foreground transition-colors"
          >
            <MapPin className="h-4 w-4" />
            Directions
          </a>
          <Link
            href="https://store.houseofwings.com"
            target="_blank"
            className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-fire text-pure px-3 py-2 text-sm font-semibold hover:bg-maroon transition-colors"
          >
            <ShoppingCart className="h-4 w-4" />
            Shop sauces
          </Link>
        </div>
      </aside>
    </>
  );
}