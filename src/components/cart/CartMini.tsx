"use client";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/app/cart-provider";
import { usePathname } from "next/navigation";
import { useTheme } from "@/app/theme-provider";

export default function CartMini() {
  const { count } = useCart();
  const pathname = usePathname();
  const { theme } = useTheme();

  const active = pathname === "/checkout" || pathname.startsWith("/checkout");

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
      href="/checkout"
      aria-label={`Checkout (${count} item${count === 1 ? "" : "s"})`}
      className={`${base} ${active ? activeCls : idleCls}`}
    >
      <ShoppingCart className="h-4 w-4" />
      <span>Checkout</span>
      <span className="min-w-[1.25rem] inline-flex items-center justify-center rounded-full bg-maroon text-pure text-[10px] leading-none px-2 py-1">
        {count}
      </span>
    </Link>
  );
}
