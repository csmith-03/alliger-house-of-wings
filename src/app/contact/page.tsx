"use client";

import { useState } from "react";

export default function ContactPage() {
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const formData = new FormData(e.currentTarget);

    const res = await fetch("/api/contact", {
      method: "POST",
      body: formData,
    });

    if (res.ok) setStatus("sent");
    else setStatus("error");
  }

  return (
    <section className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-maroon via-fire to-rooster bg-clip-text text-transparent mb-8 text-center">
        Get In Touch
      </h1>
      <form
        onSubmit={handleSubmit}
        className="bg-surface rounded-lg shadow-sm p-6 space-y-6 border border-[color:var(--surface-border)]"
      >
        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-2">
            Name
          </label>
          <input
            type="text"
            name="name"
            id="name"
            required
            placeholder="Jane Doe"
            className="w-full bg-surface-alt border border-[color:var(--surface-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rooster transition"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-2">
            Email
          </label>
          <input
            type="email"
            name="email"
            id="email"
            required
            placeholder="you@email.com"
            className="w-full bg-surface-alt border border-[color:var(--surface-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rooster transition"
          />
        </div>
        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-2">
            Message
          </label>
          <textarea
            name="message"
            id="message"
            required
            rows={4}
            placeholder="Type your message here..."
            className="w-full bg-surface-alt border border-[color:var(--surface-border)] rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rooster transition resize-none"
          />
        </div>
        <button
          type="submit"
          className="w-full rounded-full bg-maroon font-semibold py-2 text-base hover:brightness-110 transition"
          disabled={status === "sending"}
        >
          {status === "sending" ? "Sending..." : "Send Message"}
        </button>
        {status === "sent" && (
          <p className="text-green-600 font-medium text-center mt-2">
            Message sent! We'll get back to you soon.
          </p>
        )}
        {status === "error" && (
          <p className="text-red-600 font-medium text-center mt-2">
            Error sending message. Please try again.
          </p>
        )}
      </form>
    </section>
  );
}