// ============================================================
// Generalized Tax Invoice Template (TypeScript)
// Reusable types + builder/render helpers — no hardcoded data.
// Works for any seller/customer/items; supports GST (CGST+SGST)
// or IGST style tax breakups.
// ============================================================

export interface Address {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  phone?: string;
  mobile?: string;
}

export interface Seller {
  name: string;
  gstin: string;
  address: Address;
  logoUrl?: string;
}

export interface Customer {
  name: string;
  billingAddress: Address;
  shippingAddress: Address;
}

export interface InvoiceItem {
  slNo: number;
  itemName: string;
  hsnSac: string;
  taxRatePercent: number; // total GST %, e.g. 18
  quantity: number;
  unit: string; // e.g. "NOS", "KG", "PCS"
  ratePerItem: number;
  amount: number; // quantity * ratePerItem (pre-tax)
}

export interface TaxBreakupRow {
  hsnSac: string;
  taxableValue: number;
  centralTax?: { rate: number; amount: number }; // omit for IGST-only invoices
  stateTax?: { rate: number; amount: number }; // omit for IGST-only invoices
  integratedTax?: { rate: number; amount: number }; // for inter-state supply
  totalTaxAmount: number;
}

export interface BankDetails {
  bankName: string;
  accountNumber: string;
  ifsc: string;
  branch: string;
}

export interface PaymentInfo {
  isPaid: boolean;
  amountPaid: number;
  paymentMode?: string; // e.g. "UPI", "NEFT", "Cash"
  paymentDate?: string; // ISO date string
  upiQrImageUrl?: string;
}

export interface InvoiceTotals {
  taxableAmount: number;
  cgstPercent?: number;
  cgstAmount?: number;
  sgstPercent?: number;
  sgstAmount?: number;
  igstPercent?: number;
  igstAmount?: number;
  totalQuantity: number;
  grandTotal: number;
  amountInWords: string;
}

export interface TaxInvoice {
  invoiceType: "TAX INVOICE";
  copyType?: string; // e.g. "ORIGINAL FOR RECIPIENT", "DUPLICATE FOR TRANSPORTER"
  invoiceNumber: string;
  invoiceDate: string; // ISO date string
  dueDate?: string; // ISO date string
  placeOfSupply: string;

  seller: Seller;
  customer: Customer;

  items: InvoiceItem[];
  totals: InvoiceTotals;
  taxBreakup: TaxBreakupRow[];

  bankDetails?: BankDetails;
  payment?: PaymentInfo;

  notes?: string;
  termsAndConditions?: string[];

  pageInfo?: string;
  digitallySigned?: boolean;
}

// ============================================================
// Input shape for building an invoice from raw line items
// (You supply items + rates; totals/taxBreakup are derived.)
// ============================================================

export interface InvoiceItemInput {
  itemName: string;
  hsnSac: string;
  taxRatePercent: number;
  quantity: number;
  unit: string;
  ratePerItem: number;
}

export interface BuildInvoiceOptions {
  invoiceNumber: string;
  invoiceDate: string;
  dueDate?: string;
  placeOfSupply: string;
  copyType?: string;
  seller: Seller;
  customer: Customer;
  items: InvoiceItemInput[];
  isInterState?: boolean; // true => IGST, false/undefined => CGST+SGST split
  bankDetails?: BankDetails;
  payment?: PaymentInfo;
  notes?: string;
  termsAndConditions?: string[];
  amountInWords: string; // caller supplies (or plug in a number-to-words lib)
}

// ============================================================
// Core computation helpers
// ============================================================

const round2 = (n: number): number => Math.round(n * 100) / 100;

export function computeItemAmount(item: Pick<InvoiceItemInput, "quantity" | "ratePerItem">): number {
  return round2(item.quantity * item.ratePerItem);
}

export function computeTaxableAmount(items: InvoiceItem[]): number {
  return round2(items.reduce((sum, item) => sum + item.amount, 0));
}

export function computeTotalQuantity(items: InvoiceItem[]): number {
  return round2(items.reduce((sum, item) => sum + item.quantity, 0));
}

