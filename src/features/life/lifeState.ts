// 「生きているコーギー」レイヤーの状態。既存の積立データ（orucogi_personal_v1）とは
// 別キーで保存し、既存機能を壊さない。バージョンキーを持ち将来のマイグレーションに備える。
import { dayKey, diffDays } from "./time";

export type RareKind = "butterfly" | "star" | "twins" | "moon" | "rainbow";

// 遊びに来る動物。ねこ・ことりに加え、りす・はりねずみ・かえる・てんとうむしも来る。
export type VisitorKind = "cat" | "bird" | "butterfly" | "squirrel" | "hedgehog" | "frog" | "ladybug";

// 寝相コレクション。夜ごとに変わり、はじめて見た寝相はおもいで図鑑に集まる。
export const SLEEP_STYLES = ["curl", "flat", "side", "ball", "loose"] as const;
export type SleepStyle = typeof SLEEP_STYLES[number];
export const SLEEP_LABEL: Record<SleepStyle, string> = {
  curl: "まるまり ねんね", flat: "ぺたんこ ねんね", side: "よこむき ねんね",
  ball: "まんまる ねんね", loose: "だらり ねんね",
};

// おもいで図鑑に残る出来事。レア演出・遊びに来た動物（来訪）・寝相を記録する。
export type MemoryKind = RareKind | `visit_${VisitorKind}` | `sleep_${SleepStyle}`;

export interface Memory {
  day: string;      // YYYY-MM-DD
  kind: MemoryKind;
}

// その日の出来事の記録。日記の材料になる。
export interface DayStats {
  day: string;
  pets: number;              // 撫でた回数
  hugs: number;              // ぎゅ〜の回数
  treats: number;            // おやつの数（0-3）
  rare: RareKind | null;     // 発生したレア演出
  market: "up" | "down" | "flat" | null; // 前回訪問比
  settle: boolean;           // 積立記念日だったか
  bond: number;              // その日のなつき度（終値）
}

export type AnimLevel = "full" | "soft" | "min";

export const SCHEMA_VERSION = 12;

// 犬の家グレードの既定しきい値（積立累計額）。設定で変更可能。
export const DEFAULT_HOUSE_THRESHOLDS = [500000, 2000000, 5000000];

// 呼び名につける敬称。ちゃん／くん／なし（呼び捨て）から選べる。
export type Honorific = "chan" | "kun" | "none";

