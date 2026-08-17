import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ProfileForm, PasswordForm } from "@/components/account/profile-forms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const session = await getSession();
  if (!session) return null;

  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Profile & Password</h1>
        <p className="mt-1 text-sm text-gray-500">Update your details and secure your account.</p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Profile</h2>
        <p className="mt-1 text-xs text-gray-400">Email cannot be changed — it&apos;s your login.</p>
        <div className="mt-4">
          <ProfileForm name={user.name} phone={user.phone} businessName={user.businessName} />
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-5">
        <h2 className="text-lg font-bold text-gray-900">Change Password</h2>
        <div className="mt-4">
          <PasswordForm />
        </div>
      </section>
    </div>
  );
}
