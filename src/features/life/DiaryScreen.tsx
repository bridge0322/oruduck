import { useMemo, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { Card } from "../../design-system/Card";
import { diaryLine, monthSummary } from "./diary";
import { clampBond } from "./lifeState";
import type { LifeState } from "./lifeState";
import { monthKey, monthOfDay, dayKey, tokyoTime } from "./time";
import { feat } from "./features";
import { GoalMap } from "./GoalMap";
import { GrowthAlbum } from "./GrowthAlbum";
import { metaOf } from "./memoryMeta";
import { letterText, prevMonthKey } from "./letters";
import type { Record_ } from "../tracker/logic/persistence";

// ひとこと日記帳＋今月のわたしたち＋おもいで図鑑＋ふれあいステータス
// ＋お散歩マップ＋月1手紙＋交換日記＋トロフィー棚＋成長アルバム。
// 図鑑ラベル（metaOf）は memoryMeta.ts に共有化。

export interface DiaryScreenProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
  records: Record_[];
}

export function DiaryScreen({ life, setLife, records }: DiaryScreenProps) {
  const principal = records.length ? records[records.length - 1].principal : 0;
  const [openLetter, setOpenLetter] = useState<string | null>(null);
  const [replyDraft, setReplyDraft] = useState<Record<string, string>>({});

  // 月1手紙：今月の1日以降、前月分の未開封手紙があるか
  const nowMk = monthKey();
  const canDeliverPrev = tokyoTime().d >= 1;
  const prevMk = prevMonthKey(nowMk);
  const prevHasData = [...life.history, life.today].some((d) => monthOfDay(d.day) === prevMk);
  const newLetterMonth = canDeliverPrev && prevHasData && !(life.lettersOpened || []).includes(prevMk) ? prevMk : null;

  const openTheLetter = (mk: string) => {
    setOpenLetter(mk);
    if (!(life.lettersOpened || []).includes(mk)) setLife((s) => ({ ...s, lettersOpened: [...(s.lettersOpened || []), mk] }));
  };

  const submitReply = (day: string) => {
    const txt = (replyDraft[day] || "").trim();
    if (!txt) return;
    setLife((s) => ({
      ...s,
      diaryReplies: { ...(s.diaryReplies || {}), [day]: txt },
      bond: clampBond(s.bond + 2),
      diaryReplyThanksDay: dayKey(Date.now() + 86400000),
    }));
    setReplyDraft((d) => ({ ...d, [day]: "" }));
  };

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

      {/* 成長アルバム（この子との歩みタイムライン） */}
      <GrowthAlbum life={life} records={records} />

      {/* 目標進捗お散歩マップ */}
      {feat("goalMap") && principal > 0 && (
        <Card elevation="sm">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 8 }}>🗺️ もくひょうへの おさんぽ</div>
          <GoalMap principal={principal} life={life} setLife={setLife} />
        </Card>
      )}

      {/* 月1手紙のポスト */}
      {feat("monthlyLetter") && (newLetterMonth || (life.lettersOpened || []).length > 0) && (
        <Card elevation="sm">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", flex: 1 }}>📮 犬からの てがみ</div>
            {newLetterMonth && (
              <button type="button" onClick={() => openTheLetter(newLetterMonth)}
                style={{ minHeight: 40, padding: "8px 14px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", cursor: "pointer", boxShadow: "var(--shadow-brand)", WebkitTapHighlightColor: "transparent" }}>
                🚩 あたらしい てがみ！
              </button>
            )}
          </div>
          {(life.lettersOpened || []).length > 0 && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}>
              {[...(life.lettersOpened || [])].sort().reverse().map((mk) => (
                <button key={mk} type="button" onClick={() => setOpenLetter(mk)}
                  style={{ minHeight: 36, padding: "6px 12px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", background: "var(--surface-card)", fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--text-body)", cursor: "pointer" }}>
                  ✉️ {fmtMonth(mk)}
                </button>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* トロフィー棚（週間表彰の履歴） */}
      {feat("weeklyAward") && (life.awards || []).length > 0 && (
        <Card elevation="sm">
          <div style={{ fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-base)", color: "var(--text-strong)", marginBottom: 10 }}>🏆 トロフィーだな</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {[...(life.awards || [])].reverse().slice(0, 20).map((aw, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, background: "var(--surface-sunken)", borderRadius: "var(--radius-md)", padding: "8px 12px" }}>
                <span style={{ fontSize: 20 }}>🏅</span>
                <div style={{ flex: 1, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{aw.label}</div>
                <span style={{ fontFamily: "var(--font-number)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{fmtDay(aw.week)}</span>
              </div>
            ))}
          </div>
        </Card>
      )}

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
          あなたの ダックスフンドより 🐕
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
              {d.rare && <span style={{ fontSize: 13 }}>{metaOf(d.rare).emoji}</span>}
              {d.settle && <span style={{ fontSize: 13 }}>🎉</span>}
            </div>
            <div style={{ marginTop: 4, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.7 }}>
              {diaryLine(d, life)}
            </div>
            {/* 交換日記：妻の返信 */}
            {feat("exchangeDiary") && (
              (life.diaryReplies || {})[d.day] ? (
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 13, flex: "none" }}>✏️</span>
                  <div style={{ flex: 1, background: "var(--brand-soft)", borderRadius: "var(--radius-md)", padding: "8px 12px", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", color: "var(--text-body)", lineHeight: 1.6 }}>
                    {(life.diaryReplies || {})[d.day]}
                  </div>
                </div>
              ) : (
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  <input value={replyDraft[d.day] || ""} onChange={(e) => setReplyDraft((s) => ({ ...s, [d.day]: e.target.value }))}
                    placeholder="おへんじを かく…" maxLength={60}
                    style={{ flex: 1, minWidth: 0, padding: "8px 12px", borderRadius: "var(--radius-md)", border: "2px solid var(--border-strong)", fontFamily: "var(--font-body)", fontSize: "var(--text-sm)", background: "var(--surface-card)", outline: "none" }} />
                  <button type="button" onClick={() => submitReply(d.day)} disabled={!(replyDraft[d.day] || "").trim()}
                    style={{ flex: "none", minHeight: 40, padding: "0 14px", borderRadius: "var(--radius-md)", border: "none", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", opacity: (replyDraft[d.day] || "").trim() ? 1 : 0.4, cursor: "pointer", WebkitTapHighlightColor: "transparent" }}>
                    かく
                  </button>
                </div>
              )
            )}
          </Card>
        ))}
      </div>

      {/* 手紙モーダル */}
      {openLetter && (
        <div onClick={() => setOpenLetter(null)} style={{ position: "fixed", inset: 0, zIndex: 75, maxWidth: 480, margin: "0 auto", background: "rgba(60,45,35,0.4)", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: "linear-gradient(#FFFDF5, #FFF3E0)", border: "2px dashed var(--border-strong)", borderRadius: "var(--radius-lg)", padding: 22, maxWidth: 340, width: "100%", boxShadow: "var(--shadow-lg)", animation: "pop-in .3s var(--ease-bounce)" }}>
            <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)", whiteSpace: "pre-wrap", lineHeight: 1.9 }}>
              {letterText(life, openLetter, records)}
            </div>
            <div style={{ marginTop: 14, textAlign: "center" }}>
              <button type="button" onClick={() => setOpenLetter(null)} style={{ minHeight: 44, padding: "10px 24px", borderRadius: 999, border: "none", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: "var(--text-sm)", cursor: "pointer" }}>とじる</button>
            </div>
          </div>
        </div>
      )}

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
                <span style={{ fontSize: 22 }}>{metaOf(m.kind).emoji}</span>
                <div style={{ flex: 1, fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-body)" }}>{metaOf(m.kind).label}</div>
                <span style={{ fontFamily: "var(--font-number)", fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{fmtDay(m.day)}</span>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
