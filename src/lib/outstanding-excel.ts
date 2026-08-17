import { Workbook } from "exceljs";
import { formatDate } from "@/lib/utils";

export type OutstandingExcelRow = {
  company: string;
  contactName: string | null;
  city: string;
  state: string;
  invoiceNumber: string;
  orderNumber: string;
  invoiceDate: Date | null;
  amount: number;
  paidAmount: number;
  balance: number;
  status: string;
};

const COLUMNS = [
  { header: "Company", key: "company", width: 28 },
  { header: "Contact", key: "contactName", width: 18 },
  { header: "City", key: "city", width: 16 },
  { header: "State", key: "state", width: 14 },
  { header: "Invoice No", key: "invoiceNumber", width: 16 },
  { header: "Order No", key: "orderNumber", width: 16 },
  { header: "Invoice Date", key: "invoiceDate", width: 14 },
  { header: "Amount", key: "amount", width: 14 },
  { header: "Paid", key: "paidAmount", width: 14 },
  { header: "Balance", key: "balance", width: 14 },
  { header: "Status", key: "status", width: 16 },
];

const ACCENT = "FF1D4ED8";

export async function buildOutstandingExcel(rows: OutstandingExcelRow[]): Promise<Buffer> {
  const workbook = new Workbook();
  const sheet = workbook.addWorksheet("Outstanding");

  sheet.columns = COLUMNS.map((c) => ({ ...c }));

  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ACCENT } };
  headerRow.height = 22;

  const border = {
    top: { style: "thin" as const },
    left: { style: "thin" as const },
    bottom: { style: "thin" as const },
    right: { style: "thin" as const },
  };

  for (let c = 1; c <= COLUMNS.length; c++) {
    const cell = headerRow.getCell(c);
    cell.border = border;
    cell.alignment = { vertical: "middle" };
  }

  let totalAmount = 0;
  let totalPaid = 0;

  rows.forEach((row, index) => {
    const sheetRow = sheet.getRow(index + 2);
    sheetRow.getCell(1).value = row.company;
    sheetRow.getCell(2).value = row.contactName ?? "-";
    sheetRow.getCell(3).value = row.city;
    sheetRow.getCell(4).value = row.state;
    sheetRow.getCell(5).value = row.invoiceNumber;
    sheetRow.getCell(6).value = row.orderNumber;
    sheetRow.getCell(7).value = row.invoiceDate ? formatDate(row.invoiceDate) : "-";
    sheetRow.getCell(8).value = row.amount;
    sheetRow.getCell(8).numFmt = "#,##0.00";
    sheetRow.getCell(9).value = row.paidAmount;
    sheetRow.getCell(9).numFmt = "#,##0.00";
    sheetRow.getCell(10).value = row.balance;
    sheetRow.getCell(10).numFmt = "#,##0.00";
    sheetRow.getCell(11).value = row.status;
    for (let c = 1; c <= COLUMNS.length; c++) {
      sheetRow.getCell(c).border = border;
      sheetRow.getCell(c).alignment = { vertical: "middle" };
    }
    totalAmount += row.amount;
    totalPaid += row.paidAmount;
  });

  const totalRow = sheet.getRow(rows.length + 2);
  totalRow.getCell(1).value = "Total";
  totalRow.getCell(1).font = { bold: true };
  sheet.mergeCells(totalRow.number, 1, totalRow.number, 7);
  totalRow.getCell(8).value = totalAmount;
  totalRow.getCell(8).numFmt = "#,##0.00";
  totalRow.getCell(8).font = { bold: true };
  totalRow.getCell(9).value = totalPaid;
  totalRow.getCell(9).numFmt = "#,##0.00";
  totalRow.getCell(9).font = { bold: true };
  totalRow.getCell(10).value = totalAmount - totalPaid;
  totalRow.getCell(10).numFmt = "#,##0.00";
  totalRow.getCell(10).font = { bold: true };
  for (let c = 1; c <= COLUMNS.length; c++) {
    totalRow.getCell(c).border = border;
  }

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
