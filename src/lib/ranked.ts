import { CATEGORIES, type CategoryKey } from "@/lib/rubric";

export type Scored = {
  slug: string;
  artist: string;
  title: string;
  type: string;
  bias: number; craft: number; nerve: number; crowd: number; replay: number;
  total: number;
};

export type SortKey = "total" | CategoryKey;

// Releases sorted by total. Ties go to the higher Bias score.
// A single-category sort uses that category, then total, then Bias.
export function sortReleases(list: Scored[], key: SortKey = "total"): Scored[] {
  return [...list].sort((a, b) => {
    const d = (key === "total" ? b.total - a.total : b[key] - a[key]);
    if (d) return d;
    if (b.total !== a.total) return b.total - a.total;
    if (b.bias !== a.bias) return b.bias - a.bias;
    return a.artist.localeCompare(b.artist);
  });
}

// Artist ranking is the average total of their scored releases.
// Only artists with 2 or more scored releases appear.
export function rankArtists(list: Scored[]) {
  const map = new Map<string, number[]>();
  for (const r of list) {
    const k = r.artist.trim();
    if (!k) continue;
    map.set(k, [...(map.get(k) ?? []), r.total]);
  }
  return [...map.entries()]
    .filter(([, t]) => t.length >= 2)
    .map(([artist, t]) => ({
      artist,
      count: t.length,
      average: Math.round((t.reduce((a, b) => a + b, 0) / t.length) * 10) / 10,
    }))
    .sort((a, b) => b.average - a.average || b.count - a.count || a.artist.localeCompare(b.artist));
}

export const SORT_KEYS: { key: SortKey; label: string }[] = [
  { key: "total", label: "Total" },
  ...CATEGORIES.map((c) => ({ key: c.key as SortKey, label: c.name })),
];
