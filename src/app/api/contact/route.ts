import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "Email service misconfigured (missing RESEND_API_KEY)" },
        { status: 500 }
      );
    }

    // test

    // Instantiate after checking key (avoids build-time error)
    const resend = new Resend(apiKey);

    // Accept form data or JSON gracefully
    let name: string | null = null;
    let email: string | null = null;
    let message: string | null = null;

    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data") || contentType.includes("application/x-www-form-urlencoded")) {
      const data = await req.formData();
      name = (data.get("name") as string) || "";
      email = (data.get("email") as string) || "";
      message = (data.get("message") as string) || "";
    } else {
      const body = await req.json().catch(() => ({}));
      name = body.name || "";
      email = body.email || "";
      message = body.message || "";
    }

    if (!email || !message) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    // Use a verified domain address here
    const FROM = "Alliger House of Wings <contact@yourdomain.com>";

    const result = await resend.emails.send({
      from: FROM,
      to: "channing19smith@gmail.com",
      subject: `Contact Form Submission from ${name || "Anonymous"}`,
      replyTo: email, // or replyTo depending on library version
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    });

    if (result?.error) {
      return NextResponse.json({ error: "Failed to send" }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Contact route error:", err);
    return NextResponse.json(
      { error: err?.message || "Internal error" },
      { status: 500 }
    );
  }
}