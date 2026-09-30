import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import path from "node:path";

export const OG_SIZE = { width: 1200, height: 630 };
export const OG_TYPE = "image/png";

// Placeholder display font (Archivo Black, open licence) until the brand fonts are cleared for web.
let font: Promise<Buffer> | null = null;
const loadFont = () =>
  (font ??= readFile(path.join(process.cwd(), "node_modules/@fontsource/archivo-black/files/archivo-black-latin-400-normal.woff")));

// Tokens mirror globals.css.
const INK = "#121212", BG = "#f8edeb", ACCENT = "#ffd166", MUTED = "#625f59";

const clip = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s);

function Wordmark({ size = 44 }: { size?: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", fontSize: size, textTransform: "uppercase", letterSpacing: -2, lineHeight: 1 }}>
      <span>Dead</span>
      <span style={{ background: ACCENT, marginLeft: 12, padding: "2px 10px" }}>Air</span>
    </div>
  );
}

function Frame({ kicker, children }: { kicker?: string; children: React.ReactNode }) {
  return (
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", background: BG, color: INK, padding: 56, fontFamily: "Archivo", borderBottom: `16px solid ${INK}` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Wordmark />
        {kicker && <div style={{ fontSize: 30, textTransform: "uppercase", letterSpacing: 4, color: MUTED }}>{kicker}</div>}
      </div>
      <div style={{ display: "flex", flex: 1 }}>{children}</div>
    </div>
  );
}

async function render(node: React.ReactNode) {
  return new ImageResponse(node as React.ReactElement, { ...OG_SIZE, fonts: [{ name: "Archivo", data: await loadFont(), style: "normal", weight: 400 }] });
}

export const defaultCard = () =>
  render(
    <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", background: BG, color: INK, padding: 72, fontFamily: "Archivo", borderBottom: `16px solid ${INK}` }}>
      <Wordmark size={210} />
      <div style={{ fontSize: 36, textTransform: "uppercase", letterSpacing: 6, color: MUTED, marginTop: 36 }}>Fill the silence.</div>
    </div>,
  );

export const ratedCard = (d: { artist: string; title: string; take: string; total: number | null; scores: { label: string; v: number | null }[] }) =>
  render(
    <Frame kicker="Rated">
      <div style={{ display: "flex", flex: 1, alignItems: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", width: 400 }}>
          <div style={{ fontSize: 300, lineHeight: 0.85, letterSpacing: -14 }}>{String(d.total ?? "–")}</div>
          <div style={{ fontSize: 30, color: MUTED, marginTop: 12 }}>OUT OF 100</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, paddingLeft: 24 }}>
          <div style={{ fontSize: 54, lineHeight: 1.05 }}>{clip(`${d.artist} – ${d.title}`, 60)}</div>
          <div style={{ fontSize: 34, lineHeight: 1.25, marginTop: 24 }}>{clip(d.take, 120)}</div>
          <div style={{ display: "flex", marginTop: 32, fontSize: 24, color: MUTED }}>
            {d.scores.map((s) => (<div key={s.label} style={{ display: "flex", marginRight: 36 }}>{`${s.label.toUpperCase()} ${s.v ?? "–"}`}</div>))}
          </div>
        </div>
      </div>
    </Frame>,
  );

export const textCard = (d: { kicker: string; title: string; sub?: string; big?: boolean }) =>
  render(
    <Frame kicker={d.kicker}>
      <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", flex: 1 }}>
        <div style={{ fontSize: d.big ? 80 : 84, lineHeight: 1.05, letterSpacing: -2 }}>{clip(d.title, d.big ? 110 : 60)}</div>
        {d.sub && <div style={{ fontSize: 34, lineHeight: 1.25, color: MUTED, marginTop: 28 }}>{clip(d.sub, 130)}</div>}
      </div>
    </Frame>,
  );
