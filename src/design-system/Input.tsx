import type { CSSProperties, InputHTMLAttributes, ReactNode } from "react";

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "size" | "prefix" | "suffix"> {
  label?: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  prefix?: ReactNode;
  suffix?: ReactNode;
  size?: "md" | "lg";
  inputStyle?: CSSProperties;
}

export function Input({ label, hint, error, prefix, suffix, size = "md", style, inputStyle, ...rest }: InputProps) {
  const H = ({ md: 52, lg: 60 } as const)[size], FS = ({ md: "var(--text-md)", lg: "var(--text-lg)" } as const)[size];
  return (
    <div style={style}>
      {label && <label style={{ display: "block", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)", marginBottom: 8 }}>{label}</label>}
      <div style={{ display: "flex", alignItems: "center", gap: 8, height: H, padding: "0 16px", background: "var(--surface-card)", border: `2px solid ${error ? "var(--negative)" : "var(--border-strong)"}`, borderRadius: "var(--radius-md)" }}>
        {prefix && <span style={{ fontFamily: "var(--font-number)", fontWeight: 700, fontSize: FS, color: "var(--text-muted)" }}>{prefix}</span>}
        <input style={{ flex: 1, minWidth: 0, border: "none", outline: "none", background: "transparent", fontFamily: "var(--font-number)", fontWeight: 700, fontSize: FS, color: "var(--text-strong)", ...inputStyle }} {...rest}/>
        {suffix && <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-muted)" }}>{suffix}</span>}
      </div>
      {(hint || error) && <div style={{ marginTop: 6, fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: error ? "var(--negative)" : "var(--text-muted)" }}>{error || hint}</div>}
    </div>
  );
}
