// Voice check. Warnings only. Never blocks. Not run on interviews or press releases.
export type VoiceFlag = { kind: string; text: string; hint: string };

const WORDS = [
  "stunning", "incredible", "captivating", "iconic", "masterpiece", "banger",
  "journey", "tapestry", "landscape", "testament", "delve", "elevate", "showcase",
];

export function voiceCheck(text: string): VoiceFlag[] {
  const flags: VoiceFlag[] = [];
  const t = text ?? "";
  for (const w of WORDS) {
    const re = new RegExp(`\\b${w}\\w*`, "gi");
    for (const m of t.matchAll(re)) flags.push({ kind: "word", text: m[0], hint: "Empty praise or filler. Cut it." });
  }
  if (t.includes("—")) flags.push({ kind: "dash", text: "—", hint: "Em dash. Use a full stop." });
  if (t.includes("!")) flags.push({ kind: "exclaim", text: "!", hint: "Exclamation mark. Cut it." });
  // "raw, honest and real"
  for (const m of t.matchAll(/\b[a-z][\w'-]*, [a-z][\w'-]*,? (?:and|&) [a-z][\w'-]*\b/gi)) {
    flags.push({ kind: "three", text: m[0], hint: "List of three. Pick one." });
  }
  // "It's not X, it's Y"
  for (const m of t.matchAll(/\b(?:it'?s|it is|this is|that'?s|that is) not [^.!?;]{1,60}?[,;] ?(?:it'?s|it is|this is|that'?s|but)\b[^.!?]*/gi)) {
    flags.push({ kind: "notxy", text: m[0], hint: "The \"not X, it's Y\" line. Say Y." });
  }
  for (const s of t.split(/(?<=[.!?])\s+/)) {
    const n = s.trim().split(/\s+/).filter(Boolean).length;
    if (n > 25) flags.push({ kind: "long", text: s.slice(0, 60) + "…", hint: `${n} words. Over 25. Split it.` });
  }
  return flags;
}

export function wordCount(text: string): number {
  return (text ?? "").trim().split(/\s+/).filter(Boolean).length;
}

// A title should read as a full sentence with an opinion in it.
export function looksLikeSentence(title: string): boolean {
  const t = title.trim();
  return t.split(/\s+/).length >= 4 && /[a-z]/i.test(t);
}
