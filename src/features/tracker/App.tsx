import { useEffect, useMemo, useState } from "react";
import { Button } from "../../design-system/Button";
import { BottomNav } from "../../design-system/BottomNav";
import { Card } from "../../design-system/Card";
import { Hero } from "./Hero";
import { BalanceCard } from "./BalanceCard";
import { RecordSheet } from "./RecordSheet";
import { ImportSheet } from "./ImportSheet";
import { HistoryScreen } from "./HistoryScreen";
import { DailyFeedCard } from "./DailyFeedCard";
import { FeastCelebration } from "./FeastCelebration";
import { loadData, saveData } from "./logic/persistence";
import type { TrackerData } from "./logic/persistence";
import { canFeedToday, crashState, feedStreak, peakOf, pickFood, xpInLevel, xpLevel } from "./logic/feast";
import type { Food } from "./logic/feast";
import { roomLevelFromAmount } from "./logic/roomStages";
// ---- 生きているコーギー レイヤー ----
import { CompanionStage } from "../life/CompanionStage";
import type { ValueDelta } from "../life/CompanionStage";
import { beginVisit, callName, loadLife, saveLife } from "../life/lifeState";
import { Onboarding } from "../life/Onboarding";
import { DiaryScreen } from "../life/DiaryScreen";
import { MissionCard } from "../life/MissionCard";
import { AbsenceCard } from "../life/AbsenceCard";
import { RecordNudge } from "./RecordNudge";
import { SettingsScreen } from "../life/SettingsScreen";
import { DebugPanel } from "../life/DebugPanel";
import { isDebug } from "../life/features";
import { dayKey } from "../life/time";

type SheetKind = "record" | "import" | null;

interface FeastFx {
  food: Food;
  gainedXp: number;
}

