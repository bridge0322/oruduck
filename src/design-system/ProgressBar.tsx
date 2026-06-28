import type { CSSProperties, ReactNode } from "react";

export interface ProgressBarProps {
  value?: number;
  height?: number;
  color?: string;
  trackColor?: string;
  label?: ReactNode;
  showValue?: boolean;
  style?: CSSProperties;
}

export function ProgressBar({ value = 0, height = 12, color = "var(--brand)", trackColor = "var(--cream-200)", label, showValue, style }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div style={style}>
      {(label || showValue) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
          {label && <span style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", fontWeight: 500, color: "var(--text-body)" }}>{label}</span>}
          {showValue && <span style={{ fontFamily: "var(--font-number)", fontSize: "var(--text-sm)", fontWeight: 700, color: "var(--text-brand)" }}>{pct}%</span>}
        </div>
      )}
      <div style={{ height, borderRadius: "var(--radius-pill)", background: trackColor, boxShadow: "var(--shadow-inset)", overflow: "hidden" }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "var(--radius-pill)", background: color, transition: "width var(--dur-slow) var(--ease-out)" }}/>
      </div>
    </div>
  );
}
