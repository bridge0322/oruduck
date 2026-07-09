import { useEffect, useMemo, useRef, useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import { LifeCorgi } from "./LifeCorgi";
import type { Accessory, EyeState, MouthState, Pose } from "./LifeCorgi";
import { applyHug, applyPet, applyTreat, bondLevel, clampBond, DEFAULT_HOUSE_THRESHOLDS, jackpotKind, markPlayed, SLEEP_STYLES, treatsLeft, TREATS_PER_DAY } from "./lifeState";
import { JackpotSlot } from "./JackpotSlot";
import type { LifeState, MemoryKind, RareKind } from "./lifeState";
import { markUsed as markUsedOld, pickLine as pickLineOld } from "./dialogueEngine";
import { affectionLvOf, fillVars, hasV2Category, markUsedV2, pickTomorrowFollowup, pickV2 } from "./dialogueEngineV2";
import type { DialogueContext } from "./dialogueEngineV2";
import { feat } from "./features";
import { outfitOf } from "./dressup";
import { ClosetSheet } from "./ClosetSheet";
import { TrickSheet } from "./TrickSheet";
import { nextLockedTrick, totalMastery } from "./tricks";
import type { Trick } from "./tricks";
import { moodMeta, todayMood } from "./mood";
import type { MoodKind, WeatherKind } from "./dialogues/types";
import type { VisitorKind } from "./lifeState";
import { cachedWeather, fetchWeather } from "./weatherApi";
import { configureSound, playSound } from "./sound";
import { dayKey, diffDays, isFullMoon, isWeekend, monthKey, timeSlot, tokyoTime } from "./time";
import type { CrashState } from "../tracker/logic/feast";

// 「生きているコーギー」の舞台。単一の requestAnimationFrame ループで
// お出迎えダッシュ → アイドル・ステートマシン → ふれあい/演出 を駆動する。

export interface ValueDelta {
  pct: number;
  dir: "up" | "down" | "flat";
}

export interface CompanionStageProps {
  life: LifeState;
  setLife: Dispatch<SetStateAction<LifeState>>;
  level: number;
  crash: CrashState | null;
  valueDelta: ValueDelta | null;
  animLevel: "full" | "soft" | "min";
  height?: number;
  principal?: number;        // 積立累計額（家グレード判定）
  value?: number;            // 現在の評価額（ゾロ目スロット判定）
  firstVisitToday?: boolean; // その日の初回訪問（朝一番乗り演出）
}

type Fsm = "idle" | "earTwitch" | "yawn" | "stretch" | "tailChase" | "sniff"
  | "sleep" | "wake" | "catch" | "eat" | "hug" | "settleJump" | "trick";

interface Heart { id: number; x: number; y: number; s: number; big?: boolean }

interface Anim {
  t: number;
  phase: "enter" | "live";
  enterT: number;
  fsm: Fsm; fsmT: number; fsmDur: number;
  trickId: string | null;           // 実行中の芸（fsm==="trick" のとき）
  blinkNext: number; blinkUntil: number;
  lastInteract: number;
  tailPhase: number; legPhase: number;
  petUntil: number;
  earLT: number; earRT: number;     // 耳ピクッの残り時間
  earDownUntil: number;
  shakeUntil: number;               // 首ふり（下落→気持ちの切り替え）
  proudUntil: number;
  tailSpeedMul: number;
  dir: 1 | -1;
  xOff: number; spin: number;
  lift: number; liftV: number;
  bone: { t: number } | null;
  butterfly: { t: number } | null;
  twins: { t: number } | null;
  star: { t: number } | null;
  moon: { t: number } | null;
  queue: string[];                  // 開いた直後に順番に再生する演出
  queueWait: number;
  idleTalkNext: number;
  ball: { st: "fly" | "chase" | "carry"; x: number; y: number; vx: number; vy: number } | null; // ボール遊び（px座標）
  ballCombo: number;                // 連続キャッチ数
  tug: { t: number; dur: number; phase: "pull" | "win" | "lose" } | null; // 引っ張りっこ
  sleepTalkNext: number;            // 次の寝言判定時刻（0=未設定）
  visitor: { kind: VisitorKind; reaction: "chase" | "watch" | "help" | "sneak"; t: number } | null; // 遊びに来る動物
}

const newAnim = (skipEnter: boolean): Anim => ({
  t: 0, phase: skipEnter ? "live" : "enter", enterT: 0,
  fsm: "idle", fsmT: 0, fsmDur: 0, trickId: null,
  blinkNext: 2, blinkUntil: 0,
  lastInteract: 0,
  tailPhase: 0, legPhase: 0,
  petUntil: 0, earLT: 0, earRT: 0, earDownUntil: 0, shakeUntil: 0,
  proudUntil: 0, tailSpeedMul: 1,
  dir: 1, xOff: 0, spin: 0, lift: 0, liftV: 0,
  bone: null, butterfly: null, twins: null, star: null, moon: null,
  queue: [], queueWait: 0, idleTalkNext: 15,
  ball: null, ballCombo: 0, tug: null, sleepTalkNext: 0, visitor: null,
});

const VISITOR_EMOJI: Record<VisitorKind, string> = {
  cat: "🐱", bird: "🐦", butterfly: "🦋", squirrel: "🐿️", hedgehog: "🦔", frog: "🐸", ladybug: "🐞",
};
// 空を飛ぶ来訪者（高い位置でふわふわ）。それ以外は地面。ことりだけ大きく跳ねる。
const VISITOR_FLYERS = new Set<VisitorKind>(["butterfly", "ladybug"]);
const VISITOR_LINE: Record<string, string[]> = {
  chase: ["まてまて〜！", "おいかけっこ しよ！", "つかまえるぞ〜！"],
  watch: ["だれか きたよ…じー", "おきゃくさん かな？", "なにしてるのかな…"],
  help: ["{name}、だれか きた！", "たすけて〜、どきどき", "うしろに いて…！"],
  sneak: ["しー…そーっと…", "びっくり させちゃおう", "にんじゃ みたいでしょ？"],
};

// 今日の気分 → 来訪動物へのリアクション（げんき=追いかける／あまえ=助けを呼ぶ／いたずら=忍び寄る／それ以外=見守る）
const visitorReaction = (mk: string | undefined): "chase" | "watch" | "help" | "sneak" =>
  mk === "genki" ? "chase" : mk === "amae" ? "help" : mk === "itazura" ? "sneak" : "watch";

const TUG_WIN = ["かった〜！ えっへん", "ぐいっ！ ぼくの かち！", "つよいでしょ？ ふふん", "かったワン！ どやっ", "ひっぱりっこ さいきょう！"];
const TUG_LOSE = ["まけちゃった…くやしい", "うぐぐ、つよいなあ", "つぎは まけないぞ！", "ぬかれた〜 もういっかい！", "むむ、やるね {name}"];
const pickTug = (r: "win" | "lose") => { const a = r === "win" ? TUG_WIN : TUG_LOSE; return a[Math.floor(Math.random() * a.length)]; };

const easeOut = (x: number) => 1 - Math.pow(1 - x, 3);

export function CompanionStage({ life, setLife, level, crash, valueDelta, animLevel, height = 280, principal = 0, value = 0, firstVisitToday = false }: CompanionStageProps) {
  const a = useRef<Anim>(newAnim(animLevel === "min"));
  const [, setTick] = useState(0);
  const [bubble, setBubble] = useState<{ text: string; until: number; soft?: boolean } | null>(null);
  const [hearts, setHearts] = useState<Heart[]>([]);
  const [confetti, setConfetti] = useState(false);
  const [closet, setCloset] = useState(false);
  const [brushMode, setBrushMode] = useState(false);
  const [tricks, setTricks] = useState(false);
  const [trickToast, setTrickToast] = useState<string | null>(null);
  const [milestone, setMilestone] = useState<number | null>(null); // 節目アニメ表示中の到達日数
  const [jackpot, setJackpot] = useState<{ amount: number; kind: "zorome" | "kiriban" } | null>(null);
  const [award, setAward] = useState<string | null>(null); // 週間表彰の表示中ラベル
  const [furs, setFurs] = useState<{ id: number; x: number; y: number }[]>([]);
  const [brushCount, setBrushCount] = useState(0);
  const brushLastPt = useRef<{ x: number; y: number } | null>(null);
  const furId = useRef(0);
  // ボール遊び
  const stageRef = useRef<HTMLDivElement>(null);
  const swRef = useRef(360);
  const [ballArmed, setBallArmed] = useState(false);
  const [flingBall, setFlingBall] = useState<{ x: number; y: number } | null>(null);
  const flingSamples = useRef<{ x: number; y: number; t: number }[]>([]);
  const heartId = useRef(0);
  const lifeRef = useRef(life);
  lifeRef.current = life;
  const bubbleRef = useRef(bubble);
  bubbleRef.current = bubble;
  const bubbleActive = () => {
    const b = bubbleRef.current;
    return !!b && a.current.t < b.until;
  };

  const today = dayKey();
  const tt = tokyoTime();
  const slot = timeSlot();
  const night = tt.h >= 19 || tt.h < 5;
  const weekend = isWeekend();
  const isMin = animLevel === "min";
  const mood: MoodKind | undefined = feat("moodSystem") ? todayMood() : undefined;
  const moodRef = useRef(mood);
  moodRef.current = mood;
  const [weather, setWeather] = useState<WeatherKind | undefined>(feat("weather") ? (cachedWeather() ?? undefined) : undefined);
  const weatherRef = useRef(weather);
  weatherRef.current = weather;

  // ステージ幅を計測（ボールの放物線・犬の追走のpx計算に使う）
  useEffect(() => {
    const ro = () => { if (stageRef.current) swRef.current = stageRef.current.clientWidth; };
    ro();
    window.addEventListener("resize", ro);
    return () => window.removeEventListener("resize", ro);
  }, []);

  // サウンド設定を反映
  useEffect(() => { configureSound(feat("sound") && !!life.soundOn, life.soundVol ?? 0.5); }, [life.soundOn, life.soundVol]);

  // 天気を取得（1時間キャッシュ・失敗時は前回値/晴れ）
  useEffect(() => {
    if (!feat("weather")) return;
    let alive = true;
    fetchWeather().then((w) => { if (alive) setWeather(w); }).catch(() => {});
    return () => { alive = false; };
  }, []);

  // 現在の文脈（V2エンジンの条件マッチング用）。気分・天気は Part B 実装後に接続。
  const dctx = (): DialogueContext => ({
    timeOfDay: slot, weekday: tt.dow, month: tt.mo,
    affectionLv: affectionLvOf(lifeRef.current), streak: lifeRef.current.streak,
    marketTrend: valueDelta ? valueDelta.dir : undefined,
    mood: moodRef.current,
    weather: weatherRef.current,
  });

  const showLine = (picked: { id: string; text: string } | null, dur: number, v2: boolean) => {
    if (!picked) return;
    setBubble({ text: picked.text, until: a.current.t + dur / 1000 });
    const id = picked.id;
    setLife((s) => (v2 ? markUsedV2(s, id, today) : markUsedOld(s, id)));
  };

  // ---- セリフを言う ----
  // V2に該当カテゴリがあれば2,050本から条件マッチで選ぶ。無ければ旧POOLへフォールバック
  // （settle / wake / pet100 / treatDone / sadReunion / rare.* などの特殊一言）。
  const say = (cat: string, n?: number, dur = 4200) => {
    const useV2 = feat("dialoguesV2") && hasV2Category(cat);
    const picked = useV2
      ? pickV2(lifeRef.current, [cat], dctx(), { n })
      : pickLineOld(lifeRef.current, cat, n);
    showLine(picked, dur, useV2);
  };

  // お出迎えのあいさつ：明日の予告の消費 → さみしい再会 → 文脈に合うカテゴリを重み付き抽選。
  const sayGreeting = (dur = 4600) => {
    const s = lifeRef.current;
    if (s.pendingTomorrow && diffDays(today, s.pendingTomorrow.day) >= 0) {
      showLine(pickTomorrowFollowup(s), dur, false);
      setLife((st) => ({ ...st, pendingTomorrow: null }));
      return;
    }
    if (s.sadReunion) { say("sadReunion", undefined, dur); return; }
    if (feat("exchangeDiary") && s.diaryReplyThanksDay && diffDays(today, s.diaryReplyThanksDay) >= 0) {
      setBubble({ text: "きのうの おへんじ、うれしかった！ ありがとう", until: a.current.t + dur / 1000 });
      setLife((st) => ({ ...st, diaryReplyThanksDay: null }));
      return;
    }
    if (firstVisitToday && feat("firstVisitDash")) { // 朝一番乗り
      setBubble({ text: "いちばんのり！ きょうも あえて うれしい！", until: a.current.t + dur / 1000 });
      return;
    }
    const ctx = dctx();
    const cats = ["greet", "greet", "weekday", "season", "knowledge", "affection", "murmur"];
    if (ctx.mood) cats.push("mood", "mood");
    if (ctx.weather) cats.push("weather");
    if (ctx.streak >= 2 && Math.random() < 0.3) cats.push("streak", "streak");
    if (ctx.marketTrend && ctx.marketTrend !== "flat") cats.push("market");
    const cat = cats[Math.floor(Math.random() * cats.length)];
    showLine(pickV2(s, [cat], ctx), dur, true);
  };

  // 放置中のひとりごと：独り言を中心に、豆知識・なつき度・季節・天気から。
  const sayIdle = (dur: number) => {
    const s = lifeRef.current;
    const ctx = dctx();
    let cats = ["murmur", "murmur", "knowledge", "affection", "season"];
    if (ctx.mood) cats.push("mood", "mood");
    if (ctx.weather) cats.push("weather");
    if (affectionLvOf(s) >= 4 && Math.random() < 0.2) cats = ["affection"];
    const cat = cats[Math.floor(Math.random() * cats.length)];
    showLine(pickV2(s, [cat], ctx), dur, true);
  };

  // ---- レア演出の抽選（1日1回） ----
  useEffect(() => {
    if (life.rareRolledDay === today) return;
    let rare: RareKind | null = null;
    const r = Math.random();
    // 虹色の日は廃止（毛色が気持ち悪いという声のため）
    if (r < 0.011) rare = "twins";
    else if (r < 0.041 && night) rare = "star";
    else if (r < 0.091) rare = "butterfly";
    else if (isFullMoon() && night) rare = "moon";
    // 遊びに来る動物（1日1回・約55%で来訪）。7種からまんべんなく。
    let visitor: VisitorKind | null = null;
    if (feat("visitors") && Math.random() < 0.55) {
      const kinds: VisitorKind[] = ["cat", "bird", "butterfly", "squirrel", "hedgehog", "frog", "ladybug"];
      visitor = kinds[Math.floor(Math.random() * kinds.length)];
    }
    setLife((s) => ({ ...s, rareRolledDay: today, todayRare: rare, visitorRolledDay: today, todayVisitor: visitor }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today]);

  // ---- 開いた直後の演出キューを組む（あいさつ→積立→レア→相場） ----
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;
    const q: string[] = ["greet"];
    const s = lifeRef.current;
    // 優先度：節目 ＞ レア ＞ 家グレードアップ ＞ 通常（積立/相場/来訪）
    if (feat("milestoneAnim")) {
      const ms = [100, 365, 500, 1000].find((m) => s.visitDayCount === m && s.milestoneShownAt < m);
      if (ms) q.push(`milestone.${ms}`);
    }
    if (s.todayRare && s.todayRare !== "rainbow") q.push(`rare.${s.todayRare}`);
    if (feat("houseUpgrade") && houseLevel > (s.lastHouseLevel ?? 0)) q.push("houseUp");
    if (feat("jackpotSlot") && !isMin) {
      const jp = jackpotKind(value) ? value : jackpotKind(principal) ? principal : 0;
      if (jp && jp !== (s.jackpotShownValue ?? 0)) q.push(`jackpot.${jp}`);
    }
    if (s.settleDay != null && tt.d === s.settleDay && s.lastSettleMonth !== monthKey()) q.push("settle");
    if (valueDelta && valueDelta.dir !== "flat") q.push(`market.${valueDelta.dir}`);
    if (feat("visitors") && s.todayVisitor && !isMin) q.push("visitor");
    // 週1がんばったで賞：日曜の初回訪問
    if (feat("weeklyAward") && tt.dow === 0 && firstVisitToday && s.lastAwardWeek !== today) q.push("award");
    a.current.queue = q;
    a.current.queueWait = animLevel === "min" ? 0.4 : 1.35; // 入場ダッシュのあとに開始
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 出来事が実際に再生されたときに、おもいで図鑑と日記へ記録する（同日同種は1回だけ）。
  // レア演出は today.rare にも反映（日記の材料）。来訪動物（visit_*）はおもいでのみ。
  const recordMemory = (kind: MemoryKind) => {
    setLife((s) => {
      // 寝相はコレクション（種類ごと1回・初回の日付を残す）。それ以外は同日同種1回。
      const isSleep = kind.startsWith("sleep_");
      const dup = isSleep
        ? s.memories.some((m) => m.kind === kind)
        : s.memories.some((m) => m.day === today && m.kind === kind);
      const memories = dup ? s.memories : [...s.memories, { day: today, kind }];
      const isRare = !kind.includes("_"); // レア5種は "_" を含まない
      return { ...s, memories, ...(isRare ? { today: { ...s.today, rare: kind as RareKind } } : {}) };
    });
  };

  // ---- 演出キューの実行 ----
  const runEvent = (ev: string) => {
    const an = a.current;
    if (ev === "greet") {
      sayGreeting();
      if (lifeRef.current.sadReunion) setLife((s) => ({ ...s, sadReunion: false }));
      an.tailSpeedMul = 1.8; // うれしくてしっぽブンブン
      setTimeout(() => { a.current.tailSpeedMul = 1; }, 2600);
      an.queueWait = 4.6;
      // 明日の予告（20%）：会話の最後に予告を差し込み、翌日フォローアップを予約
      if (feat("tomorrowPreview") && !lifeRef.current.pendingTomorrow && Math.random() < 0.2) {
        an.queue.push("tomorrowSay");
      }
      return;
    }
    if (ev === "tomorrowSay") {
      say("tomorrow", undefined, 4800);
      setLife((s) => ({ ...s, pendingTomorrow: { day: dayKey(Date.now() + 86400000) } }));
      an.queueWait = 5;
      return;
    }
    if (ev === "settle") {
      say("settle", undefined, 5000);
      setLife((s) => ({ ...s, lastSettleMonth: monthKey(), today: { ...s.today, settle: true } }));
      if (!isMin) {
        setConfetti(true);
        an.fsm = "settleJump"; an.fsmT = 0; an.fsmDur = 2.2;
        setTimeout(() => setConfetti(false), 3600);
      }
      an.queueWait = 5.4;
      return;
    }
    if (ev.startsWith("rare.")) {
      const kind = ev.slice(5) as RareKind;
      say(`rare.${kind}`, undefined, 5000);
      recordMemory(kind);
      if (!isMin) {
        if (kind === "butterfly") an.butterfly = { t: 0 };
        if (kind === "star") an.star = { t: 0 };
        if (kind === "twins") an.twins = { t: 0 };
        if (kind === "moon") an.moon = { t: 0 };
      }
      an.queueWait = 7;
      return;
    }
    if (ev.startsWith("jackpot.")) {
      const amt = Number(ev.slice(8));
      const kind = jackpotKind(amt);
      if (kind) {
        setJackpot({ amount: amt, kind });
        setLife((s) => ({ ...s, jackpotShownValue: amt }));
        an.tailSpeedMul = 2.6; // 大興奮
        setTimeout(() => { a.current.tailSpeedMul = 1; }, 3500);
        setTimeout(() => { if (a.current.lift === 0 && a.current.liftV === 0) a.current.liftV = 150; }, 1600);
      }
      an.queueWait = 4.5;
      return;
    }
    if (ev === "houseUp") {
      setBubble({ text: "おうちが グレードアップ！ ジャジャーン！", until: an.t + 4.4 });
      setLife((s) => ({ ...s, lastHouseLevel: houseLevel }));
      if (!isMin) { setConfetti(true); an.fsm = "settleJump"; an.fsmT = 0; an.fsmDur = 2; setTimeout(() => setConfetti(false), 3200); }
      playSound("step");
      an.queueWait = 5;
      return;
    }
    if (ev.startsWith("milestone.")) {
      const m = Number(ev.slice(10));
      setMilestone(m);
      setLife((s) => ({ ...s, milestoneShownAt: m }));
      const txt = m === 100 ? "100にち ありがとう。ぺこり" : m === 365 ? "1ねんかん いっしょ！ おもいでいっぱい" : m === 500 ? "500にち！ はなびだ〜！" : "1000にち…にじが かかったよ";
      setBubble({ text: txt, until: an.t + 5.5 });
      if (!isMin) {
        if (m === 100) { an.fsm = "idle"; an.earDownUntil = an.t + 1; } // お辞儀っぽく
        else if (m === 500) { setConfetti(true); setTimeout(() => setConfetti(false), 4000); }
        else if (m >= 365) { an.liftV = 140; }
      }
      setTimeout(() => setMilestone(null), 6000);
      an.queueWait = 6.5;
      return;
    }
    if (ev === "award") {
      const s = lifeRef.current;
      // 今週の実績から1つ選定
      const cand = [
        s.streak >= 7 ? { kind: "streak", label: `れんぞくらいほう賞（${s.streak}にち）` } : null,
        s.petTotal >= 30 ? { kind: "pet", label: "なでなで王" } : null,
        s.treatTotal >= 10 ? { kind: "treat", label: "おやつマスター賞" } : null,
        s.hugTotal >= 10 ? { kind: "hug", label: "ぎゅ〜たいしょう" } : null,
      ].filter(Boolean) as { kind: string; label: string }[];
      const award = cand.length ? cand[Math.floor(Math.random() * cand.length)] : { kind: "effort", label: "まいにち がんばったで賞" };
      setBubble({ text: `こんしゅうの ${award.label}！ おめでとう🏅`, until: an.t + 5.2 });
      setLife((st) => ({ ...st, awards: [...(st.awards || []), { week: today, kind: award.kind, label: award.label }], lastAwardWeek: today }));
      setAward(award.label);
      if (!isMin) { setConfetti(true); an.fsm = "settleJump"; an.fsmT = 0; an.fsmDur = 2; setTimeout(() => setConfetti(false), 3600); }
      setTimeout(() => setAward(null), 5200);
      an.queueWait = 6;
      return;
    }
    if (ev === "visitor") {
      const kind = lifeRef.current.todayVisitor;
      if (!kind) { an.queueWait = 0.2; return; }
      const reaction = visitorReaction(moodRef.current);
      an.visitor = { kind, reaction, t: 0 };
      recordMemory(`visit_${kind}` as MemoryKind);
      const lines = VISITOR_LINE[reaction];
      setBubble({ text: fillVars(lines[Math.floor(Math.random() * lines.length)], lifeRef.current), until: an.t + 4 });
      an.queueWait = 7.5;
      return;
    }
    if (ev === "market.up") {
      say("market", undefined, 5000);
      an.proudUntil = an.t + 4;
      // 上昇率をしっぽの振り速度に反映（+1%で1.4倍、最大3倍）
      an.tailSpeedMul = Math.min(3, 1 + (valueDelta?.pct || 0) * 40);
      setTimeout(() => { a.current.tailSpeedMul = 1; }, 4200);
      an.queueWait = 5.4;
      return;
    }
    if (ev === "market.down") {
      // 一瞬耳ペタン → すぐ首を振って前向きセリフ（1秒以内に切り替え）
      an.earDownUntil = an.t + 0.8;
      an.shakeUntil = an.t + 1.4;
      setTimeout(() => say("market", undefined, 5200), 850);
      an.queueWait = 6;
      return;
    }
  };

  // ---- デバッグ用イベント ----
  useEffect(() => {
    const h = (e: Event) => {
      const d = (e as CustomEvent).detail || {};
      const an = a.current;
      if (d.rare) { an.queue.push(`rare.${d.rare}`); an.queueWait = Math.min(an.queueWait, 0.1); }
      if (d.settle) { an.queue.push("settle"); an.queueWait = Math.min(an.queueWait, 0.1); }
      if (d.market) { an.queue.push(`market.${d.market}`); an.queueWait = Math.min(an.queueWait, 0.1); }
      if (d.sleep) { an.fsm = "sleep"; an.fsmT = 0; an.fsmDur = 1e9; }
      if (d.milestone) { an.queue.unshift(`milestone.${d.milestone}`); an.queueWait = Math.min(an.queueWait, 0.1); }
      if (d.jackpot) { setJackpot({ amount: Number(d.jackpot), kind: (jackpotKind(Number(d.jackpot)) || "kiriban") }); }
      if (d.award) { an.queue.unshift("award"); an.queueWait = Math.min(an.queueWait, 0.1); }
      if (d.replay) { a.current = newAnim(false); didInit.current = false; setBubble(null); }
      if (d.weather !== undefined) setWeather(d.weather || cachedWeather() || undefined);
      if (d.visitor) {
        const kind = d.visitor as VisitorKind;
        const reaction = visitorReaction(moodRef.current);
        an.visitor = { kind, reaction, t: 0 };
        recordMemory(`visit_${kind}` as MemoryKind);
        const lines = VISITOR_LINE[reaction];
        setBubble({ text: fillVars(lines[Math.floor(Math.random() * lines.length)], lifeRef.current), until: an.t + 4 });
      }
      setTick((v) => v + 1);
    };
    window.addEventListener("oruduck-debug", h);
    return () => window.removeEventListener("oruduck-debug", h);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ---- メインループ ----
  useEffect(() => {
    if (isMin) return; // ひかえめモードは静止画＋まばたきのみ（下の interval）
    let raf = 0, last = performance.now();
    const loop = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const an = a.current;
      an.t += dt;
      const moodTail = moodRef.current === "genki" ? 1.4 : moodRef.current === "mattari" ? 0.7 : 1;
      an.tailPhase += dt * (4 + lifeRef.current.bond / 60) * an.tailSpeedMul * moodTail * (an.fsm === "sleep" ? 0.15 : 1);

      // 入場ダッシュ（1.2秒以内）
      if (an.phase === "enter") {
        an.enterT += dt;
        an.legPhase += dt * 3.2;
        if (an.enterT >= 1.05) { an.phase = "live"; an.fsm = "idle"; an.fsmT = 0; }
      } else {
        stepLive(an, dt);
      }

      // ジャンプ物理
      if (an.liftV !== 0 || an.lift > 0) {
        an.liftV -= dt * 560;
        an.lift = Math.max(0, an.lift + an.liftV * dt);
        if (an.lift === 0 && an.liftV < 0) an.liftV = 0;
      }

      setTick((v) => v + 1);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMin]);

  // ひかえめモード：まばたきと演出キューだけ低頻度で回す
  useEffect(() => {
    if (!isMin) return;
    const iv = setInterval(() => {
      const an = a.current;
      an.t += 0.5;
      an.blinkUntil = Math.random() < 0.12 ? an.t + 0.15 : an.blinkUntil;
      if (an.queue.length) {
        an.queueWait -= 0.5;
        if (an.queueWait <= 0) { const ev = an.queue.shift()!; runEvent(ev); }
      }
      setTick((v) => v + 1);
    }, 500);
    return () => clearInterval(iv);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMin]);

  // ---- アイドル・ステートマシン ----
  const secAcc = useRef(0);
  const stepLive = (an: Anim, dt: number) => {
    an.fsmT += dt;

    // 演出キュー
    if (an.queue.length) {
      an.queueWait -= dt;
      if (an.queueWait <= 0) { const ev = an.queue.shift()!; runEvent(ev); }
    }

    // まばたき（3〜7秒間隔）
    if (an.t >= an.blinkNext) {
      an.blinkUntil = an.t + 0.13;
      an.blinkNext = an.t + 3 + Math.random() * 4;
    }

    // 耳ピクッの減衰
    an.earLT = Math.max(0, an.earLT - dt);
    an.earRT = Math.max(0, an.earRT - dt);

    const slow = weekend ? 0.7 : 1; // 週末はゆったり
    // 今日の気分でアイドル挙動を変える：元気=活発/まったり=おとなしく早寝/
    // いたずら=くるくる多め/甘えん坊=よく話しかける
    const mk = moodRef.current;
    const actMul = mk === "genki" ? 1.9 : mk === "mattari" ? 0.5 : mk === "itazura" ? 1.5 : 1;
    const chaseMul = mk === "itazura" ? 3 : mk === "genki" ? 2 : mk === "mattari" ? 0.4 : 1;
    const sleepAfter = mk === "mattari" ? 180 : mk === "genki" ? 420 : 300;
    const talkChance = mk === "amae" ? 0.62 : mk === "mattari" ? 0.3 : 0.4;

    switch (an.fsm) {
      case "idle": {
        // 1秒ごとに確率判定（10%/10s = 1%/s など）。気分で頻度を調整。
        secAcc.current += dt;
        if (secAcc.current >= 1) {
          secAcc.current = 0;
          const r = Math.random();
          const pTwitch = 0.010 * slow * actMul;
          const pYawn = pTwitch + 0.00167 * slow * (mk === "mattari" ? 2 : 1);
          const pChase = pYawn + 0.0005 * slow * chaseMul;
          const pSniff = pChase + 0.00267 * slow * actMul;
          if (r < pTwitch) { an.fsm = "earTwitch"; an.fsmT = 0; an.fsmDur = 0.7; an.earLT = 0.5; }
          else if (r < pYawn) { an.fsm = "yawn"; an.fsmT = 0; an.fsmDur = 2.4; }
          else if (r < pChase) { an.fsm = "tailChase"; an.fsmT = 0; an.fsmDur = 2.6; }
          else if (r < pSniff) { an.fsm = "sniff"; an.fsmT = 0; an.fsmDur = 2.4; }
        }
        // 放置で寝る（まったりは早め、元気は遅め）
        if (an.t - an.lastInteract > sleepAfter) { an.fsm = "sleep"; an.fsmT = 0; an.fsmDur = 1e9; }
        // ときどきひとりごと（甘えん坊はよく話す）
        if (an.t >= an.idleTalkNext) {
          an.idleTalkNext = an.t + (mk === "amae" ? 9 : 14) + Math.random() * 16;
          if (Math.random() < talkChance && !bubbleActive()) sayIdle(4200);
        }
        break;
      }
      case "earTwitch":
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; }
        break;
      case "yawn":
        if (an.fsmT >= an.fsmDur) { an.fsm = "stretch"; an.fsmT = 0; an.fsmDur = 1.2; }
        break;
      case "stretch":
      case "wake":
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; }
        break;
      case "tailChase":
        an.spin += dt * 300;
        an.legPhase += dt * 3;
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; an.spin = 0; }
        break;
      case "sniff":
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; }
        break;
      case "sleep":
        if (Math.random() < dt * 0.28) playSound("snore"); // すーすー寝息（音ON時のみ）
        // 寝言：30秒ごとに20%抽選で小さく薄く表示（本音セリフはrareで低確率）
        if (feat("sleeptalk") && !isMin) {
          if (an.sleepTalkNext === 0) an.sleepTalkNext = an.t + 22;
          if (an.t >= an.sleepTalkNext) {
            an.sleepTalkNext = an.t + 30;
            if (Math.random() < 0.2 && !bubbleActive()) {
              const p = pickV2(lifeRef.current, ["sleeptalk"], dctx());
              if (p) { setBubble({ text: p.text, until: an.t + 3.6, soft: true }); setLife((s) => markUsedV2(s, p.id, today)); }
            }
          }
        }
        break; // タップで起こすまで寝る
      case "catch":
        if (an.bone) {
          an.bone.t += dt;
          if (an.bone.t >= 0.42 && an.lift === 0 && an.liftV === 0) an.liftV = 200; // キャッチジャンプ
          if (an.bone.t >= 0.6) { an.bone = null; an.fsm = "eat"; an.fsmT = 0; an.fsmDur = 1.5; playSound("crunch"); }
        }
        break;
      case "eat":
        if (an.fsmT >= an.fsmDur) {
          an.fsm = "idle"; an.fsmT = 0;
          const left = treatsLeft(lifeRef.current);
          say(left <= 0 ? "treatDone" : "treat", undefined, 4600);
          spawnHearts(1, false);
        }
        break;
      case "hug":
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; }
        break;
      case "settleJump":
        if (an.fsmT < 1.6 && an.lift === 0 && an.liftV === 0) an.liftV = 240;
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; }
        break;
      case "trick":
        // ハイタッチ・よし！は途中でもう一度はねる
        if ((an.trickId === "highfive" || an.trickId === "ok") && an.fsmT > 0.55 && an.fsmT < 0.62 && an.lift === 0 && an.liftV === 0) an.liftV = 150;
        if (an.fsmT >= an.fsmDur) { an.fsm = "idle"; an.fsmT = 0; an.trickId = null; an.xOff = 0; }
        break;
    }

    // 遊びに来る動物：気分で反応が変わる
    if (an.visitor) {
      const v = an.visitor;
      v.t += dt;
      const ax = Math.cos(v.t * 0.9) * 90 - (v.t > 6 ? (v.t - 6) * 180 : 0);
      if (v.reaction === "chase") { an.dir = ax > an.xOff ? 1 : -1; an.xOff += (ax - an.xOff) * dt * 2.4; an.legPhase += dt * 2.6; }
      else if (v.reaction === "sneak") { an.dir = ax > an.xOff ? 1 : -1; an.xOff += (ax - an.xOff) * dt * 1.1; an.legPhase += dt * 1.6; if (v.t > 4 && v.t < 4.16 && an.lift === 0 && an.liftV === 0) an.liftV = 150; }
      else if (v.reaction === "help") { an.xOff += (-Math.sign(ax) * 18 - an.xOff) * dt * 2; an.dir = (ax > 0 ? -1 : 1); }
      else { an.xOff += (0 - an.xOff) * dt * 3; an.dir = (ax > 0 ? 1 : -1); }
      if (v.t > 7.2) { an.visitor = null; an.xOff = 0; an.dir = 1; }
    }

    // 引っ張りっこ：ぐいぐい引き合い、2〜4秒でランダム勝敗
    if (an.tug) {
      const g = an.tug;
      g.t += dt;
      an.lastInteract = an.t;
      if (g.phase === "pull") {
        an.xOff = Math.sin(an.t * 22) * 4; // ぐいぐい踏ん張る
        an.legPhase += dt * 4;
        if (g.t >= g.dur) { g.phase = Math.random() < 0.5 ? "win" : "lose"; g.t = 0; }
      } else {
        const dirSign = g.phase === "win" ? -1 : 1; // 勝ち=のけぞる/負け=前へ引かれる
        an.xOff += (dirSign * 22 - an.xOff) * Math.min(1, dt * 5);
        if (g.t >= 1.0) {
          const won = g.phase === "win";
          an.tug = null; an.xOff = 0; an.fsm = "idle"; an.fsmT = 0;
          if (won) { an.liftV = 130; an.proudUntil = an.t + 2.6; an.tailSpeedMul = 2; setTimeout(() => { a.current.tailSpeedMul = 1; }, 2000); }
          else { an.earDownUntil = an.t + 1.2; }
          setBubble({ text: fillVars(won ? pickTug("win") : pickTug("lose"), lifeRef.current), until: an.t + 3.8 });
        }
      }
    }

    // ボール遊び：投げる→着地→犬が走って追う→ジャンプキャッチ→咥えて戻る→お座り
    if (!an.tug && an.ball) {
      const b = an.ball;
      const sw = swRef.current;
      const floorY = height - 22;
      const dogPx = sw / 2 + an.xOff;
      if (b.st === "fly") {
        b.vy += dt * 1200; b.x += b.vx * dt; b.y += b.vy * dt;
        if (b.x < 12) { b.x = 12; b.vx = Math.abs(b.vx) * 0.6; }
        if (b.x > sw - 12) { b.x = sw - 12; b.vx = -Math.abs(b.vx) * 0.6; }
        if (b.y >= floorY) { b.y = floorY; b.vy = 0; b.vx *= 0.35; b.st = "chase"; }
      } else if (b.st === "chase") {
        b.x += b.vx * dt; b.vx *= Math.max(0, 1 - dt * 2); b.y = floorY;
        b.x = Math.max(12, Math.min(sw - 12, b.x));
        an.dir = (b.x > dogPx ? 1 : -1);
        an.xOff += (b.x - sw / 2 - an.xOff) * Math.min(1, dt * 3.4);
        an.legPhase += dt * 3;
        if (Math.abs(dogPx - b.x) < 26) {
          if (an.lift === 0 && an.liftV === 0) { an.liftV = 150; playSound("step"); } // ジャンプキャッチ
          b.st = "carry";
        }
      } else if (b.st === "carry") {
        an.xOff += (0 - an.xOff) * Math.min(1, dt * 3.4);
        an.dir = (an.xOff > 2 ? -1 : an.xOff < -2 ? 1 : an.dir);
        an.legPhase += dt * 2.6;
        b.x = sw / 2 + an.xOff; b.y = floorY - 26 - an.lift;
        if (Math.abs(an.xOff) < 8) {
          const combo = an.ballCombo + 1;
          an.ball = null; an.xOff = 0; an.dir = 1; an.fsm = "idle"; an.fsmT = 0;
          an.lastInteract = an.t;
          if (an.lift === 0 && an.liftV === 0) an.liftV = 120; // うれしくてぴょん
          if (combo % 10 === 0) {
            setBubble({ text: `ボールめいじん！ ${combo}かい れんぞく！`, until: an.t + 4.2 });
            an.ballCombo = combo;
          } else {
            an.ballCombo = combo;
            say("ball", undefined, 3600);
          }
          setLife((s) => markPlayed(combo > (s.ballBestCombo || 0) ? { ...s, ballBestCombo: combo } : s));
        }
      }
    }

    // ちょうちょ追いかけ
    if (!an.ball && an.butterfly) {
      an.butterfly.t += dt;
      const bt = an.butterfly.t;
      const bx = Math.sin(bt * 1.1) * 90;
      an.dir = bx > an.xOff + 6 ? 1 : bx < an.xOff - 6 ? -1 : an.dir;
      an.xOff += (bx - an.xOff) * dt * 2.2;
      an.legPhase += dt * 2.6;
      if (bt > 5.2) { an.butterfly = null; an.xOff = 0; an.dir = 1; }
    } else if (an.twins) {
      an.twins.t += dt;
      if (an.twins.t < 4 && Math.floor(an.twins.t / 0.9) % 2 === 0 && an.lift === 0 && an.liftV === 0) an.liftV = 160;
      if (an.twins.t > 6) an.twins = null;
    } else if (an.star) {
      an.star.t += dt;
      if (an.star.t > 4.5) an.star = null;
    } else if (an.moon) {
      an.moon.t += dt;
      if (an.moon.t > 5) an.moon = null;
    } else if (!an.ball && !an.tug && !an.visitor && an.fsm !== "tailChase" && an.phase === "live") {
      an.xOff *= Math.max(0, 1 - dt * 3);
    }
  };

  // ---- ふれあい（撫でる・ハグ） ----
  const petAccum = useRef(0);
  const lastPetAt = useRef(0);
  const pressStart = useRef<{ x: number; y: number; t: number } | null>(null);
  const hugTimer = useRef<number | null>(null);
  const lastPt = useRef<{ x: number; y: number } | null>(null);

  const spawnHearts = (n: number, big: boolean) => {
    if (isMin) return;
    const items: Heart[] = [];
    for (let i = 0; i < n; i++) {
      items.push({ id: ++heartId.current, x: 42 + Math.random() * 24, y: 30, s: big ? 34 : 14 + Math.random() * 10, big });
    }
    setHearts((h) => [...h, ...items]);
    setTimeout(() => setHearts((h) => h.filter((x) => !items.some((i2) => i2.id === x.id))), 1400);
  };

  const wakeIfSleeping = () => {
    const an = a.current;
    an.lastInteract = an.t;
    if (an.fsm === "sleep") {
      an.fsm = "wake"; an.fsmT = 0; an.fsmDur = 1.3; an.sleepTalkNext = 0;
      say("wake", undefined, 3600);
      return true;
    }
    return false;
  };

  const onHeadDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    if (wakeIfSleeping()) return;
    pressStart.current = { x: e.clientX, y: e.clientY, t: performance.now() };
    lastPt.current = { x: e.clientX, y: e.clientY };
    petAccum.current = 0;
    // 長押し1秒でハグ
    hugTimer.current = window.setTimeout(() => {
      if (petAccum.current < 30) {
        const an = a.current;
        an.fsm = "hug"; an.fsmT = 0; an.fsmDur = 1.8;
        an.lastInteract = an.t;
        lastPetAt.current = performance.now(); // クリック貫通防止
        say("hug", undefined, 3800);
        spawnHearts(1, true);
        setLife(applyHug);
        playSound("whine");
      }
    }, 1000);
  };

  const onHeadMove = (e: React.PointerEvent) => {
    if (!pressStart.current || !lastPt.current) return;
    const dx = e.clientX - lastPt.current.x, dy = e.clientY - lastPt.current.y;
    lastPt.current = { x: e.clientX, y: e.clientY };
    petAccum.current += Math.hypot(dx, dy);
    const an = a.current;
    an.lastInteract = an.t;
    if (petAccum.current > 24 && performance.now() - lastPetAt.current > 300) {
      lastPetAt.current = performance.now();
      petAccum.current = 0;
      an.petUntil = an.t + 1.0;
      spawnHearts(1 + Math.floor(Math.random() * 3), false);
      if (Math.random() < 0.35) playSound("wag");
      const before = lifeRef.current.petTotal;
      setLife(applyPet);
      const after = before + 1;
      if (after % 100 === 0) {
        say("pet100", after, 5200);
        setLife((s) => ({ ...s, petThankedAt: after }));
        spawnHearts(3, true);
      } else if (Math.random() < 0.18 && !bubbleActive()) {
        say("pet", undefined, 3000);
      }
    }
  };

  const onHeadUp = () => {
    pressStart.current = null;
    lastPt.current = null;
    if (hugTimer.current) { clearTimeout(hugTimer.current); hugTimer.current = null; }
  };

  const onDogTap = () => {
    const an = a.current;
    if (wakeIfSleeping()) return;
    // 撫でた・ぎゅ〜した直後のクリック貫通でジャンプしないようにする
    if (performance.now() - lastPetAt.current < 600 || an.fsm === "hug") return;
    an.lastInteract = an.t;
    if (an.lift === 0 && an.liftV === 0) an.liftV = 190;
    if (!bubbleActive() && Math.random() < 0.5) sayIdle(3600);
  };

  // ---- 着せ替え ----
  const outfit = outfitOf(life.wardrobe);
  // 装着したら「にあう？」とその場で一回転
  const celebrateOutfit = () => {
    const an = a.current;
    if (an.fsm === "sleep") { an.fsm = "idle"; an.fsmT = 0; }
    an.fsm = "tailChase"; an.fsmT = 0; an.fsmDur = 1.3; an.spin = 0;
    an.lastInteract = an.t;
    setBubble({ text: "にあう？", until: an.t + 2.6 });
  };

  // ---- ブラッシング ----
  // ブラシモード中に犬をこするたび毛パーティクルが舞う。20ストロークで
  // うっとり顔＋なつき度+1（1日1回まで）。
  const spawnFur = (xp: number, yp: number) => {
    if (isMin) return;
    const id = ++furId.current;
    setFurs((f) => [...f.slice(-14), { id, x: xp, y: yp }]);
    setTimeout(() => setFurs((f) => f.filter((x) => x.id !== id)), 900);
  };
  const onBrushMove = (e: React.PointerEvent) => {
    if (!brushMode) return;
    const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const xp = ((e.clientX - r.left) / r.width) * 100;
    const yp = ((e.clientY - r.top) / r.height) * 100;
    const last = brushLastPt.current;
    brushLastPt.current = { x: e.clientX, y: e.clientY };
    if (!last) return;
    const d = Math.hypot(e.clientX - last.x, e.clientY - last.y);
    if (d < 14) return;
    a.current.lastInteract = a.current.t;
    spawnFur(xp, yp);
    a.current.petUntil = a.current.t + 0.8; // うっとり気味に
    setBrushCount((c) => {
      const nc = c + 1;
      if (nc >= 20) {
        if (lifeRef.current.lastBrushDay !== today) {
          setLife((s) => markPlayed({ ...s, bond: clampBond(s.bond + 1), lastBrushDay: today, today: { ...s.today, bond: clampBond(s.bond + 1) } }));
        } else {
          setLife(markPlayed);
        }
        say("brush", undefined, 4200);
        spawnHearts(2, false);
        setBrushMode(false);
        return 0;
      }
      return nc;
    });
  };
  const onBrushUp = () => { brushLastPt.current = null; };

  // ---- 芸を教える ----
  const doTrick = (t: Trick) => {
    const an = a.current;
    if (an.fsm === "sleep") { an.fsm = "idle"; an.fsmT = 0; }
    an.lastInteract = an.t;
    setBubble({ text: t.line, until: an.t + 3.6 });
    // 芸ごとに見た目のはっきり違うモーションへ。バーンだけは寝る演出を流用。
    if (t.motion === "bang") {
      an.fsm = "sleep"; an.fsmT = 0; an.fsmDur = 1e9;
      setTimeout(() => { if (a.current.fsm === "sleep") { a.current.fsm = "wake"; a.current.fsmT = 0; a.current.fsmDur = 1.2; } }, 1500);
    } else {
      an.fsm = "trick"; an.fsmT = 0; an.trickId = t.id;
      an.fsmDur = t.id === "ok" || t.id === "highfive" ? 1.3 : t.id === "wait" ? 1.7 : 1.5;
      // よし！は勢いよく最初にジャンプ
      if (t.id === "ok" && an.lift === 0 && an.liftV === 0) an.liftV = 200;
      if (t.id === "wait") an.earDownUntil = an.t + 1.35;
    }
    setLife((s) => {
      const m = { ...(s.trickMastery || {}) };
      const before = totalMastery(m);
      m[t.id] = (m[t.id] || 0) + 1;
      const nextBefore = nextLockedTrick(s.trickMastery || {});
      const nextAfter = nextLockedTrick(m);
      if (nextBefore && nextBefore !== nextAfter && before + 1 >= nextBefore.unlockAt) {
        setTrickToast(`あたらしい げい：「${nextBefore.name}」を おぼえた！`);
        setTimeout(() => setTrickToast(null), 3200);
      }
      return markPlayed({ ...s, trickMastery: m });
    });
  };

  // ---- 引っ張りっこ ----
  const startTug = () => {
    const an = a.current;
    if (an.tug || an.ball) return;
    wakeIfSleeping();
    an.lastInteract = an.t;
    an.tug = { t: 0, dur: 2 + Math.random() * 2, phase: "pull" };
    setBubble({ text: "つなひき、しょうぶ！", until: an.t + 1.6 });
    setLife(markPlayed);
  };

  // ---- ボール遊び（フリックで投げる） ----
  const armBall = () => {
    if (a.current.ball || ballArmed) return;
    wakeIfSleeping();
    setBallArmed(true);
    setFlingBall({ x: swRef.current / 2, y: height - 42 });
    flingSamples.current = [];
  };
  const stageXY = (e: React.PointerEvent) => {
    const r = stageRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };
  const onFlingDown = (e: React.PointerEvent) => {
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    const p = stageXY(e);
    flingSamples.current = [{ ...p, t: performance.now() }];
    setFlingBall(p);
  };
  const onFlingMove = (e: React.PointerEvent) => {
    if (!flingSamples.current.length) return;
    const p = stageXY(e);
    flingSamples.current.push({ ...p, t: performance.now() });
    if (flingSamples.current.length > 6) flingSamples.current.shift();
    setFlingBall(p);
  };
  const onFlingUp = () => {
    const s = flingSamples.current;
    flingSamples.current = [];
    setBallArmed(false); setFlingBall(null);
    if (s.length < 2) return;
    const a0 = s[0], a1 = s[s.length - 1];
    const dtS = Math.max(0.016, (a1.t - a0.t) / 1000);
    let vx = (a1.x - a0.x) / dtS;
    let vy = (a1.y - a0.y) / dtS;
    if (Math.hypot(vx, vy) < 120) return; // 弱すぎる時は投げない
    vx = Math.max(-650, Math.min(650, vx));
    vy = Math.min(-160, Math.max(-950, vy)); // 必ず上向きに補正
    a.current.ball = { st: "fly", x: a1.x, y: Math.min(a1.y, height - 30), vx, vy };
    a.current.lastInteract = a.current.t;
  };

  // ---- おやつ ----
  const left = treatsLeft(life);
  const giveTreat = () => {
    const an = a.current;
    if (left <= 0 || an.bone || an.fsm === "eat") return;
    wakeIfSleeping();
    an.lastInteract = an.t;
    setLife(applyTreat);
    if (isMin) { say(left - 1 <= 0 ? "treatDone" : "treat", undefined, 4200); return; }
    an.bone = { t: 0 };
    an.fsm = "catch"; an.fsmT = 0; an.fsmDur = 2;
  };

  // ---- 空の色（時間帯グラデーション） ----
  const sky = useMemo(() => skyGradient(tt.h), [tt.h]);
  const rainCount = crash ? (crash.weather === "rain" ? 24 : crash.weather === "rain2" ? 40 : crash.weather === "storm" ? 54 : 0) : 0;
  const cloudy = crash && crash.level >= 1;

  // ---- 現在フレームのレンダリング値 ----
  const an = a.current;
  const enterP = an.phase === "enter" ? easeOut(Math.min(1, an.enterT / 1.05)) : 1;
  const scale = 0.34 + 0.66 * enterP;
  const yOff = (1 - enterP) * height * 0.30;
  const petting = an.t < an.petUntil || an.fsm === "hug";
  const sleeping = an.fsm === "sleep";
  const late = slot === "late";
  // その日の寝相（夜ごとに変わる。日付で決めるので同じ日は同じ寝相）。
  const sleepIdx = [...today].reduce((n, c) => n + c.charCodeAt(0), 0) % SLEEP_STYLES.length;
  // 寝たら、その寝相を寝相コレクション（おもいで図鑑）に記録する。
  useEffect(() => {
    if (sleeping) recordMemory(`sleep_${SLEEP_STYLES[sleepIdx]}` as MemoryKind);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sleeping, sleepIdx]);

  // 引っ張りっこの傾き（踏ん張り／のけぞり／前のめり）
  const tugRot = an.tug ? (an.tug.phase === "pull" ? -9 + Math.sin(an.t * 20) * 3 : an.tug.phase === "win" ? -18 : 14) : 0;

  let pose: Pose = "sit";
  if (an.tug) pose = "stand";
  else if (an.phase === "enter" || an.butterfly || an.fsm === "tailChase" || (an.ball && an.ball.st !== "fly") || (an.visitor && (an.visitor.reaction === "chase" || an.visitor.reaction === "sneak"))) pose = "run";
  else if (an.fsm === "sleep") pose = "sleep";
  else if (an.fsm === "sniff") pose = "sniff";
  else if (an.fsm === "stretch" || an.fsm === "wake") pose = "stretch";
  else if (an.fsm === "settleJump" || an.fsm === "catch") pose = "stand";

  let eyes: EyeState = "open";
  if (sleeping) eyes = "closed";
  else if (petting || an.fsm === "hug") eyes = "happy";
  else if (an.star && an.star.t > 1 && an.star.t < 3.4) eyes = "closed"; // 流れ星におねがい
  else if (late) eyes = "sleepy";
  else if (an.t < an.blinkUntil) eyes = "closed";

  let mouth: MouthState = bondLevel(life.bond) >= 4 ? "tongue" : "smile";
  if (an.fsm === "yawn" && an.fsmT < 1.6) mouth = "yawn";
  else if (an.fsm === "catch" && an.bone && an.bone.t > 0.3) mouth = "open";
  else if (an.fsm === "eat") mouth = Math.floor(an.fsmT / 0.22) % 2 ? "open" : "closed";
  else if (petting) mouth = "smile";
  else if (an.proudUntil > an.t) mouth = "tongue";
  else if (sleeping) mouth = "closed";

  // ---- 芸ごとのモーション（見た目をはっきり分ける）----
  let pawLift: { l?: number; r?: number } | undefined;
  let trickHeadTilt = 0;
  let trickShake = 0;
  if (an.fsm === "trick") {
    const tp = an.fsmT;
    switch (an.trickId) {
      case "sit": // 立ってからストンと座る
        pose = tp < 0.4 ? "stand" : "sit";
        eyes = tp > 0.5 ? "happy" : "open";
        mouth = "smile";
        break;
      case "wait": // ぐっと我慢：耳ペタン＋目つむり＋ぷるぷる、最後にほっ
        pose = "sit";
        if (tp < 1.35) { eyes = "closed"; mouth = "closed"; trickShake = Math.sin(an.t * 30) * 2.2; }
        else { eyes = "happy"; mouth = "tongue"; }
        break;
      case "paw": // お手：左前足を上げて差し出す（ちょこちょこ動かす）
        pose = "sit";
        pawLift = { l: 0.62 + Math.sin(tp * 7) * 0.07 };
        eyes = "happy"; mouth = "smile"; trickHeadTilt = 6;
        break;
      case "paw2": // おかわり：右前足を上げる
        pose = "sit";
        pawLift = { r: 0.62 + Math.sin(tp * 7) * 0.07 };
        eyes = "happy"; mouth = "smile"; trickHeadTilt = -6;
        break;
      case "highfive": // ハイタッチ：前足を高く上げてジャンプ
        pose = "sit";
        pawLift = { l: 0.96 + Math.sin(tp * 9) * 0.04 };
        eyes = "happy"; mouth = "tongue";
        break;
      case "ok": // よし！：うれしくてジャンプ
        pose = "stand";
        eyes = "happy"; mouth = "tongue";
        break;
    }
  }

  const wagAmp = sleeping ? 2 : an.fsm === "trick" ? 18 : petting || an.tailSpeedMul > 1.2 ? 16 : 10;
  const tailWag = Math.sin(an.tailPhase * Math.PI) * wagAmp;
  const shake = (an.shakeUntil > an.t ? Math.sin(an.t * 26) * 7 : 0) + trickShake;
  const accessory: Accessory = weekend ? "bandana" : "none";
  const windSway = weather === "wind" && !isMin ? Math.sin(an.t * 3) * 3 : 0; // 強風で毛・体が揺れる
  const houseThresholds = life.houseThresholds && life.houseThresholds.length ? life.houseThresholds : DEFAULT_HOUSE_THRESHOLDS;
  const houseLevel = feat("houseUpgrade") ? houseThresholds.filter((t) => principal >= t).length : -1;
  const moonActive = !!an.moon;

  const dogW = Math.min(210, height * 0.68);
  const bond = life.bond;

  return (
    <div ref={stageRef} style={{ position: "relative", width: "100%", height, overflow: "hidden", borderRadius: "var(--radius-card,24px)", border: "3px solid #F0E0C8", background: sky.bg, transition: "background 1.2s" }}>
      {/* 星（夜） */}
      {sky.stars && !isMin && STARS.map((s2, i) => (
        <span key={i} style={{ position: "absolute", left: `${s2[0]}%`, top: `${s2[1]}%`, width: s2[2], height: s2[2], borderRadius: "50%", background: "#FFF7D6", opacity: 0.9, animation: `twinkle ${2 + (i % 3)}s ease-in-out ${i * 0.4}s infinite` }} />
      ))}
      {/* 満月 */}
      {(sky.stars && isFullMoon()) && (
        <div style={{ position: "absolute", right: "12%", top: "10%", width: 44, height: 44, borderRadius: "50%", background: "#FFF3C4", boxShadow: "0 0 24px 8px rgba(255,243,196,0.5)" }} />
      )}
      {/* 地面 */}
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: "30%", background: sky.ground, transition: "background 1.2s" }} />

      {/* 犬の家（積立累計でグレードアップ・犬の背後） */}
      {houseLevel >= 0 && <HouseBg level={houseLevel} />}

      {/* 曇り・雨（相場のお天気） */}
      {cloudy && <div style={{ position: "absolute", inset: 0, background: "rgba(120,130,150,0.28)", pointerEvents: "none" }} />}
      {rainCount > 0 && !isMin && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
          {Array.from({ length: rainCount }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${(i * 97) % 100}%`, top: `${-20 + (i * 37) % 60}%`, width: 2, height: 14, borderRadius: 2, background: "rgba(255,255,255,0.55)", animation: `rain-fall ${0.5 + ((i * 13) % 7) / 10}s linear ${(i % 9) / 10}s infinite` }} />
          ))}
        </div>
      )}

      {/* 天気：雪（当日が雪のとき、雪の粒＋雪だるま） */}
      {weather === "snow" && !isMin && !cloudy && (
        <>
          <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 2 }}>
            {Array.from({ length: 26 }).map((_, i) => (
              <span key={i} style={{ position: "absolute", left: `${(i * 89) % 100}%`, top: `${-10 + (i * 41) % 70}%`, width: 5, height: 5, borderRadius: "50%", background: "#fff", opacity: 0.9, animation: `rain-fall ${2 + ((i * 7) % 5) / 2}s linear ${(i % 8) / 8}s infinite` }} />
            ))}
          </div>
          <div style={{ position: "absolute", bottom: 8, left: "14%", fontSize: 30, pointerEvents: "none", zIndex: 3 }}>⛄</div>
        </>
      )}

      {/* 遠吠えの夜（満月レア演出）：ふけていく空 */}
      {moonActive && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(20,20,60,0.55)", pointerEvents: "none", transition: "opacity .8s" }}>
          <div style={{ position: "absolute", right: "14%", top: "12%", width: 64, height: 64, borderRadius: "50%", background: "#FFF3C4", boxShadow: "0 0 40px 14px rgba(255,243,196,0.55)" }} />
          <div style={{ position: "absolute", left: "50%", top: "24%", transform: "translateX(-50%)", color: "#FFF7D6", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: 20, animation: "zzz-float 2.4s ease-out infinite" }}>わお〜ん…</div>
        </div>
      )}

      {/* 流れ星 */}
      {an.star && (
        <div style={{ position: "absolute", left: `${86 - an.star.t * 20}%`, top: `${6 + an.star.t * 7}%`, width: 60, height: 3, borderRadius: 3, transform: "rotate(-18deg)", background: "linear-gradient(90deg, rgba(255,255,255,0), #FFF7D6)", opacity: an.star.t < 2 ? 1 : Math.max(0, 1 - (an.star.t - 2)), pointerEvents: "none" }}>
          <span style={{ position: "absolute", right: -6, top: -6, fontSize: 14 }}>⭐</span>
        </div>
      )}

      {/* 朝一番乗り：花びらが舞う */}
      {firstVisitToday && feat("firstVisitDash") && !isMin && an.t < 3.6 && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
          {Array.from({ length: 14 }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${(i * 61) % 100}%`, top: -14, fontSize: 14, animation: `confetti-fall ${2 + (i % 4) * 0.4}s ease-in ${(i % 6) * 0.15}s forwards` }}>🌸</span>
          ))}
        </div>
      )}

      {/* 節目アニメ：1000=虹アーチ / 365=思い出フラッシュ */}
      {milestone === 1000 && (
        <div style={{ position: "absolute", left: "50%", top: "12%", width: 260, height: 130, transform: "translateX(-50%)", borderRadius: "130px 130px 0 0", border: "12px solid transparent", borderImage: "linear-gradient(90deg,#F6A6B8,#F8C471,#A8DBA8,#8EC9EF,#C7A8E8) 1", opacity: 0.8, pointerEvents: "none", zIndex: 5 }} />
      )}
      {milestone === 365 && !isMin && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
          {["🐾", "💛", "🦴", "🌸", "⭐", "🎾"].map((e, i) => (
            <span key={i} style={{ position: "absolute", left: `${12 + i * 14}%`, bottom: "40%", fontSize: 20, animation: `heart-up ${1.6 + (i % 3) * 0.3}s ease-out ${i * 0.2}s infinite` }}>{e}</span>
          ))}
        </div>
      )}

      {/* 週間表彰：メダル */}
      {award && (
        <div style={{ position: "absolute", left: "50%", top: "44%", transform: "translate(-50%,-50%)", fontSize: 40, zIndex: 5, pointerEvents: "none", animation: "pop-in .4s var(--ease-bounce)" }}>🏅</div>
      )}

      {/* 遊びに来る動物 */}
      {an.visitor && (
        <div style={{ position: "absolute", left: `calc(50% + ${(Math.cos(an.visitor.t * 0.9) * 90 - (an.visitor.t > 6 ? (an.visitor.t - 6) * 180 : 0))}px)`, bottom: VISITOR_FLYERS.has(an.visitor.kind) ? `${height * 0.44 + Math.sin(an.visitor.t * 3) * 24}px` : `${18 + Math.abs(Math.sin(an.visitor.t * 5)) * (an.visitor.kind === "bird" ? 30 : 6)}px`, fontSize: VISITOR_FLYERS.has(an.visitor.kind) ? 22 : 26, transform: `scaleX(${Math.sin(an.visitor.t * 0.9) < 0 ? 1 : -1})`, pointerEvents: "none", zIndex: 4, transition: "none" }}>
          {VISITOR_EMOJI[an.visitor.kind]}
        </div>
      )}

      {/* ちょうちょ */}
      {an.butterfly && (
        <div style={{ position: "absolute", left: `calc(50% + ${Math.sin(an.butterfly.t * 1.1) * 90}px)`, bottom: `${height * 0.42 + Math.sin(an.butterfly.t * 3.1) * 26}px`, fontSize: 24, transform: `scaleX(${Math.cos(an.butterfly.t * 1.1) > 0 ? 1 : -1})`, pointerEvents: "none" }}>🦋</div>
      )}

      {/* 双子コーギー */}
      {an.twins && (
        <div style={{ position: "absolute", bottom: 12, left: `calc(50% + ${an.twins.t < 1 ? 160 - an.twins.t * 90 : an.twins.t > 4.6 ? 70 + (an.twins.t - 4.6) * 120 : 70}px)`, width: dogW * 0.8, height: dogW * 0.8 * 0.97, transform: "scaleX(-1)", pointerEvents: "none" }}>
          <LifeCorgi level={Math.max(1, level - 2)} pose={an.twins.t < 1 || an.twins.t > 4.6 ? "run" : "stand"} legPhase={an.twins.t * 2.4} tailWag={Math.sin(an.twins.t * 9) * 14} eyes="happy" mouth="tongue" />
        </div>
      )}

      {/* 紙吹雪（積立記念日） */}
      {confetti && (
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 5 }}>
          {Array.from({ length: animLevel === "soft" ? 12 : 26 }).map((_, i) => (
            <span key={i} style={{ position: "absolute", left: `${(i * 37) % 100}%`, top: -12, width: 8, height: 12, borderRadius: 2, background: ["#F2C14E", "#E2574C", "#7FB069", "#4E97C2", "#F08CA0"][i % 5], animation: `confetti-fall ${1.8 + (i % 5) * 0.3}s ease-in ${(i % 7) * 0.12}s forwards`, transform: `rotate(${i * 47}deg)` }} />
          ))}
        </div>
      )}

      {/* 吹き出し */}
      {bubble && an.t < bubble.until && (
        <div style={{ position: "absolute", top: 44, left: "50%", transform: "translateX(-50%)", maxWidth: "78%", background: bubble.soft ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.96)", padding: bubble.soft ? "7px 13px" : "9px 15px", borderRadius: 18, fontFamily: "var(--font-display)", fontWeight: 700, fontSize: bubble.soft ? "var(--text-xs)" : "var(--text-sm)", color: bubble.soft ? "var(--text-muted)" : "var(--text-strong)", boxShadow: "var(--shadow-sm)", textAlign: "center", lineHeight: 1.45, zIndex: 7, animation: "pop-in .3s var(--ease-bounce)", opacity: bubble.soft ? 0.85 : 1 }}>
          {bubble.text}
          <span style={{ position: "absolute", bottom: -7, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "8px solid transparent", borderRight: "8px solid transparent", borderTop: `8px solid ${bubble.soft ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.96)"}` }} />
        </div>
      )}

      {/* コーギー本体 */}
      <div
        onClick={onDogTap}
        style={{ position: "absolute", left: "50%", bottom: 10 + yOff, width: dogW, height: dogW * 0.97, transform: `translateX(-50%) translateX(${an.xOff}px) scale(${scale}) rotate(${an.spin % 360}deg)`, transformOrigin: "50% 88%", cursor: "pointer", zIndex: 3, filter: moonActive ? "brightness(0.65)" : undefined }}
      >
        <div style={{ width: "100%", height: "100%", transform: `scaleX(${an.dir}) rotate(${shake + tugRot + windSway}deg)` }}>
          <LifeCorgi
            level={level} pose={pose}
            legPhase={an.legPhase + an.t * (pose === "run" ? 2.4 : 0)}
            tailWag={tailWag} eyes={eyes} mouth={mouth}
            earTwitchL={an.earLT > 0 ? Math.sin(an.t * 40) * 8 : 0}
            earDown={an.earDownUntil > an.t}
            lift={an.lift} sleepStyle={sleepIdx}
            accessory={accessory} outfit={outfit} raincoat={weather === "rain" && !cloudy}
            proud={an.proudUntil > an.t} blush={petting}
            silhouette={moonActive}
            headTilt={an.fsm === "hug" ? 6 : trickHeadTilt}
            pawLift={pawLift}
          />
        </div>
        {/* 頭部のなでなでエリア（上半分・44px以上） */}
        <div
          onPointerDown={onHeadDown} onPointerMove={onHeadMove} onPointerUp={onHeadUp} onPointerCancel={onHeadUp}
          style={{ position: "absolute", left: "8%", top: "-6%", width: "84%", height: "58%", touchAction: "none", borderRadius: "50%" }}
        />
        {/* ハートパーティクル */}
        {hearts.map((h) => (
          <span key={h.id} style={{ position: "absolute", left: `${h.x}%`, top: `${h.y}%`, fontSize: h.s, pointerEvents: "none", animation: `heart-up ${h.big ? 1.4 : 1.1}s ease-out forwards` }}>
            {h.big ? "💖" : "💛"}
          </span>
        ))}
        {/* ねむり Zzz */}
        {sleeping && (
          <div style={{ position: "absolute", right: "-4%", top: "-14%", pointerEvents: "none" }}>
            {[0, 1, 2].map((i) => (
              <span key={i} style={{ position: "absolute", right: i * 14, top: -i * 12, fontSize: 15 + i * 5, color: "#7B84C4", fontWeight: 900, fontFamily: "var(--font-display)", animation: `zzz-float 2.6s ease-out ${i * 0.7}s infinite` }}>Z</span>
            ))}
          </div>
        )}
      </div>

      {/* おやつのほね（ボタンからコーギーへ放物線で飛ぶ） */}
      {an.bone && (
        <div style={{ position: "absolute", right: "14%", bottom: 44, transform: `translate(${-(an.bone.t / 0.6) * 120}px, ${-Math.sin((an.bone.t / 0.6) * Math.PI) * 90}px) rotate(${an.bone.t * 600}deg)`, fontSize: 26, pointerEvents: "none", zIndex: 4 }}>🦴</div>
      )}

      {/* 今日の気分（控えめ・右上、ハートゲージの左） */}
      {mood && (
        <div style={{ position: "absolute", top: 10, right: 66, display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.72)", borderRadius: 999, padding: "4px 8px", zIndex: 6 }}>
          <span style={{ fontSize: 12 }}>{moodMeta(mood).emoji}</span>
          <span style={{ fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 10, color: "var(--text-brand)" }}>{moodMeta(mood).label}</span>
        </div>
      )}

      {/* なつき度ハートゲージ（控えめ・右上） */}
      <div style={{ position: "absolute", top: 10, right: 10, display: "flex", alignItems: "center", gap: 5, background: "rgba(255,255,255,0.72)", borderRadius: 999, padding: "4px 9px", zIndex: 6 }}>
        <div style={{ position: "relative", width: 15, height: 14, fontSize: 14, lineHeight: "14px" }}>
          <span style={{ position: "absolute", inset: 0, filter: "grayscale(1)", opacity: 0.4 }}>❤️</span>
          <span style={{ position: "absolute", inset: 0, clipPath: `inset(${100 - bond}% 0 0 0)` }}>❤️</span>
        </div>
        <span style={{ fontFamily: "var(--font-number)", fontWeight: 800, fontSize: 11, color: "var(--text-brand)" }}>{bond}</span>
      </div>

      {/* おやつボタン（1日3回・0時リセット） */}
      <div style={{ position: "absolute", bottom: 10, right: 10, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, zIndex: 6 }}>
        <button
          type="button" onClick={giveTreat} disabled={left <= 0}
          aria-label="おやつをあげる"
          style={{ width: 52, height: 52, borderRadius: "50%", border: "2px solid #F0E0C8", background: left > 0 ? "rgba(255,255,255,0.92)" : "rgba(255,255,255,0.55)", fontSize: 24, cursor: left > 0 ? "pointer" : "default", boxShadow: "var(--shadow-sm)", opacity: left > 0 ? 1 : 0.6, WebkitTapHighlightColor: "transparent" }}
        >
          {left > 0 ? "🦴" : "😊"}
        </button>
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.72)", borderRadius: 999, padding: "2px 6px" }}>
          {Array.from({ length: TREATS_PER_DAY }).map((_, i) => (
            <span key={i} style={{ fontSize: 9, opacity: i < left ? 1 : 0.25, filter: i < left ? "none" : "grayscale(1)" }}>🦴</span>
          ))}
        </div>
      </div>

      {/* 相場の天気メーター（下落中のみ・控えめ） */}
      {cloudy && crash && (
        <div style={{ position: "absolute", bottom: 10, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 3, background: "rgba(255,255,255,0.72)", borderRadius: 999, padding: "3px 8px", zIndex: 6, fontSize: 11, fontFamily: "var(--font-body)", fontWeight: 700, color: "var(--text-muted)" }}>
          {crash.label} {crash.dd.toFixed(1)}%
        </div>
      )}

      {/* きせかえボタン（左上・控えめ） */}
      {feat("dressUp") && (
        <button type="button" onClick={() => setCloset(true)} aria-label="きせかえ"
          style={{ position: "absolute", top: 8, left: 8, width: 40, height: 40, borderRadius: "50%", border: "2px solid #F0E0C8", background: "rgba(255,255,255,0.85)", fontSize: 20, cursor: "pointer", boxShadow: "var(--shadow-sm)", zIndex: 6, WebkitTapHighlightColor: "transparent" }}>
          👕
        </button>
      )}

      {/* ブラシボタン */}
      {feat("brushing") && (
        <button type="button" onClick={() => { setBrushMode((v) => !v); setBrushCount(0); brushLastPt.current = null; }} aria-label="ブラッシング"
          style={{ position: "absolute", top: 54, left: 8, width: 40, height: 40, borderRadius: "50%", border: "2px solid " + (brushMode ? "var(--brand)" : "#F0E0C8"), background: brushMode ? "var(--brand-soft)" : "rgba(255,255,255,0.85)", fontSize: 19, cursor: "pointer", boxShadow: "var(--shadow-sm)", zIndex: 6, WebkitTapHighlightColor: "transparent" }}>
          🪮
        </button>
      )}

      {/* 芸ボタン */}
      {feat("tricks") && (
        <button type="button" onClick={() => setTricks(true)} aria-label="げいをおしえる"
          style={{ position: "absolute", top: 192, left: 8, width: 40, height: 40, borderRadius: "50%", border: "2px solid #F0E0C8", background: "rgba(255,255,255,0.85)", fontSize: 19, cursor: "pointer", boxShadow: "var(--shadow-sm)", zIndex: 6, WebkitTapHighlightColor: "transparent" }}>
          🎓
        </button>
      )}
      {tricks && <TrickSheet life={life} onClose={() => setTricks(false)} onTrick={doTrick} />}
      {trickToast && (
        <div style={{ position: "absolute", top: "42%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--brand)", color: "#fff", fontFamily: "var(--font-display)", fontWeight: 900, fontSize: "var(--text-sm)", padding: "10px 16px", borderRadius: 16, boxShadow: "var(--shadow-md)", zIndex: 8, textAlign: "center", animation: "pop-in .3s var(--ease-bounce)", pointerEvents: "none", maxWidth: "80%" }}>
          🎉 {trickToast}
        </div>
      )}

      {/* 引っ張りっこボタン */}
      {feat("tugOfWar") && (
        <button type="button" onClick={startTug} aria-label="ひっぱりっこ" disabled={!!an.tug || !!an.ball}
          style={{ position: "absolute", top: 146, left: 8, width: 40, height: 40, borderRadius: "50%", border: "2px solid " + (an.tug ? "var(--brand)" : "#F0E0C8"), background: an.tug ? "var(--brand-soft)" : "rgba(255,255,255,0.85)", fontSize: 19, cursor: (an.tug || an.ball) ? "default" : "pointer", opacity: (an.tug || an.ball) ? 0.5 : 1, boxShadow: "var(--shadow-sm)", zIndex: 6, WebkitTapHighlightColor: "transparent" }}>
          🪢
        </button>
      )}

      {/* つなひきのロープ（引き合い中） */}
      {an.tug && an.tug.phase === "pull" && (
        <div style={{ position: "absolute", left: "50%", bottom: 30, width: 90, height: 8, background: "linear-gradient(90deg,#C77F35,#9A551C)", borderRadius: 6, transform: `translateX(calc(-50% + ${an.xOff}px)) rotate(${Math.sin(an.t * 20) * 4}deg)`, transformOrigin: "left center", zIndex: 4, pointerEvents: "none", boxShadow: "0 1px 2px rgba(0,0,0,0.2)" }} />
      )}

      {/* ボールボタン */}
      {feat("ballPlay") && (
        <button type="button" onClick={armBall} aria-label="ボールであそぶ" disabled={!!an.ball || ballArmed}
          style={{ position: "absolute", top: 100, left: 8, width: 40, height: 40, borderRadius: "50%", border: "2px solid " + (ballArmed ? "var(--brand)" : "#F0E0C8"), background: ballArmed ? "var(--brand-soft)" : "rgba(255,255,255,0.85)", fontSize: 19, cursor: an.ball ? "default" : "pointer", opacity: an.ball ? 0.5 : 1, boxShadow: "var(--shadow-sm)", zIndex: 6, WebkitTapHighlightColor: "transparent" }}>
          🎾
        </button>
      )}

      {/* 飛んでいる/追われているボール */}
      {an.ball && (
        <div style={{ position: "absolute", left: an.ball.x, top: an.ball.y, transform: "translate(-50%,-50%)", fontSize: 22, pointerEvents: "none", zIndex: 4 }}>🎾</div>
      )}

      {/* ボールを構えているときのフリック操作オーバーレイ */}
      {ballArmed && (
        <div onPointerDown={onFlingDown} onPointerMove={onFlingMove} onPointerUp={onFlingUp} onPointerCancel={onFlingUp}
          style={{ position: "absolute", inset: 0, zIndex: 7, touchAction: "none", cursor: "grab" }}>
          <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", borderRadius: 999, padding: "4px 12px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 11, color: "var(--text-brand)", pointerEvents: "none" }}>
            フリックで なげてね
          </div>
          {flingBall && (
            <div style={{ position: "absolute", left: flingBall.x, top: flingBall.y, transform: "translate(-50%,-50%)", fontSize: 24, pointerEvents: "none" }}>🎾</div>
          )}
        </div>
      )}

      {/* ボールめいじんバッジ（連続キャッチ中の控えめ表示） */}
      {an.ball && an.ballCombo >= 1 && (
        <div style={{ position: "absolute", top: 8, left: 54, background: "rgba(255,255,255,0.8)", borderRadius: 999, padding: "2px 8px", fontFamily: "var(--font-number)", fontWeight: 800, fontSize: 11, color: "var(--text-brand)", zIndex: 6, pointerEvents: "none" }}>
          🎾 {an.ballCombo}
        </div>
      )}

      {/* ブラシモードの操作オーバーレイ＋毛パーティクル */}
      {brushMode && (
        <div onPointerMove={onBrushMove} onPointerUp={onBrushUp} onPointerCancel={onBrushUp} onPointerLeave={onBrushUp}
          style={{ position: "absolute", inset: 0, zIndex: 5, touchAction: "none", cursor: "grab" }}>
          <div style={{ position: "absolute", top: 8, left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", borderRadius: 999, padding: "4px 12px", fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 11, color: "var(--text-brand)", pointerEvents: "none" }}>
            ブラシで こすってね（{brushCount}/20）
          </div>
          {furs.map((f) => (
            <span key={f.id} style={{ position: "absolute", left: `${f.x}%`, top: `${f.y}%`, fontSize: 12, pointerEvents: "none", animation: "heart-up 0.9s ease-out forwards" }}>🤎</span>
          ))}
        </div>
      )}

      {jackpot && <JackpotSlot amount={jackpot.amount} kind={jackpot.kind} onDone={() => setJackpot(null)} />}

      {closet && (
        <ClosetSheet
          life={life} setLife={setLife}
          onClose={() => setCloset(false)}
          onWear={celebrateOutfit}
        />
      )}
    </div>
  );
}