export function App() {
  const [data, setData] = useState<TrackerData>(loadData);
  // 来訪処理＋前回訪問からの評価額の変化を、初回レンダリング時に一度だけ計算する
  const [init] = useState(() => {
    const loaded = loadLife();
    const firstVisitToday = loaded.lastVisitDay !== dayKey();
    let l = beginVisit(loaded);
    const curVal = data.records.length ? data.records[data.records.length - 1].value : null;
    let delta: ValueDelta | null = null;
    if (curVal != null) {
      if (l.lastSeenValue != null && l.lastSeenValue > 0 && curVal !== l.lastSeenValue) {
        const pct = (curVal - l.lastSeenValue) / l.lastSeenValue;
        delta = { pct, dir: pct > 0.0005 ? "up" : pct < -0.0005 ? "down" : "flat" };
      }
      l = { ...l, lastSeenValue: curVal, today: { ...l.today, market: delta ? delta.dir : l.today.market } };
    }
    return { life: l, delta, firstVisitToday };
  });
  const [life, setLife] = useState(init.life);
  const [tab, setTab] = useState("home");
  const [sheet, setSheet] = useState<SheetKind>(null);
  const [feastFx, setFeastFx] = useState<FeastFx | null>(null);
  const cur = data.records.length ? data.records[data.records.length - 1] : null;
  const peak = peakOf(data.records);
  // 前回の評価額を記録してからの日数。3日以上あいたら、そっと記録をうながす。
  const daysSinceRecord = cur ? Math.floor((Date.now() - cur.t) / 86400000) : 0;
  const showNudge = cur != null && daysSinceRecord >= 3;
  const canFeed = canFeedToday(data.lastFed);
  const streak = feedStreak(data.feasts);

  useEffect(() => { saveData(data); }, [data]);
  useEffect(() => { saveLife(life); }, [life]);

  // アニメーション強度：設定があればそれ、なければ端末の「視差効果を減らす」に従う
  const prm = useMemo(() => typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches, []);
  const animLevel = life.animLevel ?? (prm ? "min" : "full");

  const addRecord = ({ principal, value, units, nav }: { principal: number | null; value: number; units?: number; nav?: number }) => {
    setData((d) => {
      const prev = d.records.length ? d.records[d.records.length - 1] : null;
      const p = principal == null ? (prev ? prev.principal : value) : principal;
      return { ...d, records: [...d.records, { t: Date.now(), principal: p, value, units, nav }] };
    });
    setSheet(null);
  };

  // ★ 1日1回のごはん。お金は動かさず、けいけんちとごはん回数だけ増える。
  const feed = () => {
    if (!canFeedToday(data.lastFed)) return;
    const food = pickFood();
    const now = Date.now();
    setData((d) => ({
      ...d,
      xp: (d.xp || 0) + food.xp,
      lastFed: now,
      feasts: [...(d.feasts || []), { t: now, food: food.name, rank: food.rank, amount: 0 }],
    }));
    setFeastFx({ food, gainedXp: food.xp });
  };

  const lvl = xpLevel(data.xp);
  const roomLv = cur ? roomLevelFromAmount(cur.principal) : 1;
  const crash = cur ? crashState(cur.value, peak) : null;

  const stage = (
    <CompanionStage
      life={life} setLife={setLife}
      level={roomLv}
      crash={crash && crash.level >= 1 ? crash : null}
      valueDelta={init.delta}
      animLevel={animLevel}
      height={300}
      principal={cur ? cur.principal : 0}
      value={cur ? cur.value : 0}
      firstVisitToday={init.firstVisitToday}
    />
  );

  return (
    <div className={life.animLevel == null ? "anim-auto" : undefined} style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", background: "var(--surface-app)", display: "flex", flexDirection: "column" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "calc(12px + env(safe-area-inset-top,0px)) 20px 12px" }}>
        <h1 style={{ margin: 0, fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-2xl)", color: "var(--text-strong)" }}>オルックス</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 5, fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-brand)", fontWeight: 800 }}>
          <i className="ph-fill ph-star" /> おやつLv.{lvl}
        </div>
      </header>

      <main style={{ flex: 1, overflowY: "auto", padding: "0 20px 24px" }}>
        {tab === "home" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {life.pendingAbsence != null && life.pendingAbsence >= 2 && <AbsenceCard life={life} setLife={setLife} />}
            {showNudge && <RecordNudge days={daysSinceRecord} name={callName(life)} onRecord={() => setSheet("record")} />}
            {cur ? (
              <>
                <Hero cur={cur} peak={peak} scene={stage} />
                <MissionCard life={life} setLife={setLife} />
                <DailyFeedCard canFeed={canFeed} streak={streak} onFeed={feed} />
                <BalanceCard cur={cur} />
              </>
            ) : (
              <>
                <Card tone="fur" elevation="md" padding="14px" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  {stage}
                  <div style={{ textAlign: "center", fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", lineHeight: 1.6 }}>
                    まだ記録がありません。<br />「記録する」か「取り込む」で、最初の金額を入力してね 🐾
                  </div>
                </Card>
                <MissionCard life={life} setLife={setLife} />
                <DailyFeedCard canFeed={canFeed} streak={streak} onFeed={feed} />
              </>
            )}
            <Card elevation="sm" style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 40, height: 40, flex: "none", borderRadius: "var(--radius-md)", background: "var(--brand-soft)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>⭐</div>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                  <span style={{ fontFamily: "var(--font-body)", fontWeight: 700, fontSize: "var(--text-sm)", color: "var(--text-strong)" }}>おやつマスター Lv.{lvl}</span>
                  <span style={{ fontFamily: "var(--font-number)", fontWeight: 700, fontSize: "var(--text-xs)", color: "var(--text-muted)" }}>{xpInLevel(data.xp)}/300</span>
                </div>
                <div style={{ height: 10, borderRadius: 999, background: "var(--cream-200)", overflow: "hidden", boxShadow: "var(--shadow-inset)" }}>
                  <div style={{ width: `${(xpInLevel(data.xp) / 300) * 100}%`, height: "100%", borderRadius: 999, background: "var(--brand)" }} />
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "var(--font-number)", fontWeight: 800, fontSize: "var(--text-md)", color: "var(--text-brand)", lineHeight: 1 }}>{data.feasts.length}</div>
                <div style={{ fontFamily: "var(--font-body)", fontSize: 10, color: "var(--text-muted)", fontWeight: 700 }}>ごはん回数</div>
              </div>
            </Card>
            <div style={{ display: "flex", gap: 12 }}>
              <Button variant="primary" size="lg" fullWidth onClick={() => setSheet("record")} iconLeft={<i className="ph-fill ph-pencil-simple" />}>記録する</Button>
              <Button variant="secondary" size="lg" fullWidth onClick={() => setSheet("import")} iconLeft={<i className="ph ph-download-simple" />}>取り込む</Button>
            </div>
            <div style={{ fontFamily: "var(--font-body)", fontSize: "var(--text-xs)", color: "var(--text-muted)", textAlign: "center", lineHeight: 1.6 }}>
              データはこの端末のブラウザ内にのみ保存されます。<br />サーバー送信・ログインはありません。
            </div>
          </div>
        )}
        {tab === "history" && <HistoryScreen data={data} />}
        {tab === "diary" && <DiaryScreen life={life} setLife={setLife} records={data.records} />}
        {tab === "settings" && <SettingsScreen life={life} setLife={setLife} />}
      </main>

      <BottomNav value={tab} onChange={setTab} items={[
        { key: "home", label: "ホーム", icon: "ph ph-house" },
        { key: "history", label: "きろく", icon: "ph ph-chart-line-up" },
        { key: "diary", label: "にっき", icon: "ph ph-book-open-text" },
        { key: "settings", label: "せってい", icon: "ph ph-gear" },
      ]} />

      {sheet === "record" && <RecordSheet cur={cur} onClose={() => setSheet(null)} onSave={addRecord} />}
      {sheet === "import" && <ImportSheet onClose={() => setSheet(null)} onSave={addRecord} />}
      {feastFx && <FeastCelebration {...feastFx} onDone={() => setFeastFx(null)} />}
      {!life.onboarded && <Onboarding onDone={(name, honorific) => setLife((s) => ({ ...s, name, honorific, onboarded: true }))} />}
      {isDebug() && <DebugPanel life={life} setLife={setLife} />}
    </div>
  );
}
