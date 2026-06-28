import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { Badge } from "../../design-system/Badge";

export interface DailyFeedCardProps {
  canFeed: boolean;
  streak: number;
  onFeed: () => void;
}

// ★ 1日1回の「ごはん」。お金は動かさず、毎日あげに来たくなる習慣づくり用。
// 横並びだと狭い画面でテキストが潰れるので、上に情報・下に全幅ボタンの2段組み。
export function DailyFeedCard({ canFeed, streak, onFeed }: DailyFeedCardProps) {
  return (
    <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, flex: "none", borderRadius: "var(--radius-md)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          {canFeed ? "🍚" : "😴"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {canFeed ? "きょうのごはん" : "ごはん あげたよ"}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {canFeed ? "1日1回 むりょうで あげられるよ 🐾" : "また あした あいに きてね"}
          </div>
        </div>
        {streak > 0 && (
          <Badge tone="brand" style={{ flex: "none" }}><i className="ph-fill ph-fire" style={{ marginRight: 2 }} />れんぞく{streak}日</Badge>
        )}
      </div>
      <Button variant="primary" size="md" fullWidth disabled={!canFeed} onClick={onFeed} iconLeft={<i className="ph-fill ph-bone" />}>
        {canFeed ? "ごはんをあげる" : "また あした ごはんできるよ"}
      </Button>
    </Card>
  );
}
