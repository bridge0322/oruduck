import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";

export interface RecordNudgeProps {
  days: number;       // 前回記録からの経過日数
  name: string;       // 犬の呼び名（callName 済み）
  onRecord: () => void;
}

// 記録リマインド：しばらく評価額を記録していないと、犬がそっと声をかける。
// サーバー通知は使わず（バックエンド不要）、アプリを開いたときに気づける形にする。
export function RecordNudge({ days, name, onRecord }: RecordNudgeProps) {
  return (
    <Card elevation="sm" tone="fur" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, flex: "none", borderRadius: "var(--radius-md)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>📓</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>
            {days}日 ぶりの きろく
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
            {name}、きょうの すうじ ちょっとだけ 見せてくれる？
          </div>
        </div>
      </div>
      <Button variant="primary" size="md" fullWidth onClick={onRecord} iconLeft={<i className="ph-fill ph-pencil-simple" />}>
        きょうを 記録する
      </Button>
    </Card>
  );
}
