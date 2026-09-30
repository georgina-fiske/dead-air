const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function fmtDate(d: Date | string | null | undefined): string {
  if (!d) return "";
  const x = typeof d === "string" ? new Date(d) : d;
  if (isNaN(x.getTime())) return "";
  return `${x.getUTCDate()} ${MONTHS[x.getUTCMonth()]} ${x.getUTCFullYear()}`;
}

export const TYPE_LABEL: Record<string, string> = { SINGLE: "Single", EP: "EP", ALBUM: "Album", LIVE_ALBUM: "Live album" };

export function paras(text: string): string[] {
  return (text ?? "").split(/\n\s*\n/).filter((p) => p.trim());
}
