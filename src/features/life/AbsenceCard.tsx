import type { Dispatch, SetStateAction } from "react";
import { Card } from "../../design-system/Card";
import { Button } from "../../design-system/Button";
import { absenceDiary, callName } from "./lifeState";
import type { LifeState } from "./lifeState";

export interface AbsenceCardProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
}

// るすばん日記：しばらくぶりの来訪時に、留守中どう過ごしていたかを見せる「おかえり」カード。
// 「離れていた間もこの子は生きていた」感を出し、また会いに来たくなる帰宅ループを作る。
export function AbsenceCard({ life, setLife }: AbsenceCardProps) {
  const days = life.pendingAbsence;
  if (!days || days < 2) return null;
  const name = callName(life);
  const entries = absenceDiary(name, days);
  const dismiss = () => setLife((s) => ({ ...s, pendingAbsence: null }));

  return (
    <Card elevation="md" tone="fur" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, flex: "none", borderRadius: "var(--radius-md)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>🏠</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)" }}>
            おかえり！ {days}日ぶり だね
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2 }}>
            いない あいだ、こんな ふうに まってたよ
          </div>
        </div>
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {entries.map((e, i) => (
          <div key={i} style={{ display: "flex", gap: 8, alignItems: "flex-start", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-strong)", lineHeight: 1.5 }}>
            <span style={{ flex: "none", fontFamily: "var(--font-number)", fontWeight: 800, fontSize: 11, color: "var(--text-brand)", background: "var(--brand-soft)", borderRadius: 999, padding: "2px 7px", marginTop: 1 }}>
              {i + 1}日目
            </span>
            <span>🐾 {e}</span>
          </div>
        ))}
      </div>
      <Button variant="primary" size="md" fullWidth onClick={dismiss} iconLeft={<i className="ph-fill ph-heart" />}>
        ただいま！ ぎゅ〜する
      </Button>
    </Card>
  );
}
