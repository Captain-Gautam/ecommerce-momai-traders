import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { AdminLoginForm } from "@/components/admin/admin-login-form";

export const metadata: Metadata = { title: "Admin Login" };

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const session = await getSession();
  if (session?.role === "ADMIN") redirect("/admin");

  const { next } = await searchParams;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex flex-col items-center text-center">
          <span className="flex size-12 items-center justify-center rounded-xl bg-brand-600 text-xl font-bold text-white">
            M
          </span>
          <h1 className="mt-4 text-xl font-bold text-gray-900">Momai Traders Admin</h1>
          <p className="mt-1 text-sm text-gray-500">Sign in with your administrator account.</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <AdminLoginForm next={next} />
        </div>
        <p className="mt-4 text-center text-xs text-gray-400">
          <Link href="/" className="text-brand-600 hover:underline">← Back to storefront</Link>
        </p>
      </div>
    </div>
  );
}
