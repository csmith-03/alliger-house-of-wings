import Header from "../../components/header";
import Footer from "../../components/footer";
import CartClient from "./cart-client";

export const metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="font-sans min-h-screen bg-background text-foreground">
      <main>
        <section className="mx-auto max-w-4xl px-6 py-16">
          <h1 className="text-3xl font-bold">Your Cart</h1>
          <CartClient />
        </section>
      </main>
    </div>
  );
}