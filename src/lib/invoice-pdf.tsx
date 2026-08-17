import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
  pdf,
} from "@react-pdf/renderer";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  amountInWords,
  computeInvoiceTotals,
  formatPdfMoney,
  isIntraState,
  type InvoiceData,
  type InvoiceTotals,
} from "./invoice";
import {
  chunkRowsByHeight,
  estHeaderHeight,
  estLines,
  splitLines2,
} from "./pdf-layout";

// ---------- Palette (indigo / black) ----------

const INDIGO = "#0C0788";
const INK = "#22262E";
const GRAY = "#6E7078";
const GRAY_LIGHT = "#D9DBE0";
const BOX = "#F4F4F6";
const WHITE = "#FFFFFF";

// ---------- Page geometry ----------

const PAGE_W = 595.28;
const MX = 36;
const CW = PAGE_W - MX * 2; // 523.28

// ---------- Company logo (from the website's public/logo.png) ----------

let cachedLogo: string | null | undefined;
function getLogoDataUrl(): string | null {
  if (cachedLogo !== undefined) return cachedLogo;
  try {
    const buf = readFileSync(join(process.cwd(), "public", "logo.png"));
    cachedLogo = `data:image/png;base64,${buf.toString("base64")}`;
  } catch {
    cachedLogo = null;
  }
  return cachedLogo;
}

function fmtRate(n: number): string {
  return String(n);
}

function formatSignedMoney(value: number): string {
  const abs = formatPdfMoney(Math.abs(value));
  if (value < 0) return `-${abs}`;
  if (value > 0) return `+${abs}`;
  return "0.00";
}

// Vertical budgets are derived from measured geometry in pdf-layout.ts.

// Table columns: # | DESCRIPTION | HSN | GST% | QTY | RATE/ITEM | PER | AMOUNT
const DESC_W = 150;
const COLS = [
  { key: "#", w: 24, align: "left" as const },
  { key: "DESCRIPTION", w: DESC_W, align: "left" as const },
  { key: "HSN", w: 50, align: "left" as const },
  { key: "GST%", w: 46, align: "left" as const },
  { key: "QTY", w: 44, align: "left" as const },
  { key: "RATE/ITEM", w: 70, align: "right" as const },
  { key: "PER", w: 56, align: "left" as const },
  { key: "AMOUNT", w: CW - 24 - DESC_W - 50 - 46 - 44 - 70 - 56, align: "right" as const },
];

// ---------- Row height estimation (must stay conservative) ----------

function estRowHeight(name: string): number {
  const descW = DESC_W - 8;
  const avgChar = 7.5 * 0.56;
  const charsPerLine = Math.max(10, Math.floor(descW / avgChar));
  const lines = Math.max(1, Math.ceil(name.length / charsPerLine));
  return lines * (7.5 + 2.6) + 6;
}

function estInvoiceHeaderHeight(data: InvoiceData): number {
  const buyerName = data.buyer.businessName
    ? `${data.buyer.businessName} (${data.buyer.name})`
    : data.buyer.name;
  const buyerAddr = [
    data.buyer.line1,
    ...(data.buyer.line2 ? [data.buyer.line2] : []),
    `${data.buyer.city}, ${data.buyer.state} - ${data.buyer.pincode}`,
  ].filter(Boolean);
  return estHeaderHeight({
    sellerName: data.seller.legalName,
    gstin: data.seller.gstin,
    sellerAddress: data.seller.address,
    sellerPhone: data.seller.phone,
    sellerEmail: data.seller.email,
    buyerName,
    buyerAddress: buyerAddr,
  });
}