export interface LifeState {
  v: number;                  // スキーマバージョン
  name: string | null;        // 呼び名（オンボーディングで設定）
  honorific: Honorific;       // 敬称（ちゃん／くん／なし）
  onboarded: boolean;
  bond: number;               // なつき度 0-100
  bondPetToday: number;       // きょう撫でて増えたなつき度（上限10）
  petTotal: number;           // なでなで貯金（累計）
  petThankedAt: number;       // 100回ごとのお礼を言った直近の百の位
  hugTotal: number;
  treatTotal: number;
  today: DayStats;
  history: DayStats[];        // 過去の日ごとの記録（最大400日）
  visitDayCount: number;      // 会った日数（累計）
  streak: number;             // 連続ログイン日数
  lastVisitDay: string | null;
  sadReunion: boolean;        // 3日以上ぶりの再会（しょんぼり出迎えに使い、消費する）
  lastSeenValue: number | null; // 前回訪問時の評価額
  settleDay: number | null;   // 毎月の積立日（1-31、null=未設定）
  lastSettleMonth: string | null; // 積立お祝いをした月 "YYYY-MM"
  rareRolledDay: string | null;   // レア抽選を行った日
  todayRare: RareKind | null;     // きょう当選したレア演出
  memories: Memory[];         // おもいで図鑑
  usedLines: { id: string; day: string }[]; // 旧v1エンジンの重複回避用（後方互換）
  animLevel: AnimLevel | null; // null = 端末設定（prefers-reduced-motion）に従う
  // ---- v2: DialogueEngine v2 ----
  usedLinesV2: { id: string; day: string }[]; // 30日重複回避（上限2,000 LRU）
  pendingTomorrow: { day: string } | null;    // 明日の予告→翌日フォローアップ
  // ---- v3: Part B グループA（遊び） ----
  wardrobe: { collar: string | null; bandana: string | null; hat: string | null; shirt: string | null }; // 着せ替え装着中
  ballBestCombo: number;                 // ボール連続キャッチの最高記録
  trickMastery: Record<string, number>;  // 芸ごとの成功回数（習熟度）
  lastBrushDay: string | null;           // ブラッシングでなつき度+1した最後の日
  // ---- v4: 遊びに来る動物 ----
  visitorRolledDay: string | null;       // 来訪動物の抽選をした日
  todayVisitor: VisitorKind | null;      // きょう来る動物
  // ---- v5: サウンド ----
  soundOn: boolean;                      // 効果音のON/OFF（既定OFF）
  soundVol: number;                      // 音量 0〜1
  // ---- v6: グループC（演出） ----
  houseThresholds: number[];             // 家グレードのしきい値（積立累計額）3段
  lastHouseLevel: number;                // 前回の家グレード（進化演出の判定用）
  milestoneShownAt: number;              // 最後に祝った節目の来訪日数
  // ---- v7: ゾロ目スロット ----
  jackpotShownValue: number;             // 最後にスロット演出を出した金額（重複防止）
  // ---- v8: グループD（蓄積） ----
  goalAmount: number;                    // 目標額（お散歩マップ）
  goalReached: number[];                 // 到達済みランドマーク（10,20,…100）
  diaryReplies: Record<string, string>;  // 交換日記の返信（day→本文）
  diaryReplyThanksDay: string | null;    // お返事のお礼を言う日
  lettersOpened: string[];               // 開封した月の手紙 "YYYY-MM"
  awards: { week: string; kind: string; label: string }[]; // 週間表彰の履歴
  lastAwardWeek: string | null;          // 最後に表彰した週
  // ---- v11: きょうのおねがい（1日ミッション） ----
  playedDay: string | null;              // きょう遊んだ（ボール/芸/つなひき/ブラシ）最後の日
  missionCheeredDay: string | null;      // ミッション達成を犬が喜んだ最後の日
  // ---- v12: 不在シミュレーション（るすばん日記） ----
  pendingAbsence: number | null;         // 前回来訪からの空き日数（2以上で、おかえりカードで消費）
}

const KEY = "oruduck_life_v1";

const emptyDay = (day: string, bond: number): DayStats => ({
  day, pets: 0, hugs: 0, treats: 0, rare: null, market: null, settle: false, bond,
});

export function defaultLife(): LifeState {
  return {
    v: SCHEMA_VERSION, name: null, honorific: "chan", onboarded: false,
    bond: 0, bondPetToday: 0, petTotal: 0, petThankedAt: 0, hugTotal: 0, treatTotal: 0,
    today: emptyDay(dayKey(), 0), history: [],
    visitDayCount: 0, streak: 0, lastVisitDay: null, sadReunion: false,
    lastSeenValue: null, settleDay: null, lastSettleMonth: null,
    rareRolledDay: null, todayRare: null,
    memories: [], usedLines: [], animLevel: null,
    usedLinesV2: [], pendingTomorrow: null,
    wardrobe: { collar: null, bandana: null, hat: null, shirt: null },
    ballBestCombo: 0, trickMastery: {}, lastBrushDay: null,
    visitorRolledDay: null, todayVisitor: null,
    soundOn: false, soundVol: 0.5,
    houseThresholds: [...DEFAULT_HOUSE_THRESHOLDS], lastHouseLevel: 0, milestoneShownAt: 0,
    jackpotShownValue: 0,
    goalAmount: 1000000, goalReached: [], diaryReplies: {}, diaryReplyThanksDay: null,
    lettersOpened: [], awards: [], lastAwardWeek: null,
    playedDay: null, missionCheeredDay: null,
    pendingAbsence: null,
  };
}

// るすばん日記：留守中の1日ごとの過ごし方。空き日数と犬の名前で決まり、
// 同じ不在なら毎回おなじ内容になる（seed=空き日数）。さみしさは日数で強まる。
const ABSENCE_ACTS = [
  "まどの そとを みて、{name}を まってたよ",
  "おきにいりの ばしょで まるくなって おひるね",
  "ボールを ころがして ひとりあそび してた",
  "ごはんの じかん、まだかな〜って そわそわ",
  "ゆめのなかで {name}と かけっこ してた",
  "ドアの おとが するたび、きたかも！って みにいった",
  "ひなたぼっこ しながら {name}の こと かんがえてた",
  "おもちゃを ぜんぶ ならべて てんけん してた",
];
const ABSENCE_LONELY = [
  "ちょっぴり さみしくて、くんくん ないちゃった",
  "まくらに くっついて、{name}の におい さがしてた",
  "ずっと ドアの まえで まってた…",
];

export function absenceDiary(name: string, days: number): string[] {
  const n = Math.max(2, Math.min(days, 7));
  const out: string[] = [];
  for (let i = 0; i < n; i++) {
    // 3日以上あくと、後半にさみしいエピソードを混ぜる
    const lonely = days >= 3 && i >= n - 2 && i % 2 === 1;
    const pool = lonely ? ABSENCE_LONELY : ABSENCE_ACTS;
    const pick = pool[(i * 3 + days) % pool.length];
    out.push(pick.replaceAll("{name}", name));
  }
  return out;
}

// 「きょうのおねがい」= 犬から毎日ねだる3つのお世話。既存の1日カウンタから導出する
// ので専用の保存領域は要らない（撫でた回数・遊んだか・おやつ）。
export interface MissionTask {
  key: "pet" | "play" | "treat";
  label: string;
  emoji: string;
  done: number;
  goal: number;
}

export const PET_MISSION_GOAL = 5;

export function dailyMission(s: LifeState): MissionTask[] {
  const today = dayKey();
  return [
    { key: "pet", label: "なでなで", emoji: "🖐️", done: Math.min(s.today.pets, PET_MISSION_GOAL), goal: PET_MISSION_GOAL },
    { key: "play", label: "あそぶ", emoji: "🎾", done: s.playedDay === today ? 1 : 0, goal: 1 },
    { key: "treat", label: "おやつ", emoji: "🦴", done: Math.min(s.today.treats, 1), goal: 1 },
  ];
}

export const missionCleared = (s: LifeState) => dailyMission(s).every((t) => t.done >= t.goal);
export const missionCount = (s: LifeState) => dailyMission(s).filter((t) => t.done >= t.goal).length;

// きょう遊んだ印をつける（ボール・芸・つなひき・ブラシ共通）
export function markPlayed(s: LifeState): LifeState {
  const today = dayKey();
  return s.playedDay === today ? s : { ...s, playedDay: today };
}

// ゾロ目（全桁同じ）／キリ番（100万円単位）の判定
export function jackpotKind(n: number): "zorome" | "kiriban" | null {
  if (!n || n < 100000) return null;
  const s = String(Math.round(n));
  if (s.length >= 3 && /^(\d)\1+$/.test(s)) return "zorome";
  if (n % 1000000 === 0) return "kiriban";
  return null;
}

// 旧バージョンの保存データを最新スキーマへ。欠けているフィールドは
// defaultLife() の既定値で埋まる（スプレッドの順で d が優先されるため）。
export function migrateLife(d: Partial<LifeState>): LifeState {
  const merged = { ...defaultLife(), ...d, v: SCHEMA_VERSION };
  // 虹色の日は廃止。保存済みの虹色状態は通常色に戻す。
  if (merged.todayRare === "rainbow") merged.todayRare = null;
  // 敬称は3種のいずれか。未知の値は「ちゃん」に寄せる。
  if (merged.honorific !== "chan" && merged.honorific !== "kun" && merged.honorific !== "none") merged.honorific = "chan";
  // 着せ替えスロットに shirt を追加（旧データには無い）。欠けたスロットは null で補う。
  const w = (merged.wardrobe || {}) as Partial<LifeState["wardrobe"]>;
  merged.wardrobe = { collar: w.collar ?? null, bandana: w.bandana ?? null, hat: w.hat ?? null, shirt: w.shirt ?? null };
  return merged;
}

export function loadLife(): LifeState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return migrateLife(JSON.parse(raw) as Partial<LifeState>);
  } catch { /* 壊れていたら初期状態から */ }
  return defaultLife();
}

