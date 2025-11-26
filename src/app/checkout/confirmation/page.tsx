export const runtime = "nodejs";

import { cookies } from "next/headers";
import ConfirmationClient from "./ConfirmationClient";

export default async function ConfirmationPage() {
  const cookieStore = await cookies();

  const pi = cookieStore.get("last_pi")?.value ?? "";
  const redirectStatus =
    cookieStore.get("last_redirect_status")?.value ?? "";

  return <ConfirmationClient pi={pi} redirectStatus={redirectStatus} />;
}