import { prisma } from "@/lib/db";
import { getSettings } from "@/lib/settings";
import { generateInvoiceNumber } from "@/lib/utils";
import { amountInWords, type InvoiceData } from "@/lib/invoice";
import { parseOrderAddresses } from "@/lib/order-address";
import {
  buildTaxInvoice,
  type BuildInvoiceOptions,
  type TaxInvoice,
} from "@/lib/tax-invoice";

export async function buildInvoiceForOrder(order: {
  id: string;
  orderNumber: string;
  addressSnapshot: string;
  shippingAddressSnapshot: string | null;
  invoiceNumber: string | null;
  invoiceDate: Date | null;
  customerNote: string | null;
  adminNote: string | null;
  paymentMethod: "COD" | "BANK_TRANSFER" | "WHATSAPP";
  paymentStatus: "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";
  items: Array<{
    name: string;
    hsnCode: string | null;
    quantity: number;
    unit: string;
    unitPrice: number | null;
    gstRate: number;
  }>;
}): Promise<{ data: InvoiceData; pdfDate: Date; taxInvoice: TaxInvoice }> {
  const settings = await getSettings();
  const { billing, shipping } = parseOrderAddresses(order.addressSnapshot, order.shippingAddressSnapshot);

  let invoiceNumber = order.invoiceNumber;
  let invoiceDate = order.invoiceDate;
  const now = new Date();

  if (!invoiceNumber) {
    const count = await prisma.order.count({ where: { invoiceNumber: { not: null } } });
    invoiceNumber = generateInvoiceNumber(settings.invoicePrefix, count + 1);
    invoiceDate = now;
    await prisma.order.update({
      where: { id: order.id },
      data: { invoiceNumber, invoiceDate },
    });
  }

  const buyerState = (billing.state ?? "").trim().toUpperCase();
  const isInterState =
    buyerState !== "GUJARAT" && buyerState !== (settings.stateCode ?? "24").trim();

  const customerAddress = {
    line1: billing.line1 ?? "",
    line2: billing.line2 ?? "",
    city: billing.city ?? "",
    state: billing.state ?? "",
    pincode: billing.pincode ?? "",
  };

  const shippingAddress = {
    line1: shipping.line1 ?? "",
    line2: shipping.line2 ?? "",
    city: shipping.city ?? "",
    state: shipping.state ?? "",
    pincode: shipping.pincode ?? "",
  };

  const paymentMethodLabel =
    order.paymentMethod === "COD"
      ? "Cash"
      : order.paymentMethod === "BANK_TRANSFER"
        ? "NEFT"
        : "WhatsApp";

  const baseOptions: BuildInvoiceOptions = {
    invoiceNumber,
    invoiceDate: (invoiceDate ?? now).toISOString(),
    placeOfSupply: billing.state || "-",
    copyType: "ORIGINAL FOR RECIPIENT",
    seller: {
      name: settings.legalName,
      gstin: settings.gstin,
      address: {
        line1: settings.address,
        city: "",
        state: "Gujarat",
        pincode: "",
        phone: settings.phone1,
      },
    },
    customer: {
      name: billing.name ?? "Customer",
      billingAddress: customerAddress,
      shippingAddress: shippingAddress,
    },
    items: order.items.map((it) => ({
      itemName: it.name,
      hsnSac: it.hsnCode ?? "-",
      taxRatePercent: it.gstRate,
      quantity: it.quantity,
      unit: it.unit,
      ratePerItem: it.unitPrice ?? 0,
    })),
    isInterState,
    amountInWords: "",
    payment: {
      isPaid: order.paymentStatus === "PAID" || order.paymentStatus === "PARTIAL",
      amountPaid: 0,
      paymentMode: paymentMethodLabel,
    },
  };

  // Grand total is derived by the builder; run once to get it, then with words.
  const draft = buildTaxInvoice(baseOptions);
  const taxInvoice = buildTaxInvoice({
    ...baseOptions,
    amountInWords: amountInWords(draft.totals.grandTotal),
  });
  if (taxInvoice.payment) {
    taxInvoice.payment.amountPaid =
      order.paymentStatus === "PAID" ? taxInvoice.totals.grandTotal : 0;
  }

  // Track the receivable: whenever the GST invoice is generated, open an
  // outstanding entry for the amount printed on the PDF.
  const outstandingAmount = Math.round(taxInvoice.totals.grandTotal);
  const fullyPaid = order.paymentStatus === "PAID";
  await prisma.outstanding.upsert({
    where: { orderId: order.id },
    update: {
      invoiceNumber,
      invoiceDate: invoiceDate ?? now,
      amount: outstandingAmount,
      company: billing.businessName || billing.name || "Customer",
      contactName: billing.name || null,
      city: billing.city || "",
      state: billing.state || "",
    },
    create: {
      orderId: order.id,
      invoiceNumber,
      invoiceDate: invoiceDate ?? now,
      amount: outstandingAmount,
      company: billing.businessName || billing.name || "Customer",
      contactName: billing.name || null,
      city: billing.city || "",
      state: billing.state || "",
      paidAmount: fullyPaid ? outstandingAmount : 0,
      status: fullyPaid ? "SETTLED" : "OPEN",
    },
  });

  const data: InvoiceData = {
    invoiceNumber,
    invoiceDate: invoiceDate
      ? invoiceDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : now.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    orderNumber: order.orderNumber,
    buyer: {
      name: billing.name ?? "Customer",
      businessName: billing.businessName ?? null,
      line1: customerAddress.line1,
      line2: customerAddress.line2 || null,
      city: customerAddress.city,
      state: customerAddress.state,
      pincode: customerAddress.pincode,
    },
    seller: {
      legalName: settings.legalName,
      gstin: settings.gstin,
      address: settings.address,
      phone: settings.phone1,
      email: settings.email,
    },
    items: taxInvoice.items.map((it) => ({
      name: it.itemName,
      hsnCode: it.hsnSac === "-" ? null : it.hsnSac,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.ratePerItem,
      gstRate: it.taxRatePercent,
    })),
    customerNote: order.customerNote,
    adminNote: order.adminNote,
    dueDate: invoiceDate
      ? invoiceDate.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
      : null,
    bank:
      settings.bankName || settings.bankAccount
        ? {
            bankName: settings.bankName,
            accountNumber: settings.bankAccount,
            ifsc: settings.bankIfsc,
            branch: settings.bankBranch,
          }
        : null,
    upiId: settings.upiId || null,
    payment: {
      status: order.paymentStatus,
      method: paymentMethodLabel,
      paidAmount:
        order.paymentStatus === "PAID" || order.paymentStatus === "PARTIAL"
          ? taxInvoice.totals.grandTotal
          : 0,
    },
    footerNote: settings.invoiceFooterNote || null,
  };

  return { data, pdfDate: invoiceDate ?? now, taxInvoice };
}