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
  type InvoiceTotals,
} from "./invoice";
import {
  chunkRowsByHeight,
  estHeaderHeight,
  estLines,
  splitLines2,
} from "./pdf-layout";

export type ChallanSeller = {
  legalName: string;
  gstin: string;
  address: string;
  phone: string;
  email: string;
};

export type ChallanBuyer = {
  name: string;
  businessName?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  pincode: string;
};

export type ChallanItem = {
  name: string;
  unit: string;
  quantity: number;
  hsnCode: string | null;
  gstRate?: number | null;
  unitPrice?: number | null;
};

export type ChallanData = {
  challanNumber: string;
  challanDate: string;
  orderNumber: string;
  courierName?: string | null;
  trackingNumber?: string | null;
  seller: ChallanSeller;
  buyer: ChallanBuyer;
  items: ChallanItem[];
  showGst?: boolean;
};

// ---------- Palette (indigo / black) ----------

const INDIGO = "#0C0788";
const INK = "#22262E";
const GRAY = "#6E7078";
const GRAY_LIGHT = "#D9DBE0";
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

// Vertical budgets are derived from measured geometry in pdf-layout.ts.



// Table columns.
// Without GST: # | DESCRIPTION | QTY | UNIT
// With GST:    # | DESCRIPTION | HSN | GST% | QTY | RATE/ITEM | PER | AMOUNT
const DESC_W_BASIC = 399;
const DESC_W_GST = 150;
const COLS_BASIC = [
  { key: "#", w: 24, align: "left" as const },
  { key: "DESCRIPTION", w: DESC_W_BASIC, align: "left" as const },
  { key: "QTY", w: 44, align: "left" as const },
  { key: "UNIT", w: CW - 24 - DESC_W_BASIC - 44, align: "left" as const },
];
const COLS_GST = [
  { key: "#", w: 24, align: "left" as const },
  { key: "DESCRIPTION", w: DESC_W_GST, align: "left" as const },
  { key: "HSN", w: 50, align: "left" as const },
  { key: "GST%", w: 46, align: "left" as const },
  { key: "QTY", w: 44, align: "left" as const },
  { key: "RATE/ITEM", w: 70, align: "right" as const },
  { key: "PER", w: 56, align: "left" as const },
  { key: "AMOUNT", w: CW - 24 - DESC_W_GST - 50 - 46 - 44 - 70 - 56, align: "right" as const },
];

// ---------- Row height estimation (must stay conservative) ----------

function estRowHeight(name: string, showGst: boolean): number {
  const descW = (showGst ? DESC_W_GST : DESC_W_BASIC) - 8;
  const avgChar = 7.5 * 0.56;
  const charsPerLine = Math.max(10, Math.floor(descW / avgChar));
  const lines = Math.max(1, Math.ceil(name.length / charsPerLine));
  return lines * (7.5 + 2.6) + 6;
}

function estChallanHeaderHeight(data: ChallanData): number {
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
    metaRows: data.courierName || data.trackingNumber ? 3 : 2,
  });
}

function estChallanSummaryHeight(data: ChallanData, showGst: boolean): number {
  let h = showGst ? 306 : 225;

  if (showGst) {
    const rates = new Set(
      data.items.map((i) => i.gstRate ?? 0).filter((r) => r > 0)
    ).size;
    h += Math.max(0, rates - 1) * (isIntraState(data.buyer.state) ? 32 : 16);
  }

  const qtyByUnit = new Map<string, number>();
  for (const it of data.items) {
    const u = it.unit || "pcs";
    qtyByUnit.set(u, (qtyByUnit.get(u) ?? 0) + it.quantity);
  }
  const totalQty = [...qtyByUnit.entries()]
    .map(([u, q]) => `${q} ${u}`)
    .join(", ");
  const grand = computeTotals(data).grandTotal;
  const words = `INR ${amountInWords(Math.round(grand))}`;

  h += (estLines(`For ${data.seller.legalName}`, 214, 8.5) - 1) * 12;
  h += (estLines(totalQty, 238, 8) - 1) * 12;
  h += (estLines(words, CW - 266, 8) - 1) * 12;
  h +=
    (estLines(`Order No: ${data.orderNumber || "-"}  |  Challan No: ${data.challanNumber}`, CW - 4, 8) - 1) * 12;
  return h;
}

