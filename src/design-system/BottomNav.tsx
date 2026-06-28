import type { CSSProperties } from "react";

export interface BottomNavItem {
  key: string;
  label: string;
  icon: string;
}

export interface BottomNavProps {
  items?: BottomNavItem[];
  value: string;
  onChange?: (key: string) => void;
  style?: CSSProperties;
}

export function BottomNav({ items = [], value, onChange, style }: BottomNavProps) {
  return (
    <nav style={{ display: "grid", gridTemplateColumns: `repeat(${items.length},1fr)`, alignItems: "center", background: "var(--surface-card)", borderTop: "1px solid var(--border)", padding: "8px 8px", boxShadow: "0 -6px 20px rgba(92,68,52,0.06)", ...style }}>
      {items.map((it) => {
        const a = it.key === value;
        return (
          <button key={it.key} type="button" onClick={() => onChange && onChange(it.key)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, border: "none", background: "transparent", cursor: "pointer", padding: "4px 0", color: a ? "var(--text-brand)" : "var(--text-muted)", WebkitTapHighlightColor: "transparent" } as CSSProperties}>
            <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 44, height: 30, borderRadius: "var(--radius-pill)", fontSize: 22, background: a ? "var(--brand-soft)" : "transparent", transition: "background var(--dur-fast)" }}>
              <i className={a ? it.icon.replace(/ph(\s|$)/, "ph-fill$1") : it.icon}/>
            </span>
            <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-xs)" }}>{it.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
