import { useId } from "react";
import { roomParamsFor } from "../tracker/logic/roomStages";

// パーツ（耳/目/口/しっぽ/前足/後足/アクセサリ）ごとにグループ化した
// リグ構造のコーギー。props で表情・ポーズを合成する。
// 作画は既存 RoomCorgi の犬をベースに、目・口・耳・足を差し替え可能にしたもの。

export type Pose = "stand" | "sit" | "sleep" | "run" | "sniff" | "stretch";
export type EyeState = "open" | "closed" | "happy" | "sleepy";
export type MouthState = "smile" | "tongue" | "open" | "yawn" | "closed";
export type Accessory = "none" | "nightcap" | "bandana";

export interface LifeCorgiProps {
  level: number;        // 成長段階 1-12（体格に反映）
  pose: Pose;
  legPhase: number;     // 0..1 歩行サイクル
  tailWag: number;      // しっぽの現在角度(deg)
  eyes: EyeState;
  mouth: MouthState;
  earTwitchL?: number;  // 左耳の回転(deg)
  earTwitchR?: number;
  earDown?: boolean;    // 耳ペタン
  headTilt?: number;    // 首かしげ(deg)
  lift?: number;        // ジャンプの高さ(px)。体だけ持ち上げ、影は地面に残す
  accessory?: Accessory;
  rainbow?: boolean;    // 虹色コーギーの日
  proud?: boolean;      // 胸を張るドヤ
  blush?: boolean;
  silhouette?: boolean; // 遠吠えシルエット演出用
}

const OL = "#7A5230", TAN = "#E3A857", CREAM = "#FBEAD2", INNER = "#D89243",
  EARSH = "#C77F35", DARK = "#3A2418", TONGUE = "#F08CA0", BLUSH = "#F3C2B6";

