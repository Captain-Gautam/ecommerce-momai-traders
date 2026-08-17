// Shared pagination geometry for the react-pdf invoice / delivery-challan
// documents. react-pdf 4.x does not split a View (or a table inside one)
// across pages, so the documents must chunk item rows into pages themselves.
// All heights below are anchored to measured renders of the real templates:
//   - header baseline: y of the table header row on page 1 (257 pt)
//   - summary baselines: height of the whole summary block on the last page

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MX = 36;
export const CW = PAGE_W - MX * 2;

export const STRIP_H = 34;
// Top gutter so the strip stays inside the printable area (printers clip ~5 mm
// at the paper edge). Content below the strip shifts down by this amount.
export const STRIP_TOP = 18;
export const TABLE_MARGIN_TOP = 14;
export const BODY_BOTTOM_PAD = 52;
export const CONTENT_BOTTOM = PAGE_H - BODY_BOTTOM_PAD;
export const CONT_TABLE_TOP = STRIP_TOP + STRIP_H + TABLE_MARGIN_TOP;

export const HEADER_BASELINE = 275;
export const SAFETY = 14;

export function estLines(text: string, width: number, fontSize: number): number {
  const avgChar = fontSize * 0.56;
  const charsPerLine = Math.max(1, Math.floor(width / avgChar));
  return Math.max(1, Math.ceil(text.length / charsPerLine));
}

export function splitLines2(addr: string): string[] {
  const parts = addr
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (parts.length <= 2) {
    return parts.length === 0 ? [addr] : [parts.join(", ")];
  }
  let best = 1;
  let bestDiff = Infinity;
  for (let i = 1; i < parts.length; i++) {
    const diff = Math.abs(
      parts.slice(0, i).join(", ").length - parts.slice(i).join(", ").length
    );
    if (diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  return [parts.slice(0, best).join(", "), parts.slice(best).join(", ")];
}

export type HeaderEstimate = {
  sellerName: string;
  gstin?: string | null;
  sellerAddress: string;
  sellerPhone: string;
  sellerEmail: string;
  buyerName: string;
  buyerAddress: string[];
  metaRows?: number;
};

export function estHeaderHeight(opts: HeaderEstimate): number {
  const leftW = CW * 0.6;
  const custW = (CW - 1) / 2;
  const nameLines = estLines(opts.sellerName, leftW - 40, 13);
  const gstinLines = estLines(`GSTIN: ${opts.gstin || "Not Registered"}`, leftW, 8.5);
  const addrLines = splitLines2(opts.sellerAddress).reduce(
    (s, l) => s + estLines(l, leftW, 8),
    0
  );
  const contactLines = estLines(
    `Mobile: ${opts.sellerPhone}  |  Email: ${opts.sellerEmail}`,
    leftW,
    8
  );
  const bNameLines = estLines(opts.buyerName, custW - 16, 10);
  const bAddrLines = opts.buyerAddress.reduce(
    (s, l) => s + estLines(l, custW - 16, 8.5),
    0
  );
  const metaRows = opts.metaRows ?? 2;

  return (
    HEADER_BASELINE +
    (nameLines - 1) * 16 +
    (gstinLines - 1) * 11 +
    (addrLines - 2) * 11 +
    (contactLines - 1) * 11 +
    (bNameLines - 1) * 12 +
    (bAddrLines - 3) * 11 +
    (metaRows - 2) * 29
  );
}

/**
 * Split item rows into page chunks that each fit on one A4 page.
 *
 * The first page carries the company/customer header (its row budget is
 * `CONTENT_BOTTOM - headerHeight - SAFETY`), continuation pages only the
 * table (`CONTENT_BOTTOM - CONT_TABLE_TOP - SAFETY`), and the last page also
 * carries the summary block (`... - summaryHeight - SAFETY`).
 *
 * `rowHeight` must be conservative (over-estimate) so a chunk never overflows;
 * react-pdf will not re-split the table.
 */
export function chunkRowsByHeight<T>(
  rows: T[],
  rowHeight: (row: T) => number,
  headerHeight: number,
  summaryHeight: number
): T[][] {
  const firstBudget = CONTENT_BOTTOM - headerHeight - SAFETY;
  const contBudget = CONTENT_BOTTOM - CONT_TABLE_TOP - SAFETY;
  const lastFirstBudget = CONTENT_BOTTOM - headerHeight - summaryHeight - SAFETY;
  const lastContBudget = CONTENT_BOTTOM - CONT_TABLE_TOP - summaryHeight - SAFETY;

  const heights = rows.map(rowHeight);
  const totalH = heights.reduce((s, h) => s + h, 0);

  // Everything fits on the first page together with the summary.
  if (totalH <= lastFirstBudget) return [rows];

  // Multi-page: the last page must carry the summary AND at least one item,
  // so it gets its own budget (`lastContBudget`). Compute the smallest number
  // of pages that can hold all rows (page 1 = `firstBudget`, continuation =
  // `contBudget`, last = `lastContBudget`), then greedily pack the rows with
  // the correct budget for each page. If the final page ended up empty, move
  // one row back off the previous page so the summary never sits alone.
  let pagesNeeded = 2;
  let capacity = firstBudget + lastContBudget;
  while (capacity < totalH) {
    capacity += contBudget;
    pagesNeeded++;
  }

  const pages: T[][] = [];
  let page: T[] = [];
  let used = 0;

  for (let i = 0; i < rows.length; i++) {
    const h = heights[i];
    const budget =
      pages.length === pagesNeeded - 1
        ? lastContBudget
        : pages.length === 0
          ? firstBudget
          : contBudget;
    if (page.length && used + h > budget) {
      pages.push(page);
      page = [];
      used = 0;
    }
    page.push(rows[i]);
    used += h;
  }
  if (page.length) pages.push(page);

  if (pages.length < pagesNeeded && pages.length > 0) {
    const prev = pages[pages.length - 1];
    if (prev.length >= 2) {
      const moved = prev.pop()!;
      pages.push([moved]);
    }
  }

  return pages;
}
