// Plain SVG charts. One ink colour for this period, a dashed grey line for the previous one.
// Every chart also ships as a table (see <DataTable> in the page), so nothing depends on colour.

function niceMax(v: number) {
  if (v <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  for (const m of [1, 2, 2.5, 5, 10]) if (m * p >= v) return m * p;
  return 10 * p;
}

export function BarChart({ data, previous, label, unit = "views" }: {
  data: { date: string; views: number }[]; previous?: number[] | null; label: string; unit?: string;
}) {
  const W = 720, H = 220, L = 36, R = 8, T = 10, B = 24;
  const max = niceMax(Math.max(1, ...data.map((d) => d.views), ...(previous ?? [0])));
  const pw = (W - L - R) / Math.max(1, data.length);
  const bw = Math.max(1, Math.min(28, pw - 2));
  const y = (v: number) => T + (H - T - B) * (1 - v / max);
  const ticks = [0, max / 2, max];
  const labelAt = new Set([0, Math.floor((data.length - 1) / 2), data.length - 1]);
  return (
    <figure className="chart">
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={label} preserveAspectRatio="none" style={{ width: "100%", height: "auto" }}>
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="var(--soft)" strokeWidth={1} />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">{Math.round(t)}</text>
          </g>
        ))}
        {data.map((d, i) => {
          const h = Math.max(d.views > 0 ? 2 : 0, H - B - y(d.views));
          const x = L + i * pw + (pw - bw) / 2;
          return (
            <g key={d.date}>
              <rect x={L + i * pw} y={T} width={pw} height={H - T - B} fill="transparent"><title>{`${d.date}: ${d.views} ${unit}`}</title></rect>
              <rect x={x} y={H - B - h} width={bw} height={h} rx={2} fill="var(--fg)"><title>{`${d.date}: ${d.views} ${unit}`}</title></rect>
              {labelAt.has(i) && <text x={x + bw / 2} y={H - 6} textAnchor={i === 0 ? "start" : i === data.length - 1 ? "end" : "middle"} fontSize="11" fill="var(--muted)" fontFamily="var(--font-mono)">{d.date.slice(5)}</text>}
            </g>
          );
        })}
        {previous && previous.length > 0 && (
          <polyline fill="none" stroke="var(--muted)" strokeWidth={2} strokeDasharray="5 4"
            points={previous.slice(0, data.length).map((v, i) => `${L + i * pw + pw / 2},${y(v)}`).join(" ")} />
        )}
      </svg>
      <figcaption className="legend">
        <span><i className="sw solid" /> This period</span>
        {previous && <span><i className="sw dash" /> Previous period</span>}
      </figcaption>
    </figure>
  );
}

export function Spark({ values }: { values: number[] }) {
  const W = 110, H = 26, max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${(i / Math.max(1, values.length - 1)) * W},${H - 2 - (v / max) * (H - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <polyline fill="none" stroke="var(--fg)" strokeWidth={2} points={pts} />
    </svg>
  );
}
