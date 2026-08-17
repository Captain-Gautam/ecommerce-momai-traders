import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { AuthForm } from "@/components/shop/auth-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Sign In" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const session = await getSession();
  const { next } = await searchParams;

  if (session) {
    const target =
      session.role === "ADMIN"
        ? "/admin"
        : typeof next === "string" && next.startsWith("/")
          ? next
          : "/account";
    redirect(target);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <AuthForm mode="login" next={typeof next === "string" ? next : undefined} />
    </div>
  );
}
