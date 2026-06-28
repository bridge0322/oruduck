import type { CSSProperties } from "react";
import { Card } from "../../design-system/Card";
import { Stat } from "../../design-system/Stat";
import { Badge } from "../../design-system/Badge";
import { YEN } from "./logic/format";
import type { Record_ } from "./logic/persistence";

export interface BalanceCardProps {
  cur: Record_;
}

const lblS: CSSProperties = { fontSize: "var(--text-xs)", color: "rgba(255,255,255,0.8)", fontWeight: 700, fontFamily: "var(--font-body)" };
const valS: CSSProperties = { fontFamily: "var(--font-number)", fontWeight: 800, fontSize: "var(--text-md)", color: "#fff" };

export function BalanceCard({ cur }: BalanceCardProps) {
  const gain = cur.value - cur.principal;
  const rate = cur.principal > 0 ? (gain / cur.principal) * 100 : 0;
  return (
    <Card tone="brand" elevation="lg">
      <Stat label="オルカン 評価額" value={YEN(cur.value)} size="hero" onBrand
        delta={<Badge tone={gain >= 0 ? "positive" : "negative"} icon={<i className={`ph-bold ${gain >= 0 ? "ph-trend-up" : "ph-trend-down"}`} />}>{gain >= 0 ? "+" : "−"}¥{YEN(Math.abs(gain))} ({gain >= 0 ? "+" : "−"}{Math.abs(rate).toFixed(2)}%)</Badge>} />
      <div style={{ display: "flex", gap: 20, marginTop: 16, paddingTop: 16, borderTop: "1px solid rgba(255,255,255,0.25)" }}>
        <div><div style={lblS}>投資元本</div><div style={valS}>¥{YEN(cur.principal)}</div></div>
        <div><div style={lblS}>評価損益</div><div style={valS}>{gain >= 0 ? "+" : "−"}¥{YEN(Math.abs(gain))}</div></div>
      </div>
    </Card>
  );
}
