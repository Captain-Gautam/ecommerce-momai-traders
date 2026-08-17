export { generateInvoicePdf } from "./invoice-pdf";

// ---------- Tax computation ----------

export type InvoiceLine = {
  name: string;
  hsnCode: string | null;
  quantity: number;
  unit: string;
  unitPrice: number | null;
  gstRate: number;
};

export type InvoiceTotals = {
  lines: Array<InvoiceLine & {
    taxable: number;
    taxAmount: number;
    lineTotal: number;
  }>;
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  grandTotal: number;
};

const SELLER_STATE = "Gujarat"; // seller location (intra-state GST = CGST + SGST)
const SELLER_STATE_CODE = "24"; // GSTIN state code for Gujarat

function isIntraState(buyerState?: string): boolean {
  const s = (buyerState ?? "").trim().toUpperCase();
  return s === SELLER_STATE.toUpperCase() || s === SELLER_STATE_CODE;
}

export { isIntraState };

export function computeInvoiceTotals(
  items: InvoiceLine[],
  buyerState?: string
): InvoiceTotals {
  const intraState = isIntraState(buyerState);
  let subtotal = 0;
  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  const lines = items.map((item) => {
    const price = item.unitPrice ?? 0;
    const taxable = round2(price * item.quantity);
    const rate = item.gstRate ?? 0;
    const taxAmount = round2((taxable * rate) / 100);
    subtotal += taxable;
    if (intraState) {
      cgst += round2(taxAmount / 2);
      sgst += round2(taxAmount / 2);
    } else {
      igst += taxAmount;
    }
    return { ...item, taxable, taxAmount, lineTotal: round2(taxable + taxAmount) };
  });

  const totalTax = round2(cgst + sgst + igst);
  const grandTotal = round2(subtotal + totalTax);

  return {
    lines,
    subtotal: round2(subtotal),
    cgst: round2(cgst),
    sgst: round2(sgst),
    igst: round2(igst),
    totalTax,
    grandTotal,
  };
}

// ---------- Amount in words (Indian numbering) ----------

const ONES = [
  "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine",
  "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen",
  "Seventeen", "Eighteen", "Nineteen",
];
const TENS = [
  "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety",
];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  return `${TENS[Math.floor(n / 10)]}${n % 10 ? " " + ONES[n % 10] : ""}`;
}

function threeDigits(n: number): string {
  const h = Math.floor(n / 100);
  const rest = n % 100;
  const hPart = h ? `${ONES[h]} Hundred` : "";
  const restPart = rest ? twoDigits(rest) : "";
  return [hPart, restPart].filter(Boolean).join(" ");
}

export function amountInWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";
  const whole = Math.floor(amount);
  const paise = Math.round((amount - whole) * 100);

  let result = "";
  let num = whole;
  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;

  if (crore) result += `${threeDigits(crore)} Crore `;
  if (lakh) result += `${twoDigits(lakh)} Lakh `;
  if (thousand) result += `${twoDigits(thousand)} Thousand `;
  if (num) result += threeDigits(num);

  result = result.trim() + " Rupees";
  if (paise) result += ` and ${twoDigits(paise)} Paise`;
  return `${result} Only`;
}

// ---------- Invoice data shapes (consumed by the PDF renderer) ----------

export type InvoiceAddress = {
  name: string;
  businessName?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type InvoiceSeller = {
  legalName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
};

export type InvoiceBank = {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
};

export type InvoicePayment = {
  status: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";
  method: string;
  paidAmount?: number;
};

export type InvoiceData = {
  invoiceNumber: string;
  invoiceDate: string;
  orderNumber: string;
  dueDate?: string | null;
  buyer: InvoiceAddress;
  seller: InvoiceSeller;
  items: InvoiceLine[];
  customerNote?: string | null;
  adminNote?: string | null;
  bank?: InvoiceBank | null;
  upiId?: string | null;
  payment?: InvoicePayment | null;
  footerNote?: string | null;
};

export function formatPdfMoney(value: number | null | undefined): string {
  if (value == null) return "-";
  return value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
