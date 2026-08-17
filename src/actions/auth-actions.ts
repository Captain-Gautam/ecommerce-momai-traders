"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { hashPassword, verifyPassword } from "@/lib/password";
import { setSessionCookie, destroySession } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import {
  generateOtp,
  hashOtp,
  verifyOtp,
  OTP_TTL_MS,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_MS,
  OTP_MAX_PER_WINDOW,
  OTP_WINDOW_MS,
} from "@/lib/otp";
import { loginSchema, registerSchema, forgotEmailSchema, resetPasswordSchema } from "@/lib/validators";

export type AuthState = {
  error?: string;
  success?: boolean;
  fieldErrors?: Record<string, string[]>;
};

export async function registerAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    businessName: formData.get("businessName") || undefined,
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  const existing = await prisma.user.findUnique({ where: { email: data.email } });
  if (existing) {
    return { fieldErrors: { email: ["An account with this email already exists. Please sign in."] } };
  }

  const passwordHash = await hashPassword(data.password);
  const user = await prisma.user.create({
    data: {
      name: data.name,
      businessName: data.businessName || null,
      email: data.email,
      phone: data.phone || null,
      passwordHash,
    },
  });

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/account");
}

export async function loginAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !(await verifyPassword(parsed.data.password, user.passwordHash))) {
    return { error: "Invalid email or password." };
  }

  await setSessionCookie({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  const next = formData.get("next");
  const target =
    user.role === "ADMIN"
      ? "/admin"
      : typeof next === "string" && next.startsWith("/")
        ? next
        : "/account";
  redirect(target);
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/");
}

// ---------- Password reset (email OTP) ----------

export async function sendResetOtpAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = forgotEmailSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const email = parsed.data.email;
  const now = new Date();

  const [latest, recentCount] = await Promise.all([
    prisma.passwordResetOtp.findFirst({
      where: { email },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
    prisma.passwordResetOtp.count({
      where: { email, createdAt: { gte: new Date(now.getTime() - OTP_WINDOW_MS) } },
    }),
  ]);

  if (latest && now.getTime() - latest.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    return { error: "Please wait a moment before requesting a new code." };
  }
  if (recentCount >= OTP_MAX_PER_WINDOW) {
    return { error: "Too many codes requested. Please try again later." };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return { success: true };

  await prisma.passwordResetOtp.updateMany({
    where: { email, used: false },
    data: { used: true },
  });

  const otp = generateOtp();
  await prisma.passwordResetOtp.create({
    data: {
      email,
      otpHash: await hashOtp(otp),
      expiresAt: new Date(now.getTime() + OTP_TTL_MS),
    },
  });

  const sent = await sendMail({
    to: email,
    subject: "Your password reset code",
    text: `Your Momai Traders password reset code is ${otp}. It is valid for 10 minutes. If you did not request this, you can ignore this email.`,
    html: `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;">
      <h2 style="color:#1d4ed8;margin:0 0 8px;">Password reset</h2>
      <p style="color:#374151;font-size:14px;">Use the code below to reset your Momai Traders account password.</p>
      <p style="margin:16px 0;padding:16px;background:#eff6ff;border-radius:8px;text-align:center;font-size:28px;letter-spacing:8px;font-weight:700;color:#1e40af;">${otp}</p>
      <p style="color:#6b7280;font-size:12px;">This code expires in 10 minutes. If you did not request it, you can safely ignore this email.</p>
    </div>
    `,
  });
  if (!sent) {
    return { error: "We could not send the code email right now. Please try again shortly." };
  }

  return { success: true };
}

export async function resetPasswordAction(
  _prev: AuthState | undefined,
  formData: FormData
): Promise<AuthState> {
  const parsed = resetPasswordSchema.safeParse({
    email: formData.get("email"),
    otp: formData.get("otp"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });
  if (!parsed.success) return { fieldErrors: parsed.error.flatten().fieldErrors };

  const { email, otp, password } = parsed.data;

  const record = await prisma.passwordResetOtp.findFirst({
    where: { email, used: false, expiresAt: { gt: new Date() } },
    orderBy: { createdAt: "desc" },
  });

  if (!record) {
    return { error: "This code is invalid or has expired. Please request a new one." };
  }
  if (record.attempts >= OTP_MAX_ATTEMPTS) {
    return { error: "Too many incorrect attempts. Please request a new code." };
  }

  const valid = await verifyOtp(otp, record.otpHash);
  if (!valid) {
    const attempts = record.attempts + 1;
    await prisma.passwordResetOtp.update({
      where: { id: record.id },
      data: { attempts },
    });
    return {
      error:
        attempts >= OTP_MAX_ATTEMPTS
          ? "Too many incorrect attempts. Please request a new code."
          : `Incorrect code. ${OTP_MAX_ATTEMPTS - attempts} attempts remaining.`,
    };
  }

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return { error: "No account found with this email." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password) },
    }),
    prisma.passwordResetOtp.update({ where: { id: record.id }, data: { used: true } }),
  ]);

  return { success: true };
}
