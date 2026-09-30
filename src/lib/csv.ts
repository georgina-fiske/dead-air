// Release CSV: artist, title, type, date, label. Header row optional. Extra columns ignored.
export type CsvRow = { line: number; artist: string; title: string; type: string; date: string; label: string; error?: string };

export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [], cell = "", q = false;
  const src = text.replace(/^﻿/, "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (q) {
      if (c === '"') { if (src[i + 1] === '"') { cell += '"'; i++; } else q = false; }
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ",") { row.push(cell); cell = ""; }
    else if (c === "\n" || c === "\r") {
      if (c === "\r" && src[i + 1] === "\n") i++;
      row.push(cell); cell = "";
      if (row.some((x) => x.trim() !== "")) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== "")) rows.push(row);
  return rows;
}

const TYPES: Record<string, string> = { single: "SINGLE", ep: "EP", album: "ALBUM", lp: "ALBUM", "live album": "LIVE_ALBUM", live: "LIVE_ALBUM" };

// Accepts 2026-10-16 or 16/10/2026 (Australian day first).
export function normDate(s: string): string | null {
  const t = s.trim();
  if (!t) return "";
  let m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(t);
  let y: number, mo: number, d: number;
  if (m) { y = +m[1]; mo = +m[2]; d = +m[3]; }
  else if ((m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(t))) { d = +m[1]; mo = +m[2]; y = +m[3]; }
  else return null;
  const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  return dt.toISOString().slice(0, 10);
}

export function readReleases(text: string): CsvRow[] {
  const rows = parseCsv(text);
  const isHeader = rows[0] && /artist/i.test(rows[0][0] ?? "") && /title/i.test(rows[0][1] ?? "");
  const body = isHeader ? rows.slice(1) : rows;
  return body.map((r, i) => {
    const line = i + 1 + (isHeader ? 1 : 0);
    const artist = (r[0] ?? "").trim(), title = (r[1] ?? "").trim();
    const type = TYPES[(r[2] ?? "").trim().toLowerCase()] ?? "";
    const date = normDate(r[3] ?? "");
    const label = (r[4] ?? "").trim();
    let error: string | undefined;
    if (!artist || !title) error = "Artist and title are needed.";
    else if (!type) error = `Type "${(r[2] ?? "").trim()}" is not Single, EP, Album or Live album.`;
    else if (date === null) error = `Date "${(r[3] ?? "").trim()}" is not YYYY-MM-DD or DD/MM/YYYY.`;
    return { line, artist, title, type, date: date ?? "", label, error };
  });
}
