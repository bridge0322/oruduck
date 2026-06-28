import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { Badge } from "../../design-system/Badge";

export interface DailyFeedCardProps {
  canFeed: boolean;
  streak: number;
  onFeed: () => void;
}

// ★ 1日1回の「ごはん」。お金は動かさず、毎日あげに来たくなる習慣づくり用。
export function DailyFeedCard({ canFeed, streak, onFeed }: DailyFeedCardProps) {
  return (
    <Card elevation="sm" style={{ display: "flex", alignItems: "center", gap: 14 }}>
      <div style={{ width: 52, height: 52, flex: "none", borderRadius: "var(--radius-md)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 28 }}>
        {canFeed ? "🍚" : "😴"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>
            {canFeed ? "きょうのごはん" : "ごはん あげたよ"}
          </span>
          {streak > 0 && <Badge tone="brand"><i className="ph-fill ph-fire" style={{ marginRight: 2 }} />れんぞく{streak}日</Badge>}
        </div>
        <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
          {canFeed ? "1日1回 むりょうで あげられるよ 🐾" : "また あした あいに きてね"}
        </div>
      </div>
      <Button variant="primary" size="md" disabled={!canFeed} onClick={onFeed} iconLeft={<i className="ph-fill ph-bone" />}>
        {canFeed ? "あげる" : "またあした"}
      </Button>
    </Card>
  );
}
