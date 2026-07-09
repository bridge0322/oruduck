import { useEffect } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card } from "../../design-system/Card";
import { dailyMission, missionCleared, missionCount, callName } from "./lifeState";
import type { LifeState } from "./lifeState";
import { dayKey } from "./time";

export interface MissionCardProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
}

// 「きょうのおねがい」= 犬から毎日ねだる3つのお世話。開く→ねだられる→こたえる→よろこぶ、
// の1日ループを作る。専用の保存領域は持たず、既存の1日カウンタから状態を導出する。
export function MissionCard({ life, setLife }: MissionCardProps) {
  const tasks = dailyMission(life);
  const cleared = missionCleared(life);
  const cnt = missionCount(life);
  const today = dayKey();
  const cheeredToday = life.missionCheeredDay === today;

  // 3つそろった瞬間を一度だけ記録する（達成日を保存）。
  useEffect(() => {
    if (cleared && life.missionCheeredDay !== today) {
      setLife((s) => (missionCleared(s) && s.missionCheeredDay !== today ? { ...s, missionCheeredDay: today } : s));
    }
  }, [cleared, life.missionCheeredDay, today, setLife]);

  const name = callName(life);
  const title = cleared ? "ぜんぶ できたね！" : "きょうの おねがい";
  const sub = cleared
    ? `${name}のおかげで しあわせ！ また あした ねだるね`
    : cnt > 0
      ? `あと ${tasks.length - cnt}こ してくれたら うれしいな`
      : "きょうも あそんでほしいな…！";

  return (
    <Card elevation="sm" style={{ display: "flex", flexDirection: "column", gap: 12, background: cleared ? "var(--brand-soft)" : undefined }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 48, height: 48, flex: "none", borderRadius: "var(--radius-md)", background: cleared ? "var(--brand)" : "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26 }}>
          {cleared ? "🎉" : "🐾"}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {title}
          </div>
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginTop: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
            {sub}
          </div>
        </div>
        <div style={{ flex: "none", fontFamily: "var(--font-number)", fontWeight: 800, fontSize: "var(--text-sm)", color: cleared ? "var(--text-brand)" : "var(--text-muted)" }}>
          {cnt}/{tasks.length}
        </div>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {tasks.map((t) => {
          const ok = t.done >= t.goal;
          return (
            <div key={t.key} style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4,
              padding: "10px 6px", borderRadius: "var(--radius-md)",
              background: ok ? "var(--brand-soft)" : "var(--cream-200)",
              border: ok ? "2px solid var(--brand)" : "2px solid transparent",
              opacity: ok ? 1 : 0.75, transition: "all .2s ease",
            }}>
              <div style={{ fontSize: 22, filter: ok ? "none" : "grayscale(0.6)" }}>{t.emoji}</div>
              <div style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 11, color: "var(--text-strong)" }}>{t.label}</div>
              <div style={{ fontFamily: "var(--font-number)", fontSize: 11, fontWeight: 700, color: ok ? "var(--text-brand)" : "var(--text-muted)" }}>
                {ok ? "✓ できた" : `${t.done}/${t.goal}`}
              </div>
            </div>
          );
        })}
      </div>
      {cleared && cheeredToday && (
        <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-brand)", fontWeight: 800 }}>
          🐕 しっぽ ぶんぶん！ ありがとう！
        </div>
      )}
    </Card>
  );
}