function chunkRows(rows: ChallanItem[], showGst: boolean, data: ChallanData): Array<ChallanItem[]> {
  return chunkRowsByHeight(
    rows,
    (r) => estRowHeight(r.name, showGst) + 2,
    estChallanHeaderHeight(data),
    estChallanSummaryHeight(data, showGst)
  );
}

// ---------- Reusable bits ----------

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

function MetaCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaCell}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}

function TopStrip() {
  return (
    <View style={styles.strip}>
      <Text style={styles.stripTitle}>DELIVERY CHALLAN</Text>
    </View>
  );
}

// ---------- Header sections ----------

function ChallanMeta({ data }: { data: ChallanData }) {
  const { seller, buyer } = data;
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
          <MetaCell label="CHALLAN #" value={data.challanNumber} />
          <MetaCell label="DATE" value={data.challanDate} />
        </View>
        <View style={styles.metaRow}>
          <MetaCell label="ORDER NO" value={data.orderNumber || "-"} />
          <MetaCell label="PLACE OF DELIVERY" value={buyer.state || "-"} />
        </View>
        {data.courierName || data.trackingNumber ? (
          <View style={styles.metaRow}>
            <MetaCell label="COURIER" value={data.courierName || "-"} />
            <MetaCell label="TRACKING #" value={data.trackingNumber || "-"} />
          </View>
        ) : null}
      </View>
    </View>
  );
}

function CustomerBlock({ data }: { data: ChallanData }) {
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
        <Text style={styles.customerSubLabel}>DELIVERY ADDRESS</Text>
        {addr.map((line, i) => (
          <Text key={i} style={styles.customerAddr}>{line}</Text>
        ))}
      </View>
      <View style={styles.customerCol}>
        <SectionLabel>DELIVERY ADDRESS</SectionLabel>
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
  showGst,
}: {
  rows: ChallanItem[];
  pageRows: ChallanItem[];
  showGst: boolean;
}) {
  const startIndex = rows.indexOf(pageRows[0]);
  const firstOnPage = startIndex >= 0 ? startIndex : 0;
  const cols = showGst ? COLS_GST : COLS_BASIC;
  const amountW = COLS_GST[COLS_GST.length - 1].w;

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>
        {cols.map((c) => (
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
          <Text style={[styles.cell, { width: showGst ? DESC_W_GST : DESC_W_BASIC, paddingLeft: 6 }]}>
            {line.name}
          </Text>
          {showGst ? (
            <>
              <Text style={[styles.cell, { width: 50, paddingLeft: 6 }]}>
                {line.hsnCode || "-"}
              </Text>
              <Text style={[styles.cell, { width: 46, paddingLeft: 6 }]}>
                {line.gstRate ?? 0}%
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
              <Text style={[styles.cell, styles.cellAmount, { width: amountW }]}>
                {formatPdfMoney((line.unitPrice ?? 0) * line.quantity)}
              </Text>
            </>
          ) : (
            <>
              <Text style={[styles.cell, { width: 44, paddingLeft: 6 }]}>
                {line.quantity}
              </Text>
              <Text style={[styles.cell, { width: CW - 24 - DESC_W_BASIC - 44, paddingLeft: 6 }]}>
                {line.unit}
              </Text>
            </>
          )}
        </View>
      ))}
    </View>
  );
}

// ---------- Summary ----------

function fmtRate(n: number): string {
  return String(n);
}

function computeTotals(data: ChallanData): InvoiceTotals {
  return computeInvoiceTotals(
    data.items.map((it) => ({
      name: it.name,
      hsnCode: it.hsnCode,
      quantity: it.quantity,
      unit: it.unit,
      unitPrice: it.unitPrice ?? null,
      gstRate: it.gstRate ?? 0,
    })),
    data.buyer.state
  );
}

function formatSignedMoney(value: number): string {
  const abs = formatPdfMoney(Math.abs(value));
  if (value < 0) return `-${abs}`;
  if (value > 0) return `+${abs}`;
  return "0.00";
}

function GstTotals({ data }: { data: ChallanData }) {
  const totals = computeTotals(data);
  const intraState = isIntraState(data.buyer.state);
  const taxMap = new Map<number, number>();
  for (const line of totals.lines) {
    taxMap.set(line.gstRate, (taxMap.get(line.gstRate) ?? 0) + line.taxAmount);
  }
  const taxLines = [...taxMap.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([rate, tax]) => ({
      rate,
      tax: round2(tax),
      half: round2(tax / 2),
    }));
  const roundedGrand = Math.round(totals.grandTotal);
  const roundOff = round2(roundedGrand - totals.grandTotal);

  return (
    <>
      <View style={styles.totalsBox}>
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
        <View style={styles.grandTotalRow}>
          <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
          <Text style={styles.grandTotalValue}>{formatPdfMoney(roundedGrand)}</Text>
        </View>
      </View>
      <View style={styles.wordsRow}>
        <Text style={styles.wordsLabel}>Amount Chargeable (in words): </Text>
        <Text style={styles.wordsValue}>INR {amountInWords(roundedGrand)}</Text>
      </View>
    </>
  );
}

function ChallanSummary({ data }: { data: ChallanData }) {
  const qtyByUnit = new Map<string, number>();
  for (const it of data.items) {
    const u = it.unit || "pcs";
    qtyByUnit.set(u, (qtyByUnit.get(u) ?? 0) + it.quantity);
  }
  const totalQty = [...qtyByUnit.entries()]
    .map(([u, q]) => `${q} ${u}`)
    .join(", ");

  return (
    <View style={styles.summary}>
      <View style={styles.totalsBox}>
        <View style={styles.taxRow}>
          <Text style={styles.taxLabel}>Total Quantity</Text>
          <Text style={styles.taxValue}>{totalQty}</Text>
        </View>
      </View>

      {data.showGst ? <GstTotals data={data} /> : null}

      <View style={styles.signature}>
        <View style={styles.signBlock}>
          <Text style={styles.signFor}>For {data.seller.legalName}</Text>
          <View style={styles.signSpace} />
          <Text style={styles.signCaption}>Authorised Signatory</Text>
        </View>
      </View>

      <View style={styles.notesRow}>
        <View style={[styles.notesCol, styles.blockBox]}>
          <SectionLabel>NOTES</SectionLabel>
          <Text style={styles.noteText}>
            Please check the items and quantity at the time of delivery. Goods once
            delivered will not be taken back.
          </Text>
        </View>
        <View style={[styles.notesCol, styles.blockBox]}>
          <SectionLabel>TERMS AND CONDITIONS</SectionLabel>
          {[
            "1. This is a computer generated delivery challan.",
            "2. Please check the items at the time of delivery.",
            "3. Any shortage or damage must be reported within 24 hours.",
          ].map((t, i) => (
            <Text key={i} style={styles.termsText}>{t}</Text>
          ))}
        </View>
      </View>

      <View style={styles.referenceRow}>
        <View style={[styles.referenceBlock, styles.blockBox]}>
          <Text style={styles.referenceLabel}>REFERENCE</Text>
          <Text style={styles.referenceValue}>
            Order No: {data.orderNumber || "-"}  |  Challan No: {data.challanNumber}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ---------- Footer ----------

function Footer({ page, total, data }: { page: number; total: number; data: ChallanData }) {
  return (
    <View style={styles.footer}>
      <View style={styles.footerLine} />
      <View style={styles.footerRow}>
        <Text style={styles.footerText}>Page {page} of {total}</Text>
        <Text style={styles.footerText}>
          This is a computer generated delivery challan. {data.seller.legalName} |{" "}
          {data.seller.phone} | {data.seller.email}
        </Text>
      </View>
    </View>
  );
}

// ---------- Document ----------

function ChallanDocument({ data }: { data: ChallanData }) {
  const showGst = Boolean(data.showGst);
  const pages = chunkRows(data.items, showGst, data);
  const totalPages = pages.length;

  return (
    <Document title={`Delivery Challan ${data.challanNumber}`} author={data.seller.legalName}>
      {pages.map((pageRows, i) => {
        const isFirst = i === 0;
        const isLast = i === totalPages - 1;
        return (
          <Page key={i} size="A4" style={styles.page}>
            <View style={styles.body}>
              <TopStrip />
              {isFirst ? (
                <>
                  <ChallanMeta data={data} />
                  <CustomerBlock data={data} />
                </>
              ) : null}
              <ItemsTable rows={data.items} pageRows={pageRows} showGst={showGst} />
              {isLast ? <ChallanSummary data={data} /> : null}
            </View>
            <Footer page={i + 1} total={totalPages} data={data} />
          </Page>
        );
      })}
    </Document>
  );
}

// ---------- Public API ----------

export async function generateChallanPdf(data: ChallanData): Promise<Uint8Array> {
  const blob = await pdf(<ChallanDocument data={data} />).toBlob();
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
  cellAmount: {
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
  taxGroup: {
    marginTop: 2,
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
