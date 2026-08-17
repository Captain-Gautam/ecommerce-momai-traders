import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/shop/header";
import { Footer } from "@/components/shop/footer";
import { getSession } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { prisma } from "@/lib/db";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Momai Traders — Wholesale Supplier Of Cleaning Material & Stationery",
    template: "%s | Momai Traders",
  },
  description:
    "Wholesale supplier of cleaning material, stationery, packaging and washroom solutions in Ahmedabad, Gujarat. From Paper to Polish — your one stop solution.",
  keywords: [
    "packaging materials",
    "plastic packaging",
    "industrial tapes",
    "HDPE bags",
    "stretch films",
    "cleaning material",
    "stationery",
    "Ahmedabad",
    "Gujarat",
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const [settings, session] = await Promise.all([getSettings(), getSession()]);

  let cartCount = 0;
  if (session) {
    try {
      cartCount = await prisma.cartItem.count({ where: { userId: session.id } });
    } catch {
      cartCount = 0;
    }
  }

  const headerUser = session
    ? { name: session.name, email: session.email, role: session.role }
    : null;

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        <Header
          user={headerUser}
          cartCount={cartCount}
          settings={{ storeName: settings.storeName }}
        />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
