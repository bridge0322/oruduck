// フィーチャーフラグ。問題が出た機能を個別に切れるようにする。
// ?debug=1 のデバッグパネルからも一時的に上書きできる（localStorage 非保存）。
export interface Features {
  // Part A
  dialoguesV2: boolean;      // 2,000本セリフ＋条件マッチングエンジン
  // グループA: 遊び
  dressUp: boolean;          // 着せ替えコレクション
  ballPlay: boolean;         // ボール遊び
  tugOfWar: boolean;         // 引っ張りっこ
  tricks: boolean;           // 芸を教える
  brushing: boolean;         // ブラッシング
  // グループB: 生命感
  moodSystem: boolean;       // 今日の気分
  sound: boolean;            // サウンド（既定OFF）
  weather: boolean;          // 天気連動（Open-Meteo）
  sleeptalk: boolean;        // 寝言
  visitors: boolean;         // 遊びに来る動物
  // グループC: 演出
  firstVisitDash: boolean;   // 朝一番乗り
  jackpotSlot: boolean;      // ゾロ目スロット
  milestoneAnim: boolean;    // 節目の隠しアニメ
  houseUpgrade: boolean;     // 犬の家グレードアップ
  graphWalk: boolean;        // 資産グラフ散歩道
  // グループD: 蓄積
  goalMap: boolean;          // 目標進捗お散歩マップ
  monthlyLetter: boolean;    // 犬からの月1手紙
  tomorrowPreview: boolean;  // 明日の予告
  exchangeDiary: boolean;    // 交換日記
  weeklyAward: boolean;      // 週1がんばったで賞
}

export const FEATURES: Features = {
  dialoguesV2: true,
  dressUp: true,
  ballPlay: true,
  tugOfWar: true,
  tricks: true,
  brushing: true,
  moodSystem: true,
  sound: false,       // 音は既定OFF（設定でON）
  weather: true,
  sleeptalk: true,
  visitors: true,
  firstVisitDash: true,
  jackpotSlot: true,
  milestoneAnim: true,
  houseUpgrade: true,
  graphWalk: true,
  goalMap: true,
  monthlyLetter: true,
  tomorrowPreview: true,
  exchangeDiary: true,
  weeklyAward: true,
};

// デバッグ用の一時上書き（?debug=1 パネルから）。
const overrides: Partial<Features> = {};
export function setFeature<K extends keyof Features>(k: K, v: Features[K]) { overrides[k] = v; }
export function feat<K extends keyof Features>(k: K): Features[K] {
  return (k in overrides ? overrides[k] : FEATURES[k]) as Features[K];
}
