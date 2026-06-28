import type { HTMLAttributes, ReactNode } from "react";

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: "neutral" | "brand" | "positive" | "negative" | "info";
  icon?: ReactNode;
}

export function Badge({ children, tone = "neutral", icon, style, ...rest }: BadgeProps) {
  const T = ({
    neutral: { background: "var(--surface-sunken)", color: "var(--text-muted)" },
    brand: { background: "var(--brand-soft)", color: "var(--text-brand)" },
    positive: { background: "var(--positive-soft)", color: "var(--leaf-700)" },
    negative: { background: "var(--negative-soft)", color: "var(--coral-700)" },
    info: { background: "var(--info-soft)", color: "var(--sky-500)" },
  } as const)[tone];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-xs)", lineHeight: 1, padding: "5px 10px", borderRadius: "var(--radius-pill)", whiteSpace: "nowrap", ...T, ...style }} {...rest}>{icon}{children}</span>
  );
}