function estInvoiceSummaryHeight(data: InvoiceData, totals: InvoiceTotals): number {
  const intra = isIntraState(data.buyer.state);
  let h = 341;

  const rates = new Set(totals.lines.map((l) => l.gstRate).filter((r) => r > 0)).size;
  h += Math.max(0, rates - 1) * (intra ? 32 : 16);

  const groups = buildBreakup(totals, intra).length;
  h += Math.max(0, groups - 1) * 16;

  if (data.bank) h += 46;
  if (data.upiId) h += 16;
  if (data.payment && data.payment.paidAmount) h += 14;

  const roundedGrand = Math.round(totals.grandTotal);
  const words = `INR ${amountInWords(roundedGrand)}`;
  const note = `${data.footerNote || "Thank you for your business!"}${
    data.adminNote ? `\n${data.adminNote}` : ""
  }`;

  h += (estLines(`For ${data.seller.legalName}`, 214, 8.5) - 1) * 12;
  h += (estLines(words, CW - 266, 8) - 1) * 12;
  h += (estLines(note, (CW - 4) / 2 - 16, 7.5) - 1) * 11;
  h += (data.customerNote ? 1 : 0) * 11;
  h +=
    (estLines(`Order No: ${data.orderNumber || "-"}  |  Invoice No: ${data.invoiceNumber}`, CW - 4, 8) - 1) * 12;
  return h;
}

function chunkRows(
  rows: Array<InvoiceTotals["lines"][number]>,
  data: InvoiceData,
  totals: InvoiceTotals
): Array<Array<InvoiceTotals["lines"][number]>> {
  return chunkRowsByHeight(
    rows,
    (r) => estRowHeight(r.name) + 2,
    estInvoiceHeaderHeight(data),
    estInvoiceSummaryHeight(data, totals)
  );
}

// ---------- Reusable bits ----------

function SectionLabel({ children }: { children: string }) {
  return (
    <Text style={styles.sectionLabel}>{children}</Text>
  );
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function BankRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.bankRow}>
      <Text style={styles.bankLabel}>{label}</Text>
      <Text style={styles.bankValue}>{value}</Text>
    </View>
  );
}

function TopStrip() {
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTitle}>TAX INVOICE</Text>
      <Text style={styles.stripCopy}>ORIGINAL FOR RECIPIENT</Text>
    </View>
  );
}

// ---------- Header sections ----------

function CompanyMeta({ data }: { data: InvoiceData }) {
  const { seller, buyer, invoiceNumber, invoiceDate, dueDate } = data;
  const logo = getLogoDataUrl();
  const addrLines = splitLines2(seller.address);
  return (
    <View style={styles.companyRow}>
      <View style={styles.companyLeft}>
        <View style={styles.logoRow}>
          {logo ? (
            <Image src={logo} style={styles.logoImg} />
          ) : (
            <View style={styles.logo}>
              <Text style={styles.logoText}>MT</Text>
            </View>
          )}
          <Text style={styles.companyName}>{seller.legalName}</Text>
        </View>
        <Text style={styles.gstin}>GSTIN: {seller.gstin || "Not Registered"}</Text>
        {addrLines.map((line, i) => (
          <Text key={i} style={styles.companyAddress}>{line}</Text>
        ))}
        <Text style={styles.companyContact}>
          Mobile: {seller.phone}  |  Email: {seller.email}
        </Text>
      </View>
      <View style={styles.metaGrid}>
        <View style={styles.metaRow}>
          <MetaCell label="INVOICE #" value={invoiceNumber} />
          <MetaCell label="DATE" value={invoiceDate} />
        </View>
        <View style={styles.metaRow}>
          <MetaCell label="PLACE OF SUPPLY" value={buyer.state || "-"} />
          <MetaCell label="DUE DATE" value={dueDate || invoiceDate} />
        </View>
      </View>
    </View>
  );
}

