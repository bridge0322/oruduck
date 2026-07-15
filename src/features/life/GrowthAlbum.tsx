import { useMemo, useState } from "react";
import { Card } from "../../design-system/Card";
import { metaOf } from "./memoryMeta";
import { anniversaryLabel } from "./lifeState";
import type { LifeState } from "./lifeState";
import { dayKey, diffDays } from "./time";
import { YEN } from "../tracker/logic/format";
import { ROOM_STAGES, roomLevelFromAmount, endlessStage } from "../tracker/logic/roomStages";
import type { Record_ } from "../tracker/logic/persistence";

export interface GrowthAlbumProps {
  life: LifeState;
  records: Record_[];
}

interface AlbumEvent {
  day: string;   // YYYY-MM-DD
  emoji: string;
  text: string;
}

// 積立額に応じた現在の称号（成長ステージ→生涯ステージ）
function titleOf(principal: number): string {
  const e = endlessStage(principal);
  if (e) return e.title;
  return ROOM_STAGES[roomLevelFromAmount(principal) - 1].name;
}

// 成長アルバム：はじめての記録・ステージの成長・はじめての思い出・表彰・積立記念日を
// ぜんぶ既存データから導出して、この子との歩みを1本の時系列にする。保存領域は増やさない。
export function GrowthAlbum({ life, records }: GrowthAlbumProps) {
  const [showAll, setShowAll] = useState(false);

  const events = useMemo(() => {
    const evs: AlbumEvent[] = [];

    // うちのこになった日＋これまでの記念日（お迎え日から導出）
    if (life.adoptedDay) {
      evs.push({ day: life.adoptedDay, emoji: "🏡", text: "うちのこに なった ひ" });
      const addDays = (day: string, n: number) => {
        const [y, m, d] = day.split("-").map(Number);
        return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
      };
      const passed = diffDays(dayKey(), life.adoptedDay);
      const marks = [7, 30, 100];
      for (let yn = 365; yn <= passed; yn += 365) marks.push(yn);
      for (const n of marks) {
        if (n > passed) continue;
        const day = addDays(life.adoptedDay, n);
        const label = anniversaryLabel(life.adoptedDay, day);
        if (label) evs.push({ day, emoji: "🎂", text: label });
      }
    }

    // はじめての記録＋ステージが変わった日
    if (records.length) {
      evs.push({ day: dayKey(records[0].t), emoji: "🌱", text: `はじめての きろく（¥${YEN(records[0].value)}）` });
      let prev = titleOf(records[0].principal);
      for (let i = 1; i < records.length; i++) {
        const t = titleOf(records[i].principal);
        if (t !== prev) {
          evs.push({ day: dayKey(records[i].t), emoji: "🎈", text: `「${t}」に せいちょう！` });
          prev = t;
        }
      }
    }

    // はじめての思い出（種類ごとに最初の1回）
    const seen = new Set<string>();
    for (const m of life.memories || []) {
      if (seen.has(m.kind)) continue;
      seen.add(m.kind);
      const meta = metaOf(m.kind);
      evs.push({ day: m.day, emoji: meta.emoji, text: `はじめての「${meta.label}」` });
    }

    // 週間表彰
    for (const aw of life.awards || []) {
      evs.push({ day: aw.week, emoji: "🏅", text: aw.label });
    }

    // 積立記念日
    for (const d of [...(life.history || []), life.today]) {
      if (d.settle) evs.push({ day: d.day, emoji: "🎉", text: "つみたて きねんび" });
    }

    // 重複除去→新しい順
    const uniq = new Map<string, AlbumEvent>();
    for (const e of evs) uniq.set(`${e.day}|${e.text}`, e);
    return Array.from(uniq.values()).sort((a, b) => (a.day < b.day ? 1 : a.day > b.day ? -1 : 0));
  }, [life, records]);

  if (!events.length) return null;
  const shown = showAll ? events : events.slice(0, 8);

  const fmt = (day: string) => {
    const [y, m, d] = day.split("-");
    return `${y}.${+m}.${+d}`;
  };

  return (
    <Card elevation="sm">
      <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 4 }}>
        📔 せいちょうアルバム
      </div>
      <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", marginBottom: 12 }}>
        この子と あゆんできた みち
      </div>
      <div style={{ position: "relative", paddingLeft: 18 }}>
        {/* タイムラインの縦線 */}
        <div style={{ position: "absolute", left: 5, top: 6, bottom: 6, width: 2, borderRadius: 2, background: "var(--cream-200)" }} />
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {shown.map((e, i) => (
            <div key={`${e.day}|${e.text}`} style={{ position: "relative", display: "flex", alignItems: "flex-start", gap: 10 }}>
              <div style={{ position: "absolute", left: -18, top: 5, width: 12, height: 12, borderRadius: 999, background: i === 0 ? "var(--brand)" : "var(--cream-200)", border: "2px solid var(--surface-card)", boxShadow: "0 0 0 1px var(--border-strong)" }} />
              <span style={{ fontSize: 18, flex: "none", lineHeight: 1.3 }}>{e.emoji}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.5 }}>{e.text}</div>
                <div style={{ fontFamily: "var(--font-number)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)", marginTop: 1 }}>{fmt(e.day)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      {events.length > 8 && (
        <button type="button" onClick={() => setShowAll((v) => !v)}
          style={{ marginTop: 12, width: "100%", minHeight: 40, borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", background: "var(--surface-card)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: "var(--text-muted)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
          {showAll ? "とじる" : `ぜんぶ 見る（${events.length}）`}
        </button>
      )}
    </Card>
  );
}
