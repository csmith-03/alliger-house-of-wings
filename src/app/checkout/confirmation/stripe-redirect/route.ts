export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const pi =
    url.searchParams.get("payment_intent") ||
    url.searchParams.get("pi") ||
    "";
  const redirectStatus = url.searchParams.get("redirect_status") || "";

  const res = NextResponse.redirect(
    new URL("/checkout/confirmation", req.url),
  );

  // store only what is actually needed
  if (pi) {
    res.cookies.set("last_pi", pi, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
    });
  }

  if (redirectStatus) {
    res.cookies.set("last_redirect_status", redirectStatus, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 60 * 30,
      path: "/",
    });
  }

  return res;
}
