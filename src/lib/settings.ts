import { cache } from "react";
import { prisma } from "@/lib/db";
export { whatsappLink } from "@/lib/utils";

export type SiteSettings = {
  storeName: string;
  tagline: string;
  phone1: string;
  phone2: string;
  email: string;
  whatsapp: string;
  address: string;
  businessHours: string;
  mapEmbed: string;
  gstin: string;
  stateCode: string;
  legalName: string;
  invoicePrefix: string;
  challanPrefix: string;
  invoiceFooterNote: string;
  currency: string;
  bankName: string;
  bankAccount: string;
  bankIfsc: string;
  bankBranch: string;
  upiId: string;
};

const DEFAULTS: SiteSettings = {
  storeName: "Momai Traders",
  tagline: "Wholesale Supplier Of Cleaning Material & Stationery",
  phone1: "+91 99749 02733",
  phone2: "+91 87884 77773",
  email: "momaitraders73@gmail.com",
  whatsapp: "919974902733",
  address:
    "Shop-10, Simandhar Complex, Near Prabhat Chowk, Ghatlodiya, Ahmedabad, Gujarat 380061",
  businessHours: "Monday – Saturday: 9:00 AM – 9:00 PM | Sunday: Closed",
  mapEmbed: "",
  gstin: "",
  stateCode: "24",
  legalName: "Momai Traders",
  invoicePrefix: "MTINV",
  challanPrefix: "MTDC",
  invoiceFooterNote:
    "Thank you for your business! Prices are final as quoted. Goods once sold will not be taken back.",
  currency: "INR",
  bankName: "",
  bankAccount: "",
  bankIfsc: "",
  bankBranch: "",
  upiId: "",
};

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await prisma.setting.findMany();
  const map: Record<string, string> = {};
  for (const row of rows) map[row.key] = row.value;
  return { ...DEFAULTS, ...map };
});

export const DEFAULT_SETTINGS = DEFAULTS;
