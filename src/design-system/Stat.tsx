import type { HTMLAttributes, ReactNode } from "react";

export interface StatProps extends HTMLAttributes<HTMLDivElement> {
  value: ReactNode;
  prefix?: string;
  unit?: string;
  label?: ReactNode;
  delta?: ReactNode;
  align?: "left" | "center" | "right";
  size?: "sm" | "md" | "lg" | "hero";
  onBrand?: boolean;
}

export function Stat({ value, prefix = "¥", unit: _unit = "円", label, delta, align = "left", size = "lg", onBrand, style, ...rest }: StatProps) {
  const FS = ({ sm: "var(--text-xl)", md: "var(--text-2xl)", lg: "var(--text-3xl)", hero: "var(--text-display)" } as const)[size];
  const muted = onBrand ? "rgba(255,255,255,0.82)" : "var(--text-muted)", strong = onBrand ? "var(--text-on-fur)" : "var(--text-strong)";
  const jc = align === "center" ? "center" : align === "right" ? "flex-end" : "flex-start";
  return (
    <div style={{ textAlign: align, ...style }} {...rest}>
      {label && <div style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "var(--text-sm)", color: muted, marginBottom: 4 }}>{label}</div>}
      <div style={{ display: "flex", alignItems: "baseline", gap: 4, justifyContent: jc, color: strong }}>
        {prefix && <span style={{ fontFamily: "var(--font-number)", fontWeight: 700, fontSize: `calc(${FS} * 0.6)` }}>{prefix}</span>}
        <span style={{ fontFamily: "var(--font-number)", fontWeight: 900, fontSize: FS, lineHeight: 1, letterSpacing: "var(--tracking-tight)", fontVariantNumeric: "tabular-nums" }}>{value}</span>
      </div>
      {delta && <div style={{ marginTop: 6, display: "flex", justifyContent: jc }}>{delta}</div>}
    </div>
  );
}
