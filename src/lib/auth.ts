import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE, signSessionToken, verifySessionToken, type SessionUser } from "@/lib/session-token";

export { SESSION_COOKIE, verifySessionToken };

const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await signSessionToken(user);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  return verifySessionToken(token);
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    select: {
      id: true,
      name: true,
      businessName: true,
      email: true,
      phone: true,
      role: true,
    },
  });
}

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/login?next=/account");
  return session;
}

export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  const user = await prisma.user.findUnique({ where: { id: session.id } });
  if (!user || user.role !== "ADMIN") redirect("/admin/login");
  return { ...session, dbUser: user };
}
