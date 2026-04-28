/**
 * Helpers for fetching and parsing equipment tables from the OSRS Wiki.
 *
 * The wiki's MediaWiki API supports CORS via `origin=*`, so we can fetch the
 * fully-rendered HTML of a page directly from the browser, then extract the
 * first `wikitable` and turn it into structured rows + columns.
 */

const WIKI_BASE = 'https://oldschool.runescape.wiki';
const API_URL = `${WIKI_BASE}/api.php`;

export interface ParsedColumn {
  /** Stable column key (group + label, made unique). */
  key: string;
  /** Bottom-most header text, e.g. "Slash". */
  label: string;
  /** Top-level header group, e.g. "Attack bonuses", or null if ungrouped. */
  group: string | null;
  /** True if at least half the rows in this column parse as numbers. */
  numeric: boolean;
}

export interface ParsedRow {
  /** Rendered HTML per column key. */
  html: Record<string, string>;
  /** Plain text per column key. */
  text: Record<string, string>;
  /** Number per column key (NaN if not parseable). */
  num: Record<string, number>;
}

export interface ParsedTable {
  columns: ParsedColumn[];
  rows: ParsedRow[];
  /** Original HTML caption / description text shown above the table, if any. */
  caption: string | null;
}

interface MatrixCell {
  el: HTMLTableCellElement;
  /** First row index this cell occupies. */
  rowStart: number;
  /** First column index this cell occupies. */
  colStart: number;
}