// 犬の家（グレード0=段ボール / 1=犬小屋 / 2=洋風ハウス / 3=庭付き豪邸）。犬の背後・左下に置く。
function HouseBg({ level }: { level: number }) {
  const OL = "#7A5230";
  return (
    <div style={{ position: "absolute", left: "3%", bottom: "2%", width: 80, height: 56, zIndex: 1, pointerEvents: "none" }}>
      <svg viewBox="0 0 120 100" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
        {level === 0 && (
          <g stroke={OL} strokeWidth="3" strokeLinejoin="round">
            <path d="M22 96 L22 58 L98 58 L98 96 Z" fill="#D9B382" />
            <path d="M22 58 L34 46 L86 46 L98 58 Z" fill="#E9C79B" />
            <ellipse cx="60" cy="86" rx="16" ry="12" fill="#8A6A44" />
            <path d="M40 58 L40 96 M80 58 L80 96" stroke="#B89468" strokeWidth="2" />
          </g>
        )}
        {level === 1 && (
          <g stroke={OL} strokeWidth="3" strokeLinejoin="round">
            <path d="M24 96 L24 56 L96 56 L96 96 Z" fill="#E3A857" />
            <path d="M16 58 L60 26 L104 58 Z" fill="#C77F35" />
            <ellipse cx="60" cy="82" rx="16" ry="18" fill="#5C4434" />
            <rect x="55" y="30" width="10" height="10" fill="#FBEAD0" stroke={OL} strokeWidth="2" />
          </g>
        )}
        {level === 2 && (
          <g stroke={OL} strokeWidth="3" strokeLinejoin="round">
            <path d="M22 96 L22 54 L98 54 L98 96 Z" fill="#FBEAD0" />
            <path d="M14 56 L60 22 L106 56 Z" fill="#E2574C" />
            <rect x="80" y="30" width="10" height="20" fill="#B14834" />
            <rect x="50" y="66" width="20" height="30" fill="#9A551C" />
            <circle cx="60" cy="82" r="2" fill="#F2C14E" />
            <rect x="30" y="64" width="14" height="14" fill="#BFE3F0" stroke={OL} strokeWidth="2" />
            <rect x="76" y="64" width="14" height="14" fill="#BFE3F0" stroke={OL} strokeWidth="2" />
          </g>
        )}
        {level >= 3 && (
          <g stroke={OL} strokeWidth="3" strokeLinejoin="round">
            <ellipse cx="24" cy="92" rx="16" ry="8" fill="#7FB069" />
            <path d="M24 88 L24 66 M18 74 Q24 62 30 74" fill="none" stroke="#4E7A3F" strokeWidth="3" />
            <path d="M14 96 L14 50 L106 50 L106 96 Z" fill="#FFF6EA" />
            <path d="M8 52 L60 18 L112 52 Z" fill="#B14834" />
            <path d="M60 18 L60 8 L70 8 L70 24" fill="#F2C14E" stroke={OL} strokeWidth="2" />
            <rect x="52" y="70" width="18" height="26" fill="#9A551C" />
            <rect x="24" y="60" width="14" height="14" fill="#BFE3F0" stroke={OL} strokeWidth="2" />
            <rect x="82" y="60" width="14" height="14" fill="#BFE3F0" stroke={OL} strokeWidth="2" />
            <path d="M14 50 L106 50" stroke="#F2C14E" strokeWidth="3" />
          </g>
        )}
      </svg>
    </div>
  );
}