function CustomerBlock({ data }: { data: InvoiceData }) {
  const b = data.buyer;
  const name = b.businessName ? `${b.businessName} (${b.name})` : b.name;
  const addr = [
    b.line1,
    ...(b.line2 ? [b.line2] : []),
    `${b.city}, ${b.state} - ${b.pincode}`,
  ].filter(Boolean);

  return (
    <View style={styles.customerRow}>
      <View style={[styles.customerCol, styles.customerColDivider]}>
        <SectionLabel>CUSTOMER DETAILS</SectionLabel>
        <Text style={styles.customerName}>{name}</Text>
        <Text style={styles.customerSubLabel}>BILLING ADDRESS</Text>
        {addr.map((line, i) => (
          <Text key={i} style={styles.customerAddr}>{line}</Text>
        ))}
      </View>
      <View style={styles.customerCol}>
        <SectionLabel>SHIPPING ADDRESS</SectionLabel>
        {addr.map((line, i) => (
          <Text key={i} style={styles.customerAddr}>{line}</Text>
        ))}
      </View>
    </View>
  );
}

// ---------- Items table ----------

function ItemsTable({
  rows,
  pageRows,
}: {
  rows: Array<InvoiceTotals["lines"][number]>;
  pageRows: Array<InvoiceTotals["lines"][number]>;
}) {
  const startIndex = rows.indexOf(pageRows[0]);
  const firstOnPage = startIndex >= 0 ? startIndex : 0;

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {COLS.map((c) => (
          <Text
            key={c.key}
            style={[
              styles.tableHeaderCell,
              { width: c.w, textAlign: c.align },
            ]}
          >
            {c.key}
          </Text>
        ))}
      </View>
      {pageRows.map((line, i) => (
        <View key={i} style={styles.tableRow}>
          <Text style={[styles.cell, { width: 24, paddingLeft: 6 }]}>
            {firstOnPage + i + 1}
          </Text>
          <Text style={[styles.cell, styles.cellDesc]}>{line.name}</Text>
          <Text style={[styles.cell, { width: 50, paddingLeft: 6 }]}>
            {line.hsnCode || "-"}
          </Text>
          <Text style={[styles.cell, { width: 46, paddingLeft: 6 }]}>
            {line.gstRate}%
          </Text>
          <Text style={[styles.cell, { width: 44, paddingLeft: 6 }]}>
            {line.quantity}
          </Text>
          <Text style={[styles.cell, { width: 70, textAlign: "right", paddingRight: 4 }]}>
            {formatPdfMoney(line.unitPrice)}
          </Text>
          <Text style={[styles.cell, { width: 56, paddingLeft: 6 }]}>
            {line.unit}
          </Text>
          <Text style={[styles.cell, styles.cellAmount]}>
            {formatPdfMoney(line.taxable)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ---------- Totals / summary (rendered only on the last page) ----------

type BreakupGroup = {
  hsn: string;
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
};

function buildBreakup(totals: InvoiceTotals, intraState: boolean): BreakupGroup[] {
  const map = new Map<string, BreakupGroup>();
  for (const line of totals.lines) {
    const hsn = line.hsnCode || "-";
    const key = `${hsn}|${line.gstRate}`;
    let g = map.get(key);
    if (!g) {
      g = { hsn, rate: line.gstRate, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0 };
      map.set(key, g);
    }
    g.taxable += line.taxable;
    if (intraState) {
      g.cgst += line.taxAmount / 2;
      g.sgst += line.taxAmount / 2;
    } else {
      g.igst += line.taxAmount;
    }
    g.total += line.taxAmount;
  }
  return [...map.values()].map((g) => ({
    ...g,
    taxable: round2(g.taxable),
    cgst: round2(g.cgst),
    sgst: round2(g.sgst),
    igst: round2(g.igst),
    total: round2(g.total),
  }));
}

// Per-GST-rate tax lines for the totals box (CGST/SGST split when intra-state).
function buildTaxLines(totals: InvoiceTotals) {
  const map = new Map<number, { tax: number }>();
  for (const line of totals.lines) {
    const g = map.get(line.gstRate) ?? { tax: 0 };
    g.tax += line.taxAmount;
    map.set(line.gstRate, g);
  }
  return [...map.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, g]) => ({
      rate,
      tax: round2(g.tax),
      half: round2(g.tax / 2),
    }));
}

function BreakupTable({ totals, intraState }: { totals: InvoiceTotals; intraState: boolean }) {
  const groups = buildBreakup(totals, intraState);
  if (!groups.length) return null;

  return (
    <View style={styles.breakup}>
      <View style={styles.breakupHeader}>
        <Text style={[styles.breakupCell, styles.breakupHeadCell, { width: 64 }]}>HSN/SAC</Text>
        <Text style={[styles.breakupCell, styles.breakupHeadCell, { flex: 1 }]}>Taxable Value</Text>
        {intraState ? (
          <>
            <Text style={[styles.breakupCell, styles.breakupHeadCell, styles.breakupRight, { width: 82 }]}>CGST</Text>
            <Text style={[styles.breakupCell, styles.breakupHeadCell, styles.breakupRight, { width: 82 }]}>SGST</Text>
          </>
        ) : (
          <Text style={[styles.breakupCell, styles.breakupHeadCell, styles.breakupRight, { width: 82 }]}>IGST</Text>
        )}
        <Text style={[styles.breakupCell, styles.breakupHeadCell, styles.breakupRight, { flex: 1 }]}>Total Tax</Text>
      </View>
      {groups.map((g, i) => (
        <View key={i} style={styles.breakupRow}>
          <Text style={[styles.breakupCell, { width: 64, paddingLeft: 6 }]}>{g.hsn}</Text>
          <Text style={[styles.breakupCell, { flex: 1, paddingLeft: 6 }]}>{formatPdfMoney(g.taxable)}</Text>
          {intraState ? (
            <>
              <Text style={[styles.breakupCell, styles.breakupRight, { width: 82 }]}>{formatPdfMoney(g.cgst)}</Text>
              <Text style={[styles.breakupCell, styles.breakupRight, { width: 82 }]}>{formatPdfMoney(g.sgst)}</Text>
            </>
          ) : (
            <Text style={[styles.breakupCell, styles.breakupRight, { width: 82 }]}>{formatPdfMoney(g.igst)}</Text>
          )}
          <Text style={[styles.breakupCell, styles.breakupRight, { flex: 1 }]}>{formatPdfMoney(g.total)}</Text>
        </View>
      ))}
    </View>
  );
}

function Summary({
  data,
  totals,
}: {
  data: InvoiceData;
  totals: InvoiceTotals;
}) {
  const intraState = isIntraState(data.buyer.state);
  const taxLines = buildTaxLines(totals);
  const roundedGrand = Math.round(totals.grandTotal);
  const roundOff = round2(roundedGrand - totals.grandTotal);

  return (
    <View style={styles.summary}>
      <View style={styles.totalsBox}>
        <View style={styles.taxRows}>
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Taxable Amount</Text>
            <Text style={styles.taxValue}>{formatPdfMoney(totals.subtotal)}</Text>
          </View>
          {taxLines.map((g) =>
            intraState ? (
              <View key={g.rate} style={styles.taxGroup}>
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>CGST {fmtRate(g.rate / 2)}%</Text>
                  <Text style={styles.taxValue}>{formatPdfMoney(g.half)}</Text>
                </View>
                <View style={styles.taxRow}>
                  <Text style={styles.taxLabel}>SGST {fmtRate(g.rate / 2)}%</Text>
                  <Text style={styles.taxValue}>{formatPdfMoney(g.half)}</Text>
                </View>
              </View>
            ) : (
              <View key={g.rate} style={styles.taxRow}>
                <Text style={styles.taxLabel}>IGST {fmtRate(g.rate)}%</Text>
                <Text style={styles.taxValue}>{formatPdfMoney(g.tax)}</Text>
              </View>
            )
          )}
          <View style={styles.taxRow}>
            <Text style={styles.taxLabel}>Round Off</Text>
            <Text style={styles.taxValue}>{formatSignedMoney(roundOff)}</Text>
          </View>
        </View>

        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
          <Text style={styles.grandTotalValue}>{formatPdfMoney(roundedGrand)}</Text>
        </View>
      </View>

      <View style={styles.wordsRow}>
        <Text style={styles.wordsLabel}>Amount Chargeable (in words): </Text>
        <Text style={styles.wordsValue}>INR {amountInWords(roundedGrand)}</Text>
      </View>

      <BreakupTable totals={totals} intraState={intraState} />

      <View style={styles.bankPaymentRow}>
        <View style={styles.bankBox}>
          <SectionLabel>BANK DETAILS</SectionLabel>
          {data.bank ? (
            <>
              <BankRow label="Bank" value={data.bank.bankName} />
              <BankRow label="Account #" value={data.bank.accountNumber} />
              <BankRow label="IFSC" value={data.bank.ifsc} />
              <BankRow label="Branch" value={data.bank.branch} />
            </>
          ) : (
            <Text style={styles.bankValue}>-</Text>
          )}
          {data.upiId ? <BankRow label="UPI ID" value={data.upiId} /> : null}
        </View>
        <View style={styles.payStack}>
          {data.payment && data.payment.paidAmount ? (
            <Text style={styles.paidLine}>
              <Text style={styles.paidLabel}>Amount Paid: </Text>
              {formatPdfMoney(data.payment.paidAmount)} via {data.payment.method}
            </Text>
          ) : null}
          <View style={styles.signature}>
            <View style={styles.signBlock}>
              <Text style={styles.signFor}>For {data.seller.legalName}</Text>
              <View style={styles.signSpace} />
              <Text style={styles.signCaption}>Authorised Signatory</Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.notesRow}>
        <View style={[styles.notesCol, styles.blockBox]}>
          <SectionLabel>NOTES</SectionLabel>
          <Text style={styles.noteText}>
            {data.footerNote || "Thank you for your business!"}
            {data.adminNote ? `\n${data.adminNote}` : ""}
          </Text>
        </View>
        <View style={[styles.notesCol, styles.blockBox]}>
          <SectionLabel>TERMS AND CONDITIONS</SectionLabel>
          {[
            "1. Goods once sold will not be taken back.",
            "2. Delivery timelines are indicative and subject to stock availability.",
            "3. Please check the items at the time of delivery.",
            ...(data.customerNote ? [`Note: ${data.customerNote}`] : []),
          ].map((t, i) => (
            <Text key={i} style={styles.termsText}>{t}</Text>
          ))}
        </View>
      </View>

      <View style={styles.referenceRow}>
        <View style={[styles.referenceBlock, styles.blockBox]}>
          <Text style={styles.referenceLabel}>REFERENCE</Text>
          <Text style={styles.referenceValue}>
            Order No: {data.orderNumber || "-"}  |  Invoice No: {data.invoiceNumber}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------- Footer ----------

function Footer({ page, total, data }: { page: number; total: number; data: InvoiceData }) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLine} />
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Page {page} of {total}</Text>
        <Text style={styles.footerText}>
          This is a computer generated invoice. {data.seller.legalName} | {data.seller.phone} |{" "}
          {data.seller.email}
        </Text>
      </View>
    </View>
  );
}

// ---------- Document ----------

function InvoiceDocument({ data }: { data: InvoiceData }) {
  const totals = computeInvoiceTotals(data.items, data.buyer.state);
  const pages = chunkRows(totals.lines, data, totals);
  const totalPages = pages.length;

  return (
    <Document title={`Invoice ${data.invoiceNumber}`} author={data.seller.legalName}>
      {pages.map((pageRows, i) => {
        const isFirst = i === 0;
        const isLast = i === totalPages - 1;
        return (
          <Page key={i} size="A4" style={styles.page}>
            <View style={styles.body}>
              <TopStrip />
              {isFirst ? (
                <>
                  <CompanyMeta data={data} />
                  <CustomerBlock data={data} />
                </>
              ) : null}
              <ItemsTable rows={totals.lines} pageRows={pageRows} />
              {isLast ? <Summary data={data} totals={totals} /> : null}
            </View>
            <Footer page={i + 1} total={totalPages} data={data} />
          </Page>
        );
      })}
    </Document>
  );
}

// ---------- Public API ----------

export async function generateInvoicePdf(data: InvoiceData): Promise<Uint8Array> {
  const blob = await pdf(<InvoiceDocument data={data} />).toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

// ---------- Styles ----------

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    backgroundColor: WHITE,
  },
  body: {
    paddingHorizontal: MX,
    paddingTop: 0,
    paddingBottom: 52,
  },

  strip: {
    height: 34,
    marginTop: 18,
    backgroundColor: INDIGO,
    justifyContent: "center",
  },
  stripTitle: {
    position: "absolute",
    left: 0,
    right: 0,
    textAlign: "center",
    color: WHITE,
    fontSize: 15,
    fontWeight: 700,
    letterSpacing: 1,
  },
  stripCopy: {
    position: "absolute",
    right: 8,
    textAlign: "right",
    color: WHITE,
    fontSize: 7,
  },

  companyRow: {
    flexDirection: "row",
    marginTop: 14,
  },
  companyLeft: {
    width: "60%",
  },
  logoRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 32,
    height: 32,
    backgroundColor: INDIGO,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  logoImg: {
    width: 32,
    height: 32,
    objectFit: "contain",
    marginRight: 8,
  },
  logoText: {
    color: WHITE,
    fontWeight: 700,
    fontSize: 9,
  },
  companyName: {
    fontSize: 13,
    fontWeight: 700,
    color: INK,
    flex: 1,
    textAlign: "justify",
  },
  gstin: {
    fontSize: 8.5,
    fontWeight: 700,
    color: INK,
    marginTop: 5,
  },
  companyAddress: {
    fontSize: 8,
    color: INK,
    marginTop: 2,
    textAlign: "justify",
  },
  companyContact: {
    fontSize: 8,
    color: INK,
    marginTop: 3,
  },

  metaGrid: {
    width: "40%",
    marginLeft: 12,
  },
  metaRow: {
    flexDirection: "row",
  },
  metaCell: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
    paddingHorizontal: 6,
    paddingVertical: 5,
  },
  metaLabel: {
    fontSize: 5.5,
    color: GRAY,
    letterSpacing: 0.4,
  },
  metaValue: {
    fontSize: 9,
    fontWeight: 700,
    color: INK,
    marginTop: 2,
  },

  customerRow: {
    flexDirection: "row",
    marginTop: 14,
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
  },
  customerCol: {
    flex: 1,
    padding: 8,
    borderRightWidth: 0,
  },
  customerColDivider: {
    borderRightWidth: 0.8,
    borderRightColor: GRAY_LIGHT,
  },
  customerName: {
    fontSize: 10,
    fontWeight: 700,
    color: INK,
    marginTop: 2,
  },
  customerSubLabel: {
    fontSize: 7,
    fontWeight: 700,
    color: GRAY,
    marginTop: 6,
  },
  customerAddr: {
    fontSize: 8.5,
    color: INK,
    marginTop: 2,
  },

  sectionLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: INDIGO,
    letterSpacing: 0.6,
  },

  table: {
    marginTop: 14,
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: INDIGO,
    alignItems: "center",
    minHeight: 20,
  },
  tableHeaderCell: {
    color: WHITE,
    fontSize: 7.5,
    fontWeight: 700,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 0.6,
    borderBottomColor: GRAY_LIGHT,
    paddingVertical: 3,
  },
  cell: {
    fontSize: 7.5,
    color: INK,
  },
  cellDesc: {
    width: DESC_W,
    paddingLeft: 6,
  },
  cellAmount: {
    width: CW - 24 - DESC_W - 50 - 46 - 44 - 70 - 56,
    fontWeight: 700,
    textAlign: "right",
    paddingRight: 4,
  },

  summary: {
    marginTop: 6,
  },
  totalsBox: {
    width: 250,
    alignSelf: "flex-end",
  },
  grandTotalRow: {
    flexDirection: "row",
    alignItems: "baseline",
    borderTopWidth: 1.2,
    borderTopColor: INDIGO,
    paddingTop: 5,
    marginTop: 2,
  },
  grandTotalLabel: {
    fontSize: 9,
    fontWeight: 700,
    color: INK,
  },
  grandTotalValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 10,
    fontWeight: 700,
    color: INDIGO,
  },
  taxRows: {
    marginTop: 0,
  },
  taxGroup: {
    marginTop: 2,
  },
  taxRow: {
    flexDirection: "row",
    paddingVertical: 2,
  },
  taxLabel: {
    fontSize: 8,
    color: INK,
  },
  taxValue: {
    flex: 1,
    textAlign: "right",
    fontSize: 8,
    fontWeight: 700,
    color: INK,
  },
  wordsRow: {
    flexDirection: "row",
    marginTop: 6,
  },
  wordsLabel: {
    fontSize: 8,
    fontWeight: 700,
    color: INK,
  },
  wordsValue: {
    fontSize: 8,
    color: INK,
  },

  breakup: {
    marginTop: 8,
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
  },
  breakupHeader: {
    flexDirection: "row",
    backgroundColor: BOX,
  },
  breakupRow: {
    flexDirection: "row",
    borderTopWidth: 0.5,
    borderTopColor: GRAY_LIGHT,
  },
  breakupCell: {
    fontSize: 7,
    color: INK,
    paddingVertical: 3,
  },
  breakupHeadCell: {
    fontWeight: 700,
    paddingLeft: 6,
  },
  breakupRight: {
    textAlign: "right",
    paddingRight: 6,
  },

  bankPaymentRow: {
    flexDirection: "row",
    marginTop: 10,
  },
  bankBox: {
    flex: 1,
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
    padding: 8,
  },
  bankRow: {
    flexDirection: "row",
    marginTop: 3,
  },
  bankLabel: {
    width: 60,
    fontSize: 7.5,
    fontWeight: 700,
    color: INK,
  },
  bankValue: {
    flex: 1,
    fontSize: 7.5,
    color: INK,
  },
  payStack: {
    flex: 1,
    marginLeft: 10,
  },
  paidLine: {
    fontSize: 8,
    color: INK,
  },
  paidLabel: {
    fontWeight: 700,
    color: INK,
  },
  signature: {
    marginTop: 8,
    alignSelf: "flex-end",
  },
  signFor: {
    fontSize: 8.5,
    fontWeight: 700,
    color: INK,
    textAlign: "right",
  },
  signBlock: {
    width: 230,
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
    paddingHorizontal: 8,
    paddingVertical: 6,
    alignItems: "flex-end",
  },
  signSpace: {
    height: 52,
  },
  signCaption: {
    fontSize: 7.5,
    color: GRAY,
    textAlign: "right",
  },

  notesRow: {
    flexDirection: "row",
    marginTop: 16,
  },
  notesCol: {
    flex: 1,
    marginHorizontal: 2,
  },
  blockBox: {
    borderWidth: 0.8,
    borderColor: GRAY_LIGHT,
    padding: 8,
  },
  noteText: {
    fontSize: 7.5,
    color: INK,
    marginTop: 3,
  },
  termsText: {
    fontSize: 7.5,
    color: INK,
    marginTop: 2,
  },

  referenceRow: {
    marginTop: 10,
  },
  referenceBlock: {
    marginHorizontal: 2,
  },
  referenceLabel: {
    fontSize: 7.5,
    fontWeight: 700,
    color: INDIGO,
    letterSpacing: 0.6,
  },
  referenceValue: {
    fontSize: 8,
    color: INK,
    marginTop: 3,
  },

  footer: {
    position: "absolute",
    left: MX,
    right: MX,
    bottom: 30,
  },
  footerLine: {
    height: 1,
    backgroundColor: GRAY_LIGHT,
    marginBottom: 4,
  },
  footerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 6.5,
    color: GRAY,
  },
});

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}