/** Groups items by HSN/SAC and computes the tax breakup table rows. */
export function buildTaxBreakup(items: InvoiceItem[], isInterState: boolean): TaxBreakupRow[] {
  const byHsn = new Map<string, InvoiceItem[]>();
  for (const item of items) {
    const group = byHsn.get(item.hsnSac) ?? [];
    group.push(item);
    byHsn.set(item.hsnSac, group);
  }

  const rows: TaxBreakupRow[] = [];
  for (const [hsnSac, group] of byHsn) {
    const taxableValue = round2(group.reduce((sum, i) => sum + i.amount, 0));
    // Assumes uniform tax rate per HSN group; adjust if rates vary within a group.
    const rate = group[0].taxRatePercent;

    if (isInterState) {
      const igstAmount = round2((taxableValue * rate) / 100);
      rows.push({
        hsnSac,
        taxableValue,
        integratedTax: { rate, amount: igstAmount },
        totalTaxAmount: igstAmount,
      });
    } else {
      const halfRate = rate / 2;
      const centralAmount = round2((taxableValue * halfRate) / 100);
      const stateAmount = round2((taxableValue * halfRate) / 100);
      rows.push({
        hsnSac,
        taxableValue,
        centralTax: { rate: halfRate, amount: centralAmount },
        stateTax: { rate: halfRate, amount: stateAmount },
        totalTaxAmount: round2(centralAmount + stateAmount),
      });
    }
  }
  return rows;
}

export function computeGrandTotal(taxableAmount: number, taxBreakup: TaxBreakupRow[]): number {
  const totalTax = round2(taxBreakup.reduce((sum, row) => sum + row.totalTaxAmount, 0));
  return round2(taxableAmount + totalTax);
}

// ============================================================
// Builder: assembles a full TaxInvoice from raw inputs
// ============================================================

export function buildTaxInvoice(options: BuildInvoiceOptions): TaxInvoice {
  const items: InvoiceItem[] = options.items.map((input, idx) => ({
    slNo: idx + 1,
    itemName: input.itemName,
    hsnSac: input.hsnSac,
    taxRatePercent: input.taxRatePercent,
    quantity: input.quantity,
    unit: input.unit,
    ratePerItem: input.ratePerItem,
    amount: computeItemAmount(input),
  }));

  const taxableAmount = computeTaxableAmount(items);
  const totalQuantity = computeTotalQuantity(items);
  const isInterState = options.isInterState ?? false;
  const taxBreakup = buildTaxBreakup(items, isInterState);
  const grandTotal = computeGrandTotal(taxableAmount, taxBreakup);

  const totals: InvoiceTotals = isInterState
    ? {
        taxableAmount,
        igstPercent: items[0]?.taxRatePercent,
        igstAmount: round2(taxBreakup.reduce((s, r) => s + (r.integratedTax?.amount ?? 0), 0)),
        totalQuantity,
        grandTotal,
        amountInWords: options.amountInWords,
      }
    : {
        taxableAmount,
        cgstPercent: (items[0]?.taxRatePercent ?? 0) / 2,
        cgstAmount: round2(taxBreakup.reduce((s, r) => s + (r.centralTax?.amount ?? 0), 0)),
        sgstPercent: (items[0]?.taxRatePercent ?? 0) / 2,
        sgstAmount: round2(taxBreakup.reduce((s, r) => s + (r.stateTax?.amount ?? 0), 0)),
        totalQuantity,
        grandTotal,
        amountInWords: options.amountInWords,
      };

  return {
    invoiceType: "TAX INVOICE",
    copyType: options.copyType,
    invoiceNumber: options.invoiceNumber,
    invoiceDate: options.invoiceDate,
    dueDate: options.dueDate,
    placeOfSupply: options.placeOfSupply,
    seller: options.seller,
    customer: options.customer,
    items,
    totals,
    taxBreakup,
    bankDetails: options.bankDetails,
    payment: options.payment,
    notes: options.notes,
    termsAndConditions: options.termsAndConditions,
  };
}

// ============================================================
// Example usage (delete or adapt as needed):
//
// const invoice = buildTaxInvoice({
//   invoiceNumber: "INV-101",
//   invoiceDate: "2026-08-10",
//   placeOfSupply: "29-KARNATAKA",
//   copyType: "ORIGINAL FOR RECIPIENT",
//   seller: { name: "...", gstin: "...", address: { ... } },
//   customer: { name: "...", billingAddress: { ... }, shippingAddress: { ... } },
//   items: [
//     { itemName: "Item A", hsnSac: "1234", taxRatePercent: 18, quantity: 2, unit: "NOS", ratePerItem: 100 },
//   ],
//   amountInWords: "INR Two Hundred Rupees Only",
// });
// ============================================================