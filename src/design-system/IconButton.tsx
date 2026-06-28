import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "soft" | "solid" | "outline" | "ghost";
  size?: "sm" | "md" | "lg";
  label?: string;
  children?: ReactNode;
}

export function IconButton({ children, variant = "soft", size = "md", label, style, ...rest }: IconButtonProps) {
  const dim = ({ sm: 36, md: 44, lg: 52 } as const)[size];
  const V = ({
    soft: { background: "var(--brand-soft)", color: "var(--text-brand)" },
    solid: { background: "var(--brand)", color: "var(--text-on-fur)", boxShadow: "var(--shadow-brand)" },
    outline: { background: "var(--surface-card)", color: "var(--text-body)", border: "2px solid var(--border-strong)" },
    ghost: { background: "transparent", color: "var(--text-body)" },
  } as const)[variant];
  return (
    <button aria-label={label} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: dim, height: dim, fontSize: dim * 0.46, border: "none", borderRadius: "var(--radius-pill)", cursor: "pointer", WebkitTapHighlightColor: "transparent", ...V, ...style } as CSSProperties} {...rest}>{children}</button>
  );
}
