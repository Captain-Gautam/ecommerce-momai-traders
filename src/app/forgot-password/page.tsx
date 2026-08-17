import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { ForgotPasswordForm } from "@/components/shop/forgot-password-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Forgot Password" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  const { next } = await searchParams;

  if (session) {
    redirect(session.role === "ADMIN" ? "/admin" : "/account");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <ForgotPasswordForm next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