/** Fetch a page's rendered HTML from the OSRS Wiki. */
export async function fetchWikiPageHtml(pageName: string): Promise<string> {
  const params = new URLSearchParams({
    action: 'parse',
    page: pageName,
    prop: 'text',
    format: 'json',
    formatversion: '2',
    redirects: '1',
    origin: '*',
  });
  const res = await fetch(`${API_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`OSRS Wiki API returned ${res.status} ${res.statusText}`);
  }
  const data = (await res.json()) as {
    parse?: { text: string };
    error?: { info: string };
  };
  if (data.error) throw new Error(`OSRS Wiki API error: ${data.error.info}`);
  if (!data.parse?.text) throw new Error('OSRS Wiki API returned no parsed text.');
  return data.parse.text;
}

/** Rewrite relative wiki links/images to absolute URLs. */
function absolutizeUrls(root: HTMLElement): void {
  const fix = (el: Element, attr: string) => {
    const v = el.getAttribute(attr);
    if (!v) return;
    if (v.startsWith('//')) {
      el.setAttribute(attr, `https:${v}`);
    } else if (v.startsWith('/')) {
      el.setAttribute(attr, `${WIKI_BASE}${v}`);
    }
  };
  root.querySelectorAll('a[href]').forEach((a) => {
    fix(a, 'href');
    a.setAttribute('target', '_blank');
    a.setAttribute('rel', 'noreferrer noopener');
  });
  root.querySelectorAll('img[src]').forEach((img) => fix(img, 'src'));
  root.querySelectorAll('img[srcset]').forEach((img) => {
    const srcset = img.getAttribute('srcset');
    if (!srcset) return;
    const fixed = srcset
      .split(',')
      .map((part) => {
        const [url, ...rest] = part.trim().split(/\s+/);
        if (!url) return part;
        if (url.startsWith('//')) return `https:${url} ${rest.join(' ')}`.trim();
        if (url.startsWith('/')) return `${WIKI_BASE}${url} ${rest.join(' ')}`.trim();
        return part;
      })
      .join(', ');
    img.setAttribute('srcset', fixed);
  });
}

/** Parse a numeric value from typical wiki cell text like "+12", "-3", "0", "1,234". */
export function parseWikiNumber(raw: string): number {
  const trimmed = raw.trim();
  if (!trimmed) return Number.NaN;
  // Drop thousands separators, keep sign and decimal.
  const cleaned = trimmed.replace(/,/g, '').replace(/^\+/, '');
  if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return Number.NaN;
  return Number(cleaned);
}

/**
 * Build a 2D matrix of cells by walking each <tr> and honoring rowspan/colspan.
 * Returns the matrix plus a per-row "isHeader" flag (all cells were <th>).
 */
function buildCellMatrix(table: HTMLTableElement): {
  matrix: MatrixCell[][];
  isHeaderRow: boolean[];
} {
  const trs = Array.from(table.querySelectorAll(':scope > tbody > tr, :scope > tr, :scope > thead > tr'));
  const matrix: MatrixCell[][] = [];
  const isHeaderRow: boolean[] = [];
  trs.forEach((tr, r) => {
    if (!matrix[r]) matrix[r] = [];
    let allHeader = true;
    let cellsSeen = 0;
    Array.from(tr.children).forEach((child) => {
      if (!(child instanceof HTMLTableCellElement)) return;
      cellsSeen += 1;
      if (child.tagName !== 'TH') allHeader = false;
      const colspan = Math.max(1, Number(child.getAttribute('colspan') ?? '1') || 1);
      const rowspan = Math.max(1, Number(child.getAttribute('rowspan') ?? '1') || 1);
      let c = 0;
      while (matrix[r][c]) c += 1;
      const cellRecord: MatrixCell = { el: child, rowStart: r, colStart: c };
      for (let dr = 0; dr < rowspan; dr += 1) {
        const rr = r + dr;
        if (!matrix[rr]) matrix[rr] = [];
        for (let dc = 0; dc < colspan; dc += 1) {
          matrix[rr][c + dc] = cellRecord;
        }
      }
    });
    isHeaderRow[r] = cellsSeen > 0 && allHeader;
  });
  return { matrix, isHeaderRow };
}

/** Extract a sortable text representation from cells with images / links. */
function cellSortText(el: HTMLTableCellElement): string {
  // Prefer alt text on the first image (used to distinguish members icons, etc).
  const img = el.querySelector('img[alt]');
  if (img) {
    const alt = img.getAttribute('alt');
    if (alt) return alt;
  }
  return (el.textContent ?? '').trim();
}

/** Pick a unique key for a column derived from its group + label. */
function uniqueKey(taken: Set<string>, base: string): string {
  if (!taken.has(base)) {
    taken.add(base);
    return base;
  }
  let i = 2;
  while (taken.has(`${base} (${i})`)) i += 1;
  const out = `${base} (${i})`;
  taken.add(out);
  return out;
}

/** Parse the first wikitable on the page into structured rows/columns. */
export function parseWikiTable(html: string): ParsedTable {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  absolutizeUrls(doc.body);

  const table = doc.querySelector('table.wikitable');
  if (!(table instanceof HTMLTableElement)) {
    throw new Error('No wikitable found on the page.');
  }

  const { matrix, isHeaderRow } = buildCellMatrix(table);
  if (matrix.length === 0) {
    throw new Error('Table has no rows.');
  }

  // Find contiguous leading header rows.
  let firstDataRow = 0;
  while (firstDataRow < matrix.length && isHeaderRow[firstDataRow]) firstDataRow += 1;
  if (firstDataRow === 0) {
    throw new Error('Table has no header row.');
  }

  const headerRows = matrix.slice(0, firstDataRow);
  const dataRows = matrix.slice(firstDataRow);
  const colCount = Math.max(...headerRows.map((row) => row.length));

  // Build columns: for each column index walk all header rows top->bottom,
  // collecting distinct cell labels. The bottom-most distinct label is the
  // column label; if there's a higher one that differs, treat it as the group.
  const taken = new Set<string>();
  const columns: ParsedColumn[] = [];
  for (let c = 0; c < colCount; c += 1) {
    const labels: string[] = [];
    for (const row of headerRows) {
      const cell = row[c];
      if (!cell) continue;
      const text = (cell.el.textContent ?? '').trim().replace(/\s+/g, ' ');
      if (!text) continue;
      if (labels[labels.length - 1] !== text) labels.push(text);
    }
    const label = labels[labels.length - 1] ?? `Column ${c + 1}`;
    const group = labels.length > 1 ? labels[0] : null;
    const baseKey = group && group !== label ? `${group} - ${label}` : label;
    columns.push({ key: uniqueKey(taken, baseKey), label, group, numeric: false });
  }

  // Build data rows.
  const rows: ParsedRow[] = [];
  const seenCells = new Set<HTMLTableCellElement>();
  for (const row of dataRows) {
    const html: Record<string, string> = {};
    const text: Record<string, string> = {};
    const num: Record<string, number> = {};
    for (let c = 0; c < colCount; c += 1) {
      const cell = row[c];
      const col = columns[c];
      if (!cell || !col) {
        html[col?.key ?? `col_${c}`] = '';
        text[col?.key ?? `col_${c}`] = '';
        num[col?.key ?? `col_${c}`] = Number.NaN;
        continue;
      }
      // Only emit a cell once even if it spans multiple columns/rows.
      if (seenCells.has(cell.el)) {
        html[col.key] = '';
        text[col.key] = '';
        num[col.key] = Number.NaN;
        continue;
      }
      seenCells.add(cell.el);
      html[col.key] = cell.el.innerHTML;
      const t = cellSortText(cell.el);
      text[col.key] = t;
      num[col.key] = parseWikiNumber(t);
    }
    rows.push({ html, text, num });
  }

  // Determine numeric columns: at least half non-empty cells parse as numbers.
  for (const col of columns) {
    let total = 0;
    let numeric = 0;
    for (const r of rows) {
      const t = r.text[col.key] ?? '';
      if (!t) continue;
      total += 1;
      if (Number.isFinite(r.num[col.key])) numeric += 1;
    }
    col.numeric = total > 0 && numeric / total >= 0.5;
  }

  return { columns, rows, caption: null };
}
