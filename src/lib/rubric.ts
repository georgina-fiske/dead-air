// The Dead Air rubric (draft 3). Total is out of 100. Whole numbers only.
// The total is always computed here. Never typed.
export const RUBRIC_VERSION = 1;

export const CATEGORIES = [
  { key: "bias", name: "Bias", max: 25 },
  { key: "craft", name: "Craft", max: 30 },
  { key: "nerve", name: "Nerve", max: 15 },
  { key: "crowd", name: "Crowd", max: 15 },
  { key: "replay", name: "Replay", max: 15 },
] as const;

export type CategoryKey = (typeof CATEGORIES)[number]["key"];
export type Scores = Partial<Record<CategoryKey, number | null>>;

export function isValidScore(key: CategoryKey, v: unknown): v is number {
  const cat = CATEGORIES.find((c) => c.key === key)!;
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= cat.max;
}

export function computeTotal(s: Scores): number {
  return CATEGORIES.reduce((sum, c) => sum + (s[c.key] ?? 0), 0);
}

// A review can only be published when all five scores are in.
export function canPublish(s: Scores): boolean {
  return CATEGORIES.every((c) => isValidScore(c.key, s[c.key]));
}