// 夜空の星の位置（%x, %y, size）
const STARS: [number, number, number][] = [
  [8, 12, 3], [18, 6, 2], [30, 16, 2], [44, 8, 3], [58, 14, 2],
  [70, 6, 2], [82, 18, 3], [92, 9, 2], [24, 26, 2], [64, 24, 2], [50, 22, 2], [12, 30, 2],
];

// 時間帯で変わる空と地面の色
function skyGradient(h: number): { bg: string; ground: string; stars: boolean } {
  if (h >= 5 && h < 8) return { bg: "linear-gradient(#FDD9C0 0%, #FBE9D0 55%, #FDEFD6 100%)", ground: "linear-gradient(#CBDFA8, #B9CF92)", stars: false }; // 朝焼け
  if (h >= 8 && h < 16) return { bg: "linear-gradient(#BFE3F0 0%, #DCF0F8 55%, #F3F7E9 100%)", ground: "linear-gradient(#C4E0A0, #AFCF88)", stars: false }; // 昼
  if (h >= 16 && h < 19) return { bg: "linear-gradient(#F6B48C 0%, #FBD3A8 55%, #FDE7C4 100%)", ground: "linear-gradient(#C0CD8E, #A9B97C)", stars: false }; // 夕焼け
  if (h >= 19 && h < 23) return { bg: "linear-gradient(#3E4C86 0%, #5A639E 60%, #7B84C4 100%)", ground: "linear-gradient(#5E7057, #4C5C48)", stars: true }; // 夜
  return { bg: "linear-gradient(#252C52 0%, #3B4478 60%, #565FA0 100%)", ground: "linear-gradient(#48543F, #3A4634)", stars: true }; // 深夜
}
