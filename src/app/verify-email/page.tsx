import type { Metadata } from "next";
import { AuthShell } from "@/components/auth-shell";
import { VerifyEmailForm } from "@/components/auth-forms";

export const metadata: Metadata = { title: "Verify email" };

export default async function VerifyEmailPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const sp = await searchParams;
  const email = typeof sp.email === "string" ? sp.email : "";
  return (
    <AuthShell>
      <VerifyEmailForm email={email} />
    </AuthShell>
  );
}
