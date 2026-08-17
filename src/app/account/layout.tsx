import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { initials } from "@/lib/utils";
import { AccountNav } from "@/components/account/account-nav";

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) redirect("/login?next=/account");

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="lg:w-64 lg:shrink-0">
          <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-600 text-sm font-bold text-white">
              {initials(user.name)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-gray-900">{user.name}</p>
              <p className="truncate text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <AccountNav />
        </aside>
        <main className="min-w-0 flex-1">{children}</main>
      </div>
    </div>
  );
}
