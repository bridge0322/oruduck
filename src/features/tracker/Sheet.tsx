import type { ReactNode } from "react";

export interface SheetProps {
  children: ReactNode;
  onClose: () => void;
}

export function Sheet({ children, onClose }: SheetProps) {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", flexDirection: "column", justifyContent: "flex-end", maxWidth: 480, margin: "0 auto" }}>
      <div onClick={onClose} style={{ position: "absolute", inset: 0, background: "rgba(46,33,24,0.4)" }} />
      <div style={{ position: "relative", background: "var(--surface-app)", borderTopLeftRadius: "var(--radius-xl)", borderTopRightRadius: "var(--radius-xl)", padding: "12px 20px calc(24px + env(safe-area-inset-bottom,0px))", animation: "sheet-up var(--dur-base) var(--ease-out)", maxHeight: "88vh", overflowY: "auto" }}>
        <div style={{ width: 40, height: 5, borderRadius: 3, background: "var(--cream-300)", margin: "0 auto 16px" }} />
        {children}
      </div>
    </div>
  );
}
