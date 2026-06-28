import type { CSSProperties, ReactNode } from "react";

export interface ProgressRingProps {
  value?: number;
  size?: number;
  thickness?: number;
  trackColor?: string;
  color?: string;
  children?: ReactNode;
  style?: CSSProperties;
}

export function ProgressRing({ value = 0, size = 200, thickness = 14, trackColor = "var(--cream-200)", color = "var(--brand)", children, style }: ProgressRingProps) {
  const pct = Math.max(0, Math.min(100, value)), r = (size - thickness) / 2, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
  return (
    <div style={{ position: "relative", width: size, height: size, ...style }}>
      <svg width={size} height={size} style={{ display: "block", transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={thickness}/>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={thickness} strokeLinecap="round" strokeDasharray={c} strokeDashoffset={off} style={{ transition: "stroke-dashoffset var(--dur-celebrate) var(--ease-out)" }}/>
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>{children}</div>
    </div>
  );
}
