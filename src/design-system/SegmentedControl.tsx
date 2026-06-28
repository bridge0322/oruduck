import type { CSSProperties } from "react";

export interface SegmentedOption {
  value: string;
  label: string;
}

export interface SegmentedControlProps {
  options?: (SegmentedOption | string)[];
  value: string;
  onChange?: (value: string) => void;
  size?: "sm" | "md";
  style?: CSSProperties;
}

export function SegmentedControl({ options = [], value, onChange, size = "md", style }: SegmentedControlProps) {
  const idx = Math.max(0, options.findIndex((o) => (typeof o === "string" ? o : o.value) === value));
  const H = ({ sm: 38, md: 46 } as const)[size];
  return (
    <div style={{ position: "relative", display: "grid", gridTemplateColumns: `repeat(${options.length},1fr)`, height: H, padding: 4, background: "var(--surface-sunken)", borderRadius: "var(--radius-pill)", ...style }}>
      <span style={{ position: "absolute", top: 4, bottom: 4, left: `calc(${(100 / options.length) * idx}% + 4px)`, width: `calc(${100 / options.length}% - 8px)`, background: "var(--surface-card)", borderRadius: "var(--radius-pill)", boxShadow: "var(--shadow-sm)", transition: "left var(--dur-base) var(--ease-standard)" }}/>
      {options.map((o) => {
        const v = typeof o === "string" ? o : o.value;
        const l = typeof o === "string" ? o : o.label;
        const a = v === value;
        return (
          <button key={v} type="button" onClick={() => onChange && onChange(v)} style={{ position: "relative", zIndex: 1, border: "none", background: "transparent", cursor: "pointer", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: a ? "var(--text-brand)" : "var(--text-muted)" }}>{l}</button>
        );
      })}
    </div>
  );
}
