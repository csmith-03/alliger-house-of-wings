import "./globals.css";
import type { Metadata } from "next";
import { CartProvider } from "./cart-provider";

export const metadata: Metadata = {
  title: {
    default: "Alliger's House of Wings",
    template: "%s – Alliger's House of Wings",
  },
  description: "Best chicken wing sauces in the Twin Tiers.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}