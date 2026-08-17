import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/shop/auth-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Create Account" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const session = await getSession();
  const { next } = await searchParams;

  if (session) {
    redirect(typeof next === "string" && next.startsWith("/") ? next : "/account");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <AuthForm mode="register" next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
