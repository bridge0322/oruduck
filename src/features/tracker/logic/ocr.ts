import { toNum } from "./csv";

// OCRテキストの正規化：全角数字→半角、記号ゆらぎの統一、通貨記号・数字間空白の除去。
// これで「１，２３４，５６７円」や「1 234 567」なども拾えるようにする。
export function normalizeOcr(text: string): string {
  return String(text)
    .replace(/[０-９]/g, (d) => String.fromCharCode(d.charCodeAt(0) - 0xFEE0))
    .replace(/[，、]/g, ",")
    .replace(/[．]/g, ".")
    .replace(/[−–—―ー]/g, "-")
    .replace(/[▲△]/g, "-") // マイナス表記（△▲）を統一
    .replace(/[¥￥円]/g, "")
    .replace(/(\d)[ 　]+(?=\d{3}\b)/g, "$1"); // 「1 234」のような桁間スペースを詰める
}

// 3桁以上のまとまった金額（100以上）を取り出す。
export function ocrYen(s: unknown): number[] {
  const m = String(s).match(/-?[0-9][0-9,]{2,}/g);
  return m ? m.map((x) => toNum(x)).filter((n) => !isNaN(n) && Math.abs(n) >= 100) : [];
}

export interface OcrResult {
  value: number | null;
  principal: number | null;
  raw: string;
}

const VALUE_LABEL = /評価額|時価評価額|時価額/;
const PRINCIPAL_LABEL = /取得金額|取得額|取得価額|投資金額|投資元本|元本/;
const PL_LABEL = /評価損益|損益/;
// 金額と紛らわしい行（数量・単価・基準価額・率）。評価額のフォールバックから除外する。
const NOISE_LINE = /数量|口数|口座|保有口|単価|基準価|参考|前日比|騰落|率|[%％]/;

export function parseOcr(text: string): OcrResult {
  const lines = normalizeOcr(text).split(/\n+/).map((l) => l.trim()).filter(Boolean);

  // ラベル行 i から続く数行のうち、最初に金額が見つかった行の数値配列を返す。
  const windowNums = (i: number): number[] => {
    for (let k = i; k <= i + 2 && k < lines.length; k++) {
      const ns = ocrYen(lines[k].replace(/[%％][^0-9]*$/g, ""));
      if (ns.length) return ns;
    }
    return [];
  };

  let value: number | null = null, principal: number | null = null, pl: number | null = null, plNeg = false;
  lines.forEach((l, i) => {
    if (value == null && VALUE_LABEL.test(l) && !PL_LABEL.test(l) && !/率|[%％]/.test(l)) {
      const ns = windowNums(i); if (ns.length) value = Math.abs(ns[0]);
    }
    if (principal == null && PRINCIPAL_LABEL.test(l) && !/単価/.test(l)) {
      const ns = windowNums(i); if (ns.length) principal = Math.abs(ns[0]);
    }
    if (pl == null && PL_LABEL.test(l) && !/率|[%％]/.test(l)) {
      for (let k = i; k <= i + 2 && k < lines.length; k++) {
        const seg = lines[k]; const ns = ocrYen(seg);
        if (ns.length) { pl = Math.abs(ns[0]); plNeg = /-/.test(seg); break; }
      }
    }
  });

  // 評価額がラベルから取れなければ、数量・単価・率などのノイズ行をのぞいた最大額を採用。
  if (value == null) {
    const cand = lines.filter((l) => !NOISE_LINE.test(l)).flatMap(ocrYen).map(Math.abs);
    if (cand.length) value = Math.max(...cand);
  }
  if (pl != null && plNeg) pl = -pl;
  // 取得金額が取れなくても、評価額と評価損益から元本を逆算する。
  if (principal == null && value != null && pl != null) principal = value - pl;
  return { value, principal, raw: text };
}
