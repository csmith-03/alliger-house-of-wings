"use server";

export async function getOrder(pi: string) {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/api/orders/${pi}`,
    { cache: "no-store" }
  ).catch(() => null);

  if (!res || !res.ok) return null;
  return res.json();
}