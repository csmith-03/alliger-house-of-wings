"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useTheme } from "../app/theme-provider";
import { CartMini } from "@/components/cart";
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
  HeartPulse,
  FileDown,
  NotebookPen,
  Mail
} from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const { theme, toggleTheme, mounted } = useTheme();

  // Mobile drawer state
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  const toggle = () => setOpen((o) => !o);

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
    const base =
      "inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium border transition-colors";
    const activeCls =
      theme === "dark"
        ? "border-rooster text-rooster bg-rooster/10"
        : "border-maroon text-maroon bg-maroon/10";
    const idleCls =
      "border-transparent text-foreground/70 hover:text-foreground hover:bg-foreground/5";

    return (
      <Link
        key={href}
        href={href}
        aria-current={active ? "page" : undefined}
        className={`${base} ${active ? activeCls : idleCls}`}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Link>
    );
  };

  const sinceBadgeCls =
    theme === "dark"
      ? "bg-rooster/10 text-rooster"
      : "bg-maroon/10 text-maroon";

  return (
    <>
      <header className="sticky top-0 z-10 bg-pure/80 dark:bg-black/30 backdrop-blur border-b border-black/10 dark:border-white/10">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center">
          <Link href="/" aria-label="Home" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="Alliger's logo"
              width={56}
              height={56}
              className="h-12 w-12 sm:h-14 sm:w-14"
              loading="eager"
            />
            <div className="leading-tight">
              <span className="block text-2xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent">
                Alliger&apos;s
              </span>
              <span className="block text-[10px] sm:text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70">
                House of Wings
              </span>
            </div>
            <span
              className={`ml-2 hidden sm:inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${sinceBadgeCls}`}
            >
              Since 1983
            </span>
          </Link>

          <nav className="ml-auto flex items-center gap-2 sm:gap-3">
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

            <div className="hidden md:flex items-center gap-2">
              {navLink("/", "Home", Utensils)}
              {navLink("/menu", "Bar Menu", FileDown)}
              {navLink("/sauces", "Sauces", Flame)}
              {navLink("/recipes", "Recipes", NotebookPen)}
              {navLink("/benefits", "Benefits", HeartPulse)}
              {navLink("/about", "About", Info)}
              {navLink("/contact", "Contact", Mail)}
              <CartMini />
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              disabled={!mounted}
              aria-label={
                mounted
                  ? `Switch to ${theme === "dark" ? "light" : "dark"} mode`
                  : "Theme"
              }
              aria-pressed={theme === "dark"}
              className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-foreground/20 text-foreground/80 hover:bg-foreground/5"
              title={
                mounted
                  ? theme === "dark"
                    ? "Switch to light mode"
                    : "Switch to dark mode"
                  : "Theme"
              }
            >
              {mounted &&
                (theme === "dark" ? (
                  <Sun className="h-4 w-4" />
                ) : (
                  <Moon className="h-4 w-4" />
                ))}
            </button>
          </nav>
        </div>
      </header>

      <button
        aria-hidden={!open}
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden ${
          open ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
      />
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
            <img
              src="/logo.png"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7"
            />
            <span className="text-base font-semibold">Alliger&apos;s</span>
          </div>
          <button
            onClick={() => setOpen(false)}
            aria-label="Close menu"
            className="inline-flex items-center justify-center h-9 w-9 rounded-full border border-foreground/20 text-foreground/80 hover:bg-foreground/5"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="p-4 flex flex-col gap-2">
          <Link
            onClick={() => setOpen(false)}
            href="/menu"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            <Utensils className="h-4 w-4" /> Bar Menu
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/sauces"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            <Flame className="h-4 w-4" /> Sauces
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/recipes"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            <NotebookPen className="h-4 w-4" /> Recipes
          </Link>
          <Link
            onClick={close}
            href="/benefits"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            + <HeartPulse className="h-4 w-4" /> Benefits +{" "}
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/about"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            <Info className="h-4 w-4" /> About
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/contact"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            <Mail className="h-4 w-4" /> Contact
          </Link>
          <Link
            onClick={() => setOpen(false)}
            href="/cart"
            className="inline-flex items-center gap-2 rounded-lg px-3 py-2 hover:bg-foreground/5"
          >
            <ShoppingCart className="h-4 w-4" /> Cart
          </Link>
        </nav>

        <div className="mt-auto p-4 border-t border-black/10 dark:border-white/10 space-y-2">
          <button
            onClick={toggleTheme}
            disabled={!mounted}
            className="w-full inline-flex items-center justify-between rounded-lg border border-foreground/20 px-3 py-2 text-sm hover:bg-foreground/5"
          >
            <span>Theme</span>
            {mounted &&
              (theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              ))}
          </button>
        </div>
      </aside>
    </>
  );
}
