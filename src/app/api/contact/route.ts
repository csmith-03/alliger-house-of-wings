import { NextResponse } from "next/server";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: Request) {
  const data = await req.formData();
  const name = data.get("name");
  const email = data.get("email");
  const message = data.get("message");

  try {
    await resend.emails.send({
      from: data.get("email") as string,
      to: "channing19smith@gmail.com", // <-- your defined email
      subject: `Contact Form Submission from ${name}`,
      replyTo: email as string,
      text: `Name: ${name}\nEmail: ${email}\nMessage:\n${message}`,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}