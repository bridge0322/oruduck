export interface Record_ {
  t: number;
  principal: number;
  value: number;
  // 口数モードで記録した場合の内訳。評価額は units × nav / 10000 で自動計算される。
  // 保有口数はほぼ変わらないので、日々の更新は基準価額(nav)だけ書き換えれば済む＝OCR不要。
  units?: number;   // 保有口数
  nav?: number;     // 基準価額（1万口あたり）
}

export interface Feast {
  t: number;
  food: string;
  rank: number;
  amount: number;
}

export interface TrackerData {
  records: Record_[];
  xp: number;
  feasts: Feast[];
  lastFed: number | null;
}

const STORE_KEY = "orucogi_personal_v1";

// かつてデフォルトで入れていたサンプル（デモ用）の記録。実際の金額を入れる前に
// これが残っていたら空にして、最初に自分で入力した金額が1件目になるようにする。
const SAMPLE_RECORDS = [
  { principal: 1200000, value: 1300000 },
  { principal: 1236000, value: 1384320 },
];
function isSampleRecords(records: Record_[]): boolean {
  return records.length === SAMPLE_RECORDS.length &&
    records.every((r, i) => r.principal === SAMPLE_RECORDS[i].principal && r.value === SAMPLE_RECORDS[i].value);
}

export function migrate(d: Partial<TrackerData> & Record<string, unknown>): TrackerData {
  if (!d.records) d.records = [];
  if (isSampleRecords(d.records)) d.records = [];
  if (typeof d.xp !== "number") d.xp = 0;
  if (!Array.isArray(d.feasts)) d.feasts = [];
  if (typeof d.lastFed !== "number") d.lastFed = null;
  return d as TrackerData;
}

export function loadData(): TrackerData {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return migrate(JSON.parse(raw));
  } catch {
    // ignore
  }
  // 初期状態は空。最初に自分で入力（または取り込み）した金額が1件目の記録になる。
  return migrate({ records: [], xp: 0, feasts: [], lastFed: null });
}

export function saveData(d: TrackerData) {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(d));
  } catch {
    // ignore
  }
}
