import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "soft" | "ghost";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
}

export function Button({ children, variant = "primary", size = "md", fullWidth, iconLeft, iconRight, disabled, style, ...rest }: ButtonProps) {
  const S = ({ sm: { fontSize: "var(--text-sm)", padding: "8px 16px", minHeight: 36, gap: 6 }, md: { fontSize: "var(--text-base)", padding: "12px 22px", minHeight: 48, gap: 8 }, lg: { fontSize: "var(--text-md)", padding: "16px 28px", minHeight: 56, gap: 10 } } as const)[size];
  const V = ({
    primary: { background: "var(--brand)", color: "var(--text-on-fur)", boxShadow: "var(--shadow-brand)", border: "2px solid transparent" },
    secondary: { background: "var(--surface-card)", color: "var(--text-brand)", boxShadow: "var(--shadow-sm)", border: "2px solid var(--border-strong)" },
    soft: { background: "var(--brand-soft)", color: "var(--text-brand)", border: "2px solid transparent" },
    ghost: { background: "transparent", color: "var(--text-brand)", border: "2px solid transparent" },
  } as const)[variant];
  return (
    <button disabled={disabled} style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: S.gap, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: S.fontSize, padding: S.padding, minHeight: S.minHeight, width: fullWidth ? "100%" : undefined, borderRadius: "var(--radius-pill)", cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.45 : 1, transition: "transform var(--dur-fast) var(--ease-bounce)", WebkitTapHighlightColor: "transparent", ...V, ...style } as CSSProperties}
      onMouseDown={(e) => { if (!disabled) e.currentTarget.style.transform = "scale(0.96)"; }}
      onMouseUp={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      {...rest}
    >{iconLeft}{children}{iconRight}</button>
  );
}
