import { currentAdmin } from "@/lib/adminAuth";
import * as q from "@/lib/analyticsQueries";

// Spreadsheet programs run text that starts with = + - @ as a formula. Defuse it.
const cell = (v: unknown) => {
  let s = String(v ?? "");
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = (rows: Record<string, unknown>[]) => {
  if (!rows.length) return "No data\n";
  const cols = Object.keys(rows[0]);
  return [cols.join(","), ...rows.map((r) => cols.map((c) => cell(r[c])).join(","))].join("\n") + "\n";
};

export async function GET(req: Request) {
  const user = await currentAdmin();
  if (!user || user.mustChangePassword) return new Response("Log in first.", { status: 401 });
  const url = new URL(req.url);
  const sp = Object.fromEntries(url.searchParams);
  const range = q.parseRange(sp);
  const p = range.current;
  const table = sp.table ?? "pages";
  let rows: Record<string, unknown>[];
  switch (table) {
    case "series": rows = await q.series(p, sp.gran === "week" || sp.gran === "month" ? sp.gran : "day"); break;
    case "pages": rows = await q.topPages(p, 1000); break;
    case "sections": rows = await q.bySection(p); break;
    case "referrers": rows = await q.referrers(p); break;
    case "devices": rows = await q.devices(p); break;
    case "countries": rows = (await q.places(p)).countries; break;
    case "states": rows = (await q.places(p)).states; break;
    case "ranked": rows = await q.rankedPerformance(p); break;
    case "content": rows = (await q.contentViews(p, range.previous)).map(({ line, ...r }) => { void line; return r; }); break;
    default: return new Response("Unknown table.", { status: 400 });
  }
  return new Response(csv(rows), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="dead-air-${table}-${p.fromDate}-to-${p.toDate}.csv"`, "Cache-Control": "no-store" },
  });
}