export function saveLife(s: LifeState) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* ignore */ }
}

export const clampBond = (b: number) => Math.max(0, Math.min(100, b));

// なつき度の段階（1-4）
export function bondLevel(bond: number): 1 | 2 | 3 | 4 {
  if (bond >= 90) return 4;
  if (bond >= 60) return 3;
  if (bond >= 30) return 2;
  return 1;
}

// 段階に応じた呼び方。{name} プレースホルダはこれで置換される。
export function callName(s: Pick<LifeState, "name" | "bond" | "honorific">): string {
  const lv = bondLevel(s.bond);
  const base = s.name && s.name.trim() ? s.name.trim() : null;
  if (!base) return "きみ";
  const named = withHonorific(base, s.honorific);
  if (lv <= 2) return named;
  return `だいすきな${named}`;
}

// 呼び名に敬称をつける。すでに敬称がついている名前には二重付けしない。
export function withHonorific(name: string, h: Honorific = "chan"): string {
  const n = name.trim();
  if (/(ちゃん|くん|さん|さま)$/.test(n)) return n; // 入力に敬称が含まれていればそのまま
  if (h === "kun") return `${n}くん`;
  if (h === "none") return n;
  return `${n}ちゃん`;
}

// アプリを開いたときの来訪処理。日をまたいでいたら昨日までの記録を確定し、
// 連続日数・なつき度（毎日+3 / 3日以上あかないと-5）を更新する。
export function beginVisit(s: LifeState, now = Date.now()): LifeState {
  const today = dayKey(now);
  if (s.lastVisitDay === today) return s; // きょう2回目以降は何もしない

  const next: LifeState = { ...s, today: { ...s.today }, history: [...s.history] };

  // 前回分の日記録をアーカイブ
  if (next.today.day !== today) {
    if (next.today.day && next.lastVisitDay === next.today.day) {
      next.history = [...next.history, next.today].slice(-400);
    }
    next.today = emptyDay(today, next.bond);
  }

  if (next.lastVisitDay) {
    const gap = diffDays(today, next.lastVisitDay);
    if (gap >= 2) next.pendingAbsence = gap; // るすばん日記を出す
    if (gap >= 3) {
      next.bond = clampBond(next.bond - 5);
      next.sadReunion = true;
      next.streak = 1;
    } else if (gap === 1) {
      next.streak = next.streak + 1;
    } else if (gap > 1) {
      next.streak = 1;
    }
  } else {
    next.streak = 1;
  }

  next.bond = clampBond(next.bond + 3); // 毎日の来訪ボーナス
  next.bondPetToday = 0;
  next.visitDayCount += 1;
  next.lastVisitDay = today;
  next.today.bond = next.bond;
  // セリフ履歴は3日で失効するので古いものを掃除
  next.usedLines = next.usedLines.filter((u) => diffDays(today, u.day) < 3);
  return next;
}

// 撫でた（なつき度は1日+10まで）
export function applyPet(s: LifeState): LifeState {
  const canBond = s.bondPetToday < 10;
  return {
    ...s,
    petTotal: s.petTotal + 1,
    bond: canBond ? clampBond(s.bond + 1) : s.bond,
    bondPetToday: canBond ? s.bondPetToday + 1 : s.bondPetToday,
    today: { ...s.today, pets: s.today.pets + 1, bond: canBond ? clampBond(s.bond + 1) : s.bond },
  };
}

export function applyHug(s: LifeState): LifeState {
  return { ...s, hugTotal: s.hugTotal + 1, today: { ...s.today, hugs: s.today.hugs + 1 } };
}

// おやつ（1日3回、なつき度+2）
export const TREATS_PER_DAY = 3;
export const treatsLeft = (s: LifeState) => TREATS_PER_DAY - s.today.treats;

export function applyTreat(s: LifeState): LifeState {
  if (treatsLeft(s) <= 0) return s;
  const bond = clampBond(s.bond + 2);
  return {
    ...s, bond, treatTotal: s.treatTotal + 1,
    today: { ...s.today, treats: s.today.treats + 1, bond },
  };
}
