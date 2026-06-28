import { Card } from "../../design-system/Card";
import { Badge } from "../../design-system/Badge";
import { HistoryChart } from "./HistoryChart";
import { YEN } from "./logic/format";
import type { TrackerData } from "./logic/persistence";

export interface HistoryScreenProps {
  data: TrackerData;
}

export function HistoryScreen({ data }: HistoryScreenProps) {
  const recs = [...data.records].reverse();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card elevation="sm">
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 12 }}>評価額の推移</div>
        <HistoryChart records={data.records} />
      </Card>
      <Card elevation="sm">
        <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 8 }}>記録の履歴</div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          {recs.map((r, i) => {
            const gain = r.value - r.principal;
            const rate = r.principal > 0 ? (gain / r.principal) * 100 : 0;
            return (
              <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 0", borderBottom: i === recs.length - 1 ? "none" : "1px solid var(--border)" }}>
                <div>
                  <div style={{ fontFamily: "var(--font-number)", fontWeight: 800, fontSize: "var(--text-md)", color: "var(--text-strong)" }}>¥{YEN(r.value)}</div>
                  <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{new Date(r.t).toLocaleDateString("ja-JP", { year: "numeric", month: "short", day: "numeric" })}・元本 ¥{YEN(r.principal)}</div>
                </div>
                <Badge tone={gain >= 0 ? "positive" : "negative"}>{gain >= 0 ? "+" : "−"}{Math.abs(rate).toFixed(1)}%</Badge>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
