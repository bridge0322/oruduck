import { useMemo } from "react";
import { Card } from "../../design-system/Card";
import { dayKey } from "../life/time";
import type { LifeState } from "../life/lifeState";
import type { Record_ } from "./logic/persistence";

export interface PawCalendarProps {
  life: LifeState;
  records: Record_[];
}

const WEEKS = 17; // 約4か月分
const CELL = 13;
const GAP = 3;

// あしあとカレンダー：GitHubの草のように、あそびに来た日（薄色）と評価額を
// 記録した日（濃色）をひと目で見わたす。継続が「面」で見えるので習慣が育つ。
export function PawCalendar({ life, records }: PawCalendarProps) {
  const { grid, monthLabels } = useMemo(() => {
    const met = new Set((life.history || []).map((d) => d.day));
    if (life.lastVisitDay) met.add(life.lastVisitDay);
    const rec = new Set(records.map((r) => dayKey(r.t)));

    // 今日を含む週（日曜はじまり）の土曜を右端に
    const todayStr = dayKey();
    const [ty, tm, td] = todayStr.split("-").map(Number);
    const todayUTC = Date.UTC(ty, tm - 1, td);
    const dow = new Date(todayUTC).getUTCDay();
    const end = todayUTC + (6 - dow) * 86400000; // 今週の土曜
    const start = end - (WEEKS * 7 - 1) * 86400000;

    const grid: { day: string; lv: 0 | 1 | 2; future: boolean }[][] = [];
    const monthLabels: { week: number; label: string }[] = [];
    let prevMonth = -1;
    for (let w = 0; w < WEEKS; w++) {
      const col: { day: string; lv: 0 | 1 | 2; future: boolean }[] = [];
      for (let r = 0; r < 7; r++) {
        const t = start + (w * 7 + r) * 86400000;
        const d = new Date(t);
        const day = d.toISOString().slice(0, 10);
        const lv: 0 | 1 | 2 = rec.has(day) ? 2 : met.has(day) ? 1 : 0;
        col.push({ day, lv, future: t > todayUTC });
        if (r === 0) {
          const mo = d.getUTCMonth() + 1;
          if (mo !== prevMonth) { monthLabels.push({ week: w, label: `${mo}月` }); prevMonth = mo; }
        }
      }
      grid.push(col);
    }
    return { grid, monthLabels };
  }, [life.history, life.lastVisitDay, records]);

  // 3段階の色。あそんだ日は白混ぜのブランド色でハッキリ中間に（brand-softだと空白と見分けにくい）。
  const color = (lv: 0 | 1 | 2, future: boolean) =>
    future ? "transparent" : lv === 2 ? "var(--brand)" : lv === 1 ? "color-mix(in srgb, var(--brand) 42%, #fff)" : "var(--cream-200)";

  return (
    <Card elevation="sm">
      <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 10 }}>
        🐾 あしあとカレンダー
      </div>
      <div style={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <div style={{ width: WEEKS * (CELL + GAP), minWidth: "100%" }}>
          <div style={{ position: "relative", height: 14, marginBottom: 2 }}>
            {monthLabels.map((m) => (
              <span key={m.week} style={{ position: "absolute", left: m.week * (CELL + GAP), fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{m.label}</span>
            ))}
          </div>
          <div style={{ display: "flex", gap: GAP }}>
            {grid.map((col, w) => (
              <div key={w} style={{ display: "flex", flexDirection: "column", gap: GAP }}>
                {col.map((c) => (
                  <div key={c.day} title={c.day} style={{ width: CELL, height: CELL, borderRadius: 3.5, background: color(c.lv, c.future), border: c.future ? "1px dashed var(--cream-200)" : "none" }} />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 10, fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "color-mix(in srgb, var(--brand) 42%, #fff)", display: "inline-block" }} />あそんだ ひ</span>
        <span style={{ display: "inline-flex", alignItems: "center", gap: 4 }}><span style={{ width: 10, height: 10, borderRadius: 3, background: "var(--brand)", display: "inline-block" }} />きろくした ひ</span>
        {life.streak > 1 && <span style={{ marginLeft: "auto", color: "var(--text-brand)" }}>🔥 れんぞく {life.streak}日</span>}
      </div>
    </Card>
  );
}
