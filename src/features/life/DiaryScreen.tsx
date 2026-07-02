import { useMemo, useState } from "react";
import { Card } from "../../design-system/Card";
import { diaryLine, monthSummary } from "./diary";
import type { LifeState, RareKind } from "./lifeState";
import { monthKey, monthOfDay } from "./time";
import type { Record_ } from "../tracker/logic/persistence";

// ひとこと日記帳＋今月のわたしたち＋おもいで図鑑＋ふれあいステータス。

const RARE_META: Record<RareKind, { emoji: string; label: string }> = {
  butterfly: { emoji: "🦋", label: "ちょうちょと かけっこ" },
  star: { emoji: "🌠", label: "ながれぼしに おねがい" },
  twins: { emoji: "🐶", label: "ふたごの おともだち" },
  moon: { emoji: "🌕", label: "まんげつの とおぼえ" },
  rainbow: { emoji: "🌈", label: "にじいろコーギーの ひ" },
};

export interface DiaryScreenProps {
  life: LifeState;
  records: Record_[];
}

export function DiaryScreen({ life, records }: DiaryScreenProps) {
  const allDays = useMemo(() => {
    const list = [...life.history];
    if (life.lastVisitDay === life.today.day) list.push(life.today);
    return list.sort((a, b) => (a.day < b.day ? 1 : -1));
  }, [life]);

  const months = useMemo(() => {
    const set = new Set(allDays.map((d) => monthOfDay(d.day)));
    return Array.from(set).sort().reverse();
  }, [allDays]);

  const [month, setMonth] = useState<string>(months[0] || monthKey());
  const daysInMonth = allDays.filter((d) => monthOfDay(d.day) === month);
  const sum = monthSummary(life, month, records);
  const memories = [...life.memories].reverse();

  const fmtDay = (day: string) => {
    const [, m, d] = day.split("-");
    return `${+m}がつ${+d}にち`;
  };
  const fmtMonth = (mk: string) => {
    const [y, m] = mk.split("-");
    return `${y}ねん ${+m}がつ`;
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, paddingTop: 8 }}>
      {/* ふれあいステータス */}
      <Card tone="fur" elevation="sm" style={{ display: "flex", justifyContent: "space-around", textAlign: "center", padding: "14px 8px" }}>
        {[
          { v: life.petTotal, l: "なでなで貯金", e: "🐾" },
          { v: life.hugTotal, l: "ぎゅ〜", e: "💖" },
          { v: life.treatTotal, l: "おやつ", e: "🦴" },
          { v: life.visitDayCount, l: "あったひ", e: "📅" },
        ].map((s) => (
          <div key={s.l}>
            <div style={{ fontSize: 18 }}>{s.e}</div>
            <div style={{ fontFamily: "var(--font-number)", fontWeight: 900, fontSize: "var(--text-lg)", color: "var(--text-brand)" }}>{s.v}</div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: 10, fontWeight: 700, color: "var(--text-muted)" }}>{s.l}</div>
          </div>
        ))}
      </Card>

      {/* 月の切り替え */}
      {months.length > 1 && (
        <div style={{ display: "flex", gap: 8, overflowX: "auto", padding: "0 2px" }}>
          {months.map((mk) => (
            <button key={mk} type="button" onClick={() => setMonth(mk)}
              style={{ flex: "none", minHeight: 44, padding: "8px 16px", borderRadius: 999, border: "2px solid " + (mk === month ? "var(--brand)" : "var(--border-strong)"), background: mk === month ? "var(--brand-soft)" : "var(--surface-card)", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", color: mk === month ? "var(--text-brand)" : "var(--text-muted)", cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
              {fmtMonth(mk)}
            </button>
          ))}
        </div>
      )}

      {/* 今月のわたしたち（犬の手紙風） */}
      <Card elevation="md" style={{ background: "linear-gradient(#FFFDF5, #FFF6E4)", border: "2px dashed var(--border-strong)", padding: 18 }}>
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-brand)", textAlign: "center" }}>
          🐾 {fmtMonth(month)}の わたしたち 🐾
        </div>
        <div style={{ marginTop: 12, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 2 }}>
          あえたひ：{sum.daysMet}にち<br />
          なでなで：{sum.pets}かい ／ ぎゅ〜：{sum.hugs}かい<br />
          おやつ：{sum.treats}こ<br />
          {sum.assetNote}
        </div>
        <div style={{ marginTop: 10, textAlign: "right", fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>
          あなたの コーギーより 🐕
        </div>
      </Card>

      {/* 日記リスト */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {daysInMonth.length === 0 && (
          <Card elevation="sm" style={{ textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", padding: 20 }}>
            まだ にっきが ないよ。<br />あした また かくね 🐾
          </Card>
        )}
        {daysInMonth.map((d) => (
          <Card key={d.day} elevation="sm" style={{ padding: "12px 16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontFamily: "var(--font-number)", fontWeight: 800, fontSize: "var(--text-xs)", color: "var(--text-brand)", flex: "none" }}>{fmtDay(d.day)}</span>
              {d.rare && <span style={{ fontSize: 13 }}>{RARE_META[d.rare].emoji}</span>}
              {d.settle && <span style={{ fontSize: 13 }}>🎉</span>}
            </div>
            <div style={{ marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.7 }}>
              {diaryLine(d, life)}
            </div>
          </Card>
        ))}
      </div>

      {/* おもいで図鑑 */}
      <Card elevation="sm">
        <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 10 }}>
          ✨ おもいで図鑑
        </div>
        {memories.length === 0 ? (
          <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.7 }}>
            めずらしい できごとが おきると、ここに きろくされるよ。
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {memories.map((m, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
                <span style={{ fontSize: 22 }}>{RARE_META[m.kind].emoji}</span>
                <div style={{ flex: 1, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{RARE_META[m.kind].label}</div>
                <span style={{ fontFamily: "var(--font-number)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{fmtDay(m.day)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
