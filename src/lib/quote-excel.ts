import { Workbook } from "exceljs";
import type { SiteSettings } from "@/lib/settings";
import { formatINR } from "@/lib/utils";

export type QuoteExcelItem = {
  name: string;
  unit: string;
  quantity: number;
  hsnCode: string | null;
  gstRate: number;
  unitPrice?: number | null;
};

export type QuoteExcelMeta = {
  name: string;
  email?: string;
  phone?: string;
  message: string;
};

const LAST_COL = 8;
const ACCENT = "FF1D4ED8";
const MUTED = "FF6B7280";

export async function buildQuoteExcel(
  items: QuoteExcelItem[],
  meta: QuoteExcelMeta,
  settings: SiteSettings,
  opts?: { priced?: boolean; grandTotal?: number }
): Promise<Buffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Quote");

  const priced = opts?.priced === true;
  const columnCount = priced ? LAST_COL : 6;

  const widths = priced
    ? [6, 40, 11, 10, 13, 10, 14, 14]
    : [6, 45, 12, 10, 14, 10];
  widths.forEach((w, i) => (sheet.getColumn(i + 1).width = w));

  const centerAlign = { horizontal: "center", vertical: "middle" } as const;

  // Row 1 — Company name at top middle
  const titleRow = sheet.getRow(1);
  titleRow.height = 30;
  sheet.mergeCells(1, 1, 1, columnCount);
  titleRow.getCell(1).value = settings.storeName;
  titleRow.getCell(1).font = { bold: true, size: 18, color: { argb: ACCENT } };
  titleRow.getCell(1).alignment = centerAlign;

  // Row 2 — Tagline
  const taglineRow = sheet.getRow(2);
  sheet.mergeCells(2, 1, 2, columnCount);
  taglineRow.getCell(1).value = settings.tagline;
  taglineRow.getCell(1).font = { italic: true, size: 10, color: { argb: MUTED } };
  taglineRow.getCell(1).alignment = centerAlign;

  // Row 3 — Address
  const addressRow = sheet.getRow(3);
  sheet.mergeCells(3, 1, 3, columnCount);
  addressRow.getCell(1).value = settings.address;
  addressRow.getCell(1).font = { size: 9, color: { argb: MUTED } };
  addressRow.getCell(1).alignment = centerAlign;

  // Row 5 — Heading
  const headingRow = sheet.getRow(5);
  sheet.mergeCells(5, 1, 5, columnCount);
  headingRow.getCell(1).value = priced ? "QUOTATION" : "QUOTE REQUEST";
  headingRow.getCell(1).font = { bold: true, size: 13, color: { argb: ACCENT } };
  headingRow.getCell(1).alignment = centerAlign;

  // Meta info rows
  const infoRows: Array<{ label: string; value: string }> = [
    {
      label: "Date",
      value: new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    },
    { label: "Requested by", value: meta.name },
    ...(meta.phone ? [{ label: "Phone", value: meta.phone }] : []),
    ...(meta.email ? [{ label: "Email", value: meta.email }] : []),
    { label: "Requirement", value: meta.message },
  ];

  let rowNum = 6;
  for (const info of infoRows) {
    const row = sheet.getRow(rowNum);
    const labelCell = row.getCell(1);
    labelCell.value = info.label;
    labelCell.font = { bold: true };
    sheet.mergeCells(rowNum, 2, rowNum, columnCount);
    const valueCell = row.getCell(2);
    valueCell.value = info.value;
    if (info.label === "Requirement") valueCell.alignment = { wrapText: true };
    row.height = info.label === "Requirement" ? 30 : 18;
    rowNum += 1;
  }

  // Blank row, then table header
  const headerRowNum = rowNum + 1;
  const headerRow = sheet.getRow(headerRowNum);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  headerRow.height = 22;
  headerRow.getCell(1).value = "#";
  headerRow.getCell(2).value = "Product";
  headerRow.getCell(3).value = "Unit";
  headerRow.getCell(4).value = "Quantity";
  headerRow.getCell(5).value = "HSN Code";
  headerRow.getCell(6).value = "GST (%)";
  if (priced) {
    headerRow.getCell(7).value = "Unit Price";
    headerRow.getCell(8).value = "Amount";
  }

  const border = {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  for (let c = 1; c <= columnCount; c++) {
    const cell = headerRow.getCell(c);
    cell.border = border;
    cell.alignment = { vertical: "middle" };
  }

  items.forEach((item, index) => {
    const row = sheet.getRow(headerRowNum + 1 + index);
    row.getCell(1).value = index + 1;
    row.getCell(2).value = item.name;
    row.getCell(3).value = item.unit;
    row.getCell(4).value = item.quantity;
    row.getCell(5).value = item.hsnCode || "-";
    row.getCell(6).value = item.gstRate;
    if (priced) {
      row.getCell(7).value = item.unitPrice ?? 0;
      row.getCell(7).numFmt = "#,##0.00";
      row.getCell(8).value = (item.unitPrice ?? 0) * item.quantity;
      row.getCell(8).numFmt = "#,##0.00";
    }
    for (let c = 1; c <= columnCount; c++) {
      row.getCell(c).border = border;
      row.getCell(c).alignment = { vertical: "middle" };
    }
  });

  if (priced && opts?.grandTotal != null) {
    const totalRow = sheet.getRow(headerRowNum + 1 + items.length);
    sheet.mergeCells(totalRow.number, 1, totalRow.number, columnCount - 1);
    totalRow.getCell(1).value = "Total (incl. GST)";
    totalRow.getCell(1).font = { bold: true, size: 11, color: { argb: ACCENT } };
    totalRow.getCell(1).alignment = { horizontal: "right" };
    const amountCell = totalRow.getCell(columnCount);
    amountCell.value = opts.grandTotal;
    amountCell.numFmt = "#,##0.00";
    amountCell.font = { bold: true };
  }

  if (priced) {
    const lineRowNum = headerRowNum + items.length + 3;
    const lineRow = sheet.getRow(lineRowNum);
    lineRow.height = 34;
    const forCell = lineRow.getCell(1);
    forCell.value = `For ${settings.storeName}`;
    forCell.font = { bold: true, size: 10 };
    sheet.mergeCells(lineRowNum, 1, lineRowNum, 3);
    const sigLineCell = lineRow.getCell(6);
    sheet.mergeCells(lineRowNum, 6, lineRowNum, columnCount);
    sigLineCell.border = { bottom: { style: "thin" as const } };
    sigLineCell.alignment = { horizontal: "right", vertical: "bottom" };

    const roleRow = sheet.getRow(lineRowNum + 1);
    sheet.mergeCells(lineRowNum + 1, 6, lineRowNum + 1, columnCount);
    const roleCell = roleRow.getCell(6);
    roleCell.value = "Authorised Signatory";
    roleCell.font = { size: 9, color: { argb: MUTED } };
    roleCell.alignment = { horizontal: "right" };

    const signatoryRow = sheet.getRow(lineRowNum + 2);
    sheet.mergeCells(lineRowNum + 2, 6, lineRowNum + 2, columnCount);
    const signatoryCell = signatoryRow.getCell(6);
    signatoryCell.value = settings.legalName;
    signatoryCell.font = { bold: true, size: 10 };
    signatoryCell.alignment = { horizontal: "right" };
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

export function formatQuoteMoney(value: number | null | undefined): string {
  return formatINR(value);
}
