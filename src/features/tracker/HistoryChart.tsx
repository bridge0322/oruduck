import type { Record_ } from "./logic/persistence";

export interface HistoryChartProps {
  records: Record_[];
}

export function HistoryChart({ records }: HistoryChartProps) {
  const pts = records.map((r) => r.value);
  if (pts.length < 2) return <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-muted)", padding: "12px 0" }}>記録が2件以上たまるとグラフが表示されます。</div>;
  const W = 320, H = 120, min = Math.min(...pts), max = Math.max(...pts), span = max - min || 1;
  const step = W / (pts.length - 1);
  const line = pts.map((p, i) => `${i * step},${H - ((p - min) / span) * (H - 16) - 8}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height={H} preserveAspectRatio="none" style={{ display: "block" }}>
      <defs><linearGradient id="pg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--fur-300)" stopOpacity="0.5" /><stop offset="100%" stopColor="var(--fur-300)" stopOpacity="0" /></linearGradient></defs>
      <polygon points={`0,${H} ${line} ${W},${H}`} fill="url(#pg)" />
      <polyline points={line} fill="none" stroke="var(--brand)" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
