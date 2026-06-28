import type { CSSProperties } from "react";

export interface SwitchProps {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  style?: CSSProperties;
}

export function Switch({ checked, onChange, label, style }: SwitchProps) {
  const W = 52, H = 30, knob = 24;
  const ctl = (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange && onChange(!checked)} style={{ position: "relative", width: W, height: H, flex: "none", borderRadius: "var(--radius-pill)", border: "none", cursor: "pointer", background: checked ? "var(--brand)" : "var(--cream-300)", transition: "background var(--dur-base)", padding: 0, ...style }}>
      <span style={{ position: "absolute", top: (H - knob) / 2, left: checked ? W - knob - 3 : 3, width: knob, height: knob, borderRadius: "50%", background: "#fff", boxShadow: "var(--shadow-sm)", transition: "left var(--dur-base) var(--ease-bounce)" }}/>
    </button>
  );
  if (!label) return ctl;
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 12, cursor: "pointer" }}>
      {ctl}<span style={{ fontFamily: "var(--font-body)", fontWeight: 500, fontSize: "var(--text-base)", color: "var(--text-body)" }}>{label}</span>
    </label>
  );
}