export function LifeCorgi(p: LifeCorgiProps) {
  const uid = useId().replace(/[:]/g, "");
  const par = roomParamsFor(p.level);
  const running = p.pose === "run";
  const sitting = p.pose === "sit";
  const sleeping = p.pose === "sleep";
  const sniffing = p.pose === "sniff";
  const stretching = p.pose === "stretch";

  // 入場ダッシュは正面からの構図。脚を左右に振ると開脚して不自然なので、
  // 体を上下に弾ませ、4本の脚をそろえて「着地で伸び・空中で縮む」バウンド走りにする。
  const bound = running ? Math.sin(p.legPhase * Math.PI * 2) * 0.5 + 0.5 : 0; // 0=着地 1=空中
  const runBob = bound * 9;   // 体の弾み（空中で上がる）
  const legTuck = bound * 9;  // 脚の縮み（空中で足をしまう）
  const sitDrop = sitting ? 14 : 0;
  const lift = p.lift ?? 0;
  // 体は中心(y=250)を基準に拡縮するので、足の接地ラインも体格で上下する。
  // 立ち足の下端(元 y=346)を同じ変換にかけて、影をその足元に合わせる。
  const groundY = 250 + (346 - 250) * par.bodyScale * par.bodyStretch;

  const tan = p.rainbow ? `url(#rb-${uid})` : TAN;
  const inner = p.rainbow ? `url(#rb-${uid})` : INNER;
  const bodyFill = p.silhouette ? "#2E2A45" : tan;
  const creamFill = p.silhouette ? "#3A3555" : CREAM;
  const olStroke = p.silhouette ? "#242038" : OL;

  // 耳：もともと垂れ耳。ペタンはさらに外へ、ピクッは小さく回転。
  const earL = (p.earDown ? 16 : 0) + (p.earTwitchL || 0);
  const earR = -(p.earDown ? 16 : 0) + (p.earTwitchR || 0);

  // ポーズごとの全体変形
  let bodyXf = "";
  if (sleeping) bodyXf = "translate(0 52) scale(1 0.78)";
  else if (stretching) bodyXf = "rotate(-8 200 340)";
  else if (p.proud) bodyXf = "rotate(-5 200 340)";
  let headXf = "";
  if (sniffing) headXf = "translate(-36 66) rotate(-30 200 150)";
  else if (sleeping) headXf = "translate(0 26) rotate(6 200 150)";
  else if (stretching || p.proud) headXf = "translate(0 -8) rotate(4 200 150)";
  if (p.headTilt) headXf += ` rotate(${p.headTilt} 200 150)`;

  // 目
  const eyeK = sleeping ? "closed" : p.eyes;
  const Eye = ({ cx }: { cx: number }) => {
    if (eyeK === "closed")
      return <path d={`M${cx - 12} 148 Q${cx} 158 ${cx + 12} 148`} fill="none" stroke={DARK} strokeWidth="6" strokeLinecap="round" />;
    if (eyeK === "happy")
      return <path d={`M${cx - 12} 154 Q${cx} 138 ${cx + 12} 154`} fill="none" stroke={DARK} strokeWidth="6" strokeLinecap="round" />;
    if (eyeK === "sleepy")
      // 眠そうでも「真っ黒」にしない：元のまん丸の黒目＋白いハイライトを残し、
      // 上まぶたの細いラインだけで眠たげな雰囲気を出す。
      return (
        <g>
          <ellipse cx={cx} cy="151" rx={13 * par.eyeSize} ry={13 * par.eyeSize} fill={DARK} />
          <circle cx={cx + 4} cy={145} r={4.2 * par.eyeSize} fill="#fff" />
          <path d={`M${cx - 15} 142 Q${cx} 137 ${cx + 15} 142`} fill="none" stroke={OL} strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    return (
      <g>
        <ellipse cx={cx} cy="150" rx={13 * par.eyeSize} ry={15 * par.eyeSize} fill={DARK} />
        <circle cx={cx + 4} cy={144} r={4.5 * par.eyeSize} fill="#fff" />
      </g>
    );
  };

  // 口
  const nose = <ellipse cx="200" cy="186" rx="14" ry="10" fill={DARK} />;
  const mouthK = sleeping ? "closed" : p.mouth;
  const Mouth = (
    <g id={`mouth-${uid}`}>
      <ellipse cx="200" cy="201" rx="40" ry="32" fill={creamFill} stroke={olStroke} strokeWidth="7" />
      {nose}
      <path className="lc-tn" d="M200 196 L200 206" />
      {mouthK === "closed" && <path className="lc-tn" d="M186 210 q14 8 28 0" />}
      {mouthK === "smile" && (
        <g><path className="lc-tn" d="M200 206 q-16 14 -28 3" /><path className="lc-tn" d="M200 206 q16 14 28 3" /></g>
      )}
      {mouthK === "tongue" && (
        <g>
          <path className="lc-tn" d="M200 206 q-16 14 -28 3" /><path className="lc-tn" d="M200 206 q16 14 28 3" />
          <path className="lc-ol" fill={TONGUE} strokeWidth="6" d="M187 212 q13 20 26 0 q-2 16 -13 16 q-11 0 -13 -16 z" />
        </g>
      )}
      {mouthK === "open" && (
        <g>
          <path className="lc-ol" fill="#8C4A3E" strokeWidth="6" d="M180 206 q20 26 40 0 q-4 22 -20 22 q-16 0 -20 -22 z" />
          <path fill={TONGUE} d="M191 216 q9 12 18 0 q-2 10 -9 10 q-7 0 -9 -10 z" />
        </g>
      )}
      {mouthK === "yawn" && (
        <g>
          <ellipse cx="200" cy="216" rx="17" ry="14" fill="#8C4A3E" stroke={olStroke} strokeWidth="6" />
          <ellipse cx="200" cy="224" rx="9" ry="5" fill={TONGUE} />
        </g>
      )}
    </g>
  );

  return (
    <svg viewBox="0 0 400 388" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      <defs>
        <style>{`.lc-ol{stroke:${olStroke};stroke-width:9;stroke-linejoin:round;stroke-linecap:round;}.lc-tn{stroke:${olStroke};stroke-width:6;fill:none;stroke-linecap:round;}`}</style>
        {p.rainbow && (
          <linearGradient id={`rb-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#F6A6B8" /><stop offset="25%" stopColor="#F8C471" />
            <stop offset="50%" stopColor="#A8DBA8" /><stop offset="75%" stopColor="#8EC9EF" />
            <stop offset="100%" stopColor="#C7A8E8" />
          </linearGradient>
        )}
      </defs>
      {/* 影は地面に固定（足元に密着）。ジャンプで体が上がるほど小さく薄くする */}
      <ellipse cx="200" cy={groundY + 8} rx={(56 - Math.min(40, lift) * 0.4) * par.bodyScale} ry={9 * par.bodyScale} fill="#000" opacity={Math.max(0.05, 0.14 - lift * 0.002)} />
      <g transform={`translate(0 ${-lift - runBob}) ${bodyXf} translate(200 250) scale(0.86 1) translate(-200 -250)`}>
        {/* ---- 胴体 ---- */}
        <g id={`body-${uid}`} transform={`translate(0 ${sitDrop}) translate(200 250) scale(${par.bodyScale} ${par.bodyScale * par.bodyStretch}) translate(-200 -250)`}>
          {/* しっぽ */}
          <g id={`tail-${uid}`} transform={`rotate(${p.tailWag} 122 256)`}>
            <path fill={bodyFill} className="lc-ol" d="M124 250 q-30 -6 -34 -34 q-2 -16 12 -16 q10 14 6 30 q14 6 16 20 z" />
          </g>
          <path className="lc-ol" fill={bodyFill} d="M200 150 C150 150 120 185 120 245 C120 312 150 348 200 348 C250 348 280 312 280 245 C280 185 250 150 200 150 Z" />
          <path fill={creamFill} d="M200 198 C176 198 162 222 162 264 C162 314 180 340 200 340 C220 340 238 314 238 264 C238 222 224 198 200 198 Z" />
          {/* 後足（バウンド走りで上下に縮む。左右には振らない） */}
          <g id={`legBack-${uid}`} transform={`translate(0 ${-sitDrop - legTuck})`} opacity={sitting || sleeping ? 0 : 1}>
            <path className="lc-ol" fill={creamFill} d="M140 324 q-2 22 14 22 q16 0 14 -22 z" />
            <path className="lc-ol" fill={creamFill} d="M232 324 q-2 22 14 22 q16 0 14 -22 z" />
          </g>
          {/* 前足 */}
          <g id={`legFront-${uid}`} transform={`translate(0 ${-sitDrop - legTuck})`} opacity={sleeping ? 0 : 1}>
            <path className="lc-ol" fill={creamFill} d="M168 324 q-2 22 14 22 q16 0 14 -22 z" />
            <path className="lc-ol" fill={creamFill} d="M204 324 q-2 22 14 22 q16 0 14 -22 z" />
          </g>
          <path className="lc-tn" d="M186 288 q8 10 14 0 q6 10 14 0" />
          {/* バンダナは首もと（体側）に描く */}
          {p.accessory === "bandana" && (
            <g id={`bandana-${uid}`}>
              <path d="M128 176 q72 34 144 0 q-8 30 -72 30 q-64 0 -72 -30 z" fill="#4E97C2" stroke={olStroke} strokeWidth="6" strokeLinejoin="round" />
              <path d="M236 200 L258 252 L236 246 L228 204 Z" fill="#4E97C2" stroke={olStroke} strokeWidth="5" strokeLinejoin="round" />
            </g>
          )}
        </g>
        {/* ---- 頭 ---- */}
        <g id={`head-${uid}`} transform={`${headXf} translate(200 150) scale(${0.78 + par.bodyScale * 0.22}) translate(-200 -150)`}>
          <path className="lc-ol" fill={bodyFill} d="M200 60 C140 60 104 108 104 162 C104 214 146 244 200 244 C254 244 296 214 296 162 C296 108 260 60 200 60 Z" />
          {/* 耳（左右で回転できる） */}
          <g id={`earL-${uid}`} transform={`rotate(${earL} 150 82)`}>
            <path className="lc-ol" fill={inner} d="M162 84 C148 90 142 106 140 130 C138 164 138 202 132 226 q-8 12 -18 5 q-10 -3 -15 -15 C86 198 72 188 72 160 C72 118 102 82 140 74 C150 71 158 76 162 84 Z" />
            <path fill={EARSH} opacity={p.silhouette ? 0 : 0.45} d="M140 130 C138 164 140 200 148 222 q6 4 11 -2 C142 198 144 164 146 134 Z" />
          </g>
          <g id={`earR-${uid}`} transform={`rotate(${earR} 250 82)`}>
            <path className="lc-ol" fill={inner} d="M238 84 C252 90 258 106 260 130 C262 164 262 202 268 226 q8 12 18 5 q10 -3 15 -15 C314 198 328 188 328 160 C328 118 298 82 260 74 C250 71 242 76 238 84 Z" />
            <path fill={EARSH} opacity={p.silhouette ? 0 : 0.45} d="M260 130 C262 164 260 200 252 222 q-6 4 -11 -2 C258 198 256 164 254 134 Z" />
          </g>
          <path fill={creamFill} d="M200 108 C184 108 175 140 177 176 C160 188 158 214 172 230 C186 248 214 248 228 230 C242 214 240 188 223 176 C225 140 216 108 200 108 Z" />
          {!p.silhouette && (p.blush || eyeK === "happy") && (
            <g id={`blush-${uid}`}>
              <ellipse cx="160" cy="180" rx={14 * par.cheek} ry={9 * par.cheek} fill={BLUSH} opacity="0.75" />
              <ellipse cx="240" cy="180" rx={14 * par.cheek} ry={9 * par.cheek} fill={BLUSH} opacity="0.75" />
            </g>
          )}
          {!p.silhouette && (
            <g id={`eyes-${uid}`}><Eye cx={168} /><Eye cx={232} /></g>
          )}
          {!p.silhouette && Mouth}
          {/* ナイトキャップ */}
          {p.accessory === "nightcap" && (
            <g id={`nightcap-${uid}`} transform="translate(200 62) rotate(-8)">
              <path d="M-64 10 Q-10 -66 70 -34 Q84 -28 74 -18 L64 -8 Q-6 -38 -50 18 Z" fill="#7B84C4" stroke={olStroke} strokeWidth="6" strokeLinejoin="round" />
              <path d="M-70 24 Q0 -8 72 -4 Q76 8 68 14 Q0 20 -60 36 Z" fill="#9AA3DE" stroke={olStroke} strokeWidth="6" strokeLinejoin="round" />
              <circle cx="80" cy="-26" r="14" fill="#FFF3C4" stroke={olStroke} strokeWidth="5" />
            </g>
          )}
        </g>
      </g>
    </svg>
  );
}
