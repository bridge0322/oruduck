import type { HTMLAttributes } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  elevation?: "none" | "sm" | "md" | "lg";
  tone?: "default" | "fur" | "sunken" | "brand";
  padding?: string;
}

export function Card({ children, elevation = "md", tone = "default", padding = "var(--card-pad)", style, ...rest }: CardProps) {
  const T = ({
    default: { background: "var(--surface-card)", border: "1px solid var(--border)" },
    fur: { background: "var(--surface-fur)", border: "1px solid var(--border)" },
    sunken: { background: "var(--surface-sunken)", border: "1px solid var(--border)" },
    brand: { background: "var(--brand)", border: "1px solid transparent", color: "var(--text-on-fur)" },
  } as const)[tone];
  const SH = ({ none: "none", sm: "var(--shadow-sm)", md: "var(--shadow-md)", lg: "var(--shadow-lg)" } as const)[elevation];
  return <div style={{ borderRadius: "var(--radius-card)", padding, boxShadow: SH, ...T, ...style }} {...rest}>{children}</div>;
}
