// 季節と行事の飾りつけ。日付（東京時間）だけで決まり、ひらくたびに部屋の景色が変わる。
// 粒子（舞い落ちる花びら・落ち葉）と、地面に置く小物（絵文字プロップ）の2層。
// 保存領域・ネットワークは使わない。

export interface SeasonProp {
  e: string;        // 絵文字
  left: string;     // 横位置（%）
  bottom: string;   // 縦位置（ステージ下端から）
  size: number;     // フォントサイズ
  sway?: boolean;   // ゆらゆら揺らすか
}

export interface SeasonInfo {
  id: string;
  label: string;                    // デバッグ・アクセシビリティ用
  particles?: { chars: string[]; count: number; slow?: boolean }; // 舞い落ちる粒子
  props: SeasonProp[];              // 地面の小物
}

// 月日を mo*100+d のコードで比較（例: 3/20 → 320）
const md = (mo: number, d: number) => mo * 100 + d;

export function seasonFor(mo: number, d: number): SeasonInfo | null {
  const c = md(mo, d);

  // 桜（3/20〜4/15）：花びらが舞う
  if (c >= 320 && c <= 415) {
    return { id: "sakura", label: "さくら", particles: { chars: ["🌸"], count: 9, slow: true }, props: [] };
  }
  // こどもの日（5/1〜5/5）：こいのぼり
  if (c >= 501 && c <= 505) {
    return { id: "koinobori", label: "こいのぼり", props: [{ e: "🎏", left: "76%", bottom: "42%", size: 34, sway: true }] };
  }
  // 梅雨（6月）：かたつむり（雨は天気連動が別で降らせる）
  if (mo === 6) {
    return { id: "tsuyu", label: "つゆ", props: [{ e: "🐌", left: "72%", bottom: "16%", size: 20, sway: true }] };
  }
  // 七夕（7/1〜7/7）：笹かざり
  if (c >= 701 && c <= 707) {
    return { id: "tanabata", label: "たなばた", props: [{ e: "🎋", left: "76%", bottom: "18%", size: 34, sway: true }] };
  }
  // 夏（7/8〜8/31）：ひまわり
  if (c >= 708 && c <= 831) {
    return {
      id: "summer", label: "なつ",
      props: [
        { e: "🌻", left: "74%", bottom: "17%", size: 26, sway: true },
        { e: "🌻", left: "25%", bottom: "15%", size: 18, sway: true },
      ],
    };
  }
  // お月見（9/10〜9/25）：すすきと おだんご
  if (c >= 910 && c <= 925) {
    return {
      id: "tsukimi", label: "おつきみ",
      props: [
        { e: "🌾", left: "76%", bottom: "17%", size: 26, sway: true },
        { e: "🍡", left: "86%", bottom: "15%", size: 18 },
      ],
    };
  }
  // ハロウィン（10/25〜10/31）：かぼちゃ＋落ち葉
  if (c >= 1025 && c <= 1031) {
    return { id: "halloween", label: "ハロウィン", particles: { chars: ["🍂"], count: 6, slow: true }, props: [{ e: "🎃", left: "78%", bottom: "15%", size: 26 }] };
  }
  // 紅葉（11月）：もみじと落ち葉が舞う
  if (mo === 11) {
    return { id: "autumn", label: "こうよう", particles: { chars: ["🍁", "🍂"], count: 8, slow: true }, props: [] };
  }
  // クリスマス（12/15〜12/25）：ツリー
  if (c >= 1215 && c <= 1225) {
    return { id: "christmas", label: "クリスマス", props: [{ e: "🎄", left: "77%", bottom: "16%", size: 34 }] };
  }
  // お正月（12/31〜1/7）：門松
  if (c >= 1231 || c <= 107) {
    return { id: "newyear", label: "おしょうがつ", props: [{ e: "🎍", left: "78%", bottom: "16%", size: 30 }] };
  }
  return null;
}
