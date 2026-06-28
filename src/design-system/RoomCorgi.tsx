import { roomParamsFor } from "../features/tracker/logic/roomStages";
import type { RoomStage } from "../features/tracker/logic/roomStages";

export interface RoomCorgiProps {
  level: number;
  badge: RoomStage["badge"];
  walkPhase: number;
  state: "walk" | "sit" | "idle";
  jump?: number;
}

// ダックスフンド版：体・脚・歩行・成長はコーギー版と同じ仕組みのまま、
// 頭まわり（垂れ耳・長めのマズル・クリームゴールドの毛色）だけ犬種に合わせて作画。
export function RoomCorgi({ level, badge, walkPhase, state, jump = 0 }: RoomCorgiProps) {
  const p = roomParamsFor(level);
  const walking = state === "walk";
  const lift = (walking ? Math.abs(Math.sin(walkPhase * Math.PI * 2)) * 5 : 0) + jump;
  const legA = walking ? Math.max(0, Math.sin(walkPhase * Math.PI * 2)) * 9 : 0;
  const legB = walking ? Math.max(0, Math.sin(walkPhase * Math.PI * 2 + Math.PI)) * 9 : 0;
  const tailWag = Math.sin(walkPhase * Math.PI * 2 * 2) * (walking ? 4 : 12);
  const sitDrop = state === "sit" ? 14 : 0;
  return (
    <svg viewBox="0 0 400 388" width="100%" height="100%" style={{ display: "block", overflow: "visible" }}>
      <defs><style>{`.cr-ol{stroke:#7A5230;stroke-width:9;stroke-linejoin:round;stroke-linecap:round;}.cr-tn{stroke:#7A5230;stroke-width:6;fill:none;stroke-linecap:round;}`}</style></defs>
      <ellipse cx="200" cy={376} rx={61 * p.bodyScale} ry={11 * p.bodyScale} fill="#000" opacity="0.12"/>
      <g transform={`translate(0 ${-lift + sitDrop}) translate(200 250) scale(0.86 1.0) translate(-200 -250)`}>
        <g transform={`translate(200 250) scale(${p.bodyScale} ${p.bodyScale * p.bodyStretch}) translate(-200 -250)`}>
          <g transform={`rotate(${tailWag} 122 256)`}><path fill="#E3A857" className="cr-ol" d="M124 250 q-30 -6 -34 -34 q-2 -16 12 -16 q10 14 6 30 q14 6 16 20 z"/></g>
          <path className="cr-ol" fill="#E3A857" d="M200 150 C150 150 120 185 120 245 C120 312 150 348 200 348 C250 348 280 312 280 245 C280 185 250 150 200 150 Z"/>
          <path fill="#FBEAD2" d="M200 198 C176 198 162 222 162 264 C162 314 180 340 200 340 C220 340 238 314 238 264 C238 222 224 198 200 198 Z"/>
          <g transform={`translate(0 ${lift - sitDrop})`}>
            <path className="cr-ol" fill="#FBEAD2" d={`M168 ${324 - legA} q-2 22 14 22 q16 0 14 -22 z`}/>
            <path className="cr-ol" fill="#FBEAD2" d={`M204 ${324 - legB} q-2 22 14 22 q16 0 14 -22 z`}/>
          </g>
          <path className="cr-tn" d="M186 288 q8 10 14 0 q6 10 14 0"/>
        </g>
        <g transform={`translate(200 150) scale(${0.78 + p.bodyScale * 0.22}) translate(-200 -150)`}>
          <path className="cr-ol" fill="#E3A857" d="M200 60 C140 60 104 108 104 162 C104 214 146 244 200 244 C254 244 296 214 296 162 C296 108 260 60 200 60 Z"/>
          <path className="cr-ol" fill="#D89243" d="M162 84 C148 90 142 106 140 130 C138 164 138 202 132 226 q-8 12 -18 5 q-10 -3 -15 -15 C86 198 72 188 72 160 C72 118 102 82 140 74 C150 71 158 76 162 84 Z"/>
          <path className="cr-ol" fill="#D89243" d="M238 84 C252 90 258 106 260 130 C262 164 262 202 268 226 q8 12 18 5 q10 -3 15 -15 C314 198 328 188 328 160 C328 118 298 82 260 74 C250 71 242 76 238 84 Z"/>
          <path fill="#C77F35" opacity="0.45" d="M140 130 C138 164 140 200 148 222 q6 4 11 -2 C142 198 144 164 146 134 Z"/>
          <path fill="#C77F35" opacity="0.45" d="M260 130 C262 164 260 200 252 222 q-6 4 -11 -2 C258 198 256 164 254 134 Z"/>
          <path fill="#FBEAD2" d="M200 108 C184 108 175 140 177 176 C160 188 158 214 172 230 C186 248 214 248 228 230 C242 214 240 188 223 176 C225 140 216 108 200 108 Z"/>
          <ellipse cx="164" cy="180" rx={13 * p.cheek} ry={9 * p.cheek} fill="#F3C2B6" opacity="0.6"/>
          <ellipse cx="236" cy="180" rx={13 * p.cheek} ry={9 * p.cheek} fill="#F3C2B6" opacity="0.6"/>
          <ellipse cx="168" cy="150" rx={13 * p.eyeSize} ry={15 * p.eyeSize} fill="#3A2418"/>
          <ellipse cx="232" cy="150" rx={13 * p.eyeSize} ry={15 * p.eyeSize} fill="#3A2418"/>
          <circle cx={172} cy={144} r={4.5 * p.eyeSize} fill="#fff"/>
          <circle cx={236} cy={144} r={4.5 * p.eyeSize} fill="#fff"/>
          <ellipse cx="200" cy="201" rx="40" ry="32" fill="#FBEAD2" stroke="#7A5230" strokeWidth="7"/>
          <ellipse cx="200" cy="186" rx="14" ry="10" fill="#3A2418"/>
          <path className="cr-tn" d="M200 196 L200 206"/>
          <path className="cr-tn" d="M200 206 q-16 14 -28 3"/>
          <path className="cr-tn" d="M200 206 q16 14 28 3"/>
          <path className="cr-ol" fill="#F08CA0" strokeWidth="6" d="M187 212 q13 20 26 0 q-2 16 -13 16 q-11 0 -13 -16 z"/>
          {badge==="leaf"&&<g transform="translate(250 70) rotate(20)"><path d="M0 0 q18 -10 30 6 q-18 10 -30 -6 z" fill="#7FB069" stroke="#4E7A3F" strokeWidth="3"/></g>}
          {badge==="scarf"&&<path d="M120 232 q80 30 160 0 q-10 26 -80 26 q-70 0 -80 -26 z" fill="#E2574C" stroke="#A8392F" strokeWidth="5"/>}
          {badge==="medal"&&<g transform="translate(200 244)"><path d="M-14 0 L0 26 L14 0 Z" fill="#E2574C" stroke="#A8392F" strokeWidth="3"/><circle cx="0" cy="34" r="16" fill="#F2C14E" stroke="#B8860B" strokeWidth="4"/><text x="0" y="40" fontSize="16" textAnchor="middle" fill="#7A5200">★</text></g>}
          {badge==="crown"&&<g transform="translate(200 40)"><path d="M-40 14 L-40 -14 L-20 4 L0 -22 L20 4 L40 -14 L40 14 Z" fill="#F2C14E" stroke="#B8860B" strokeWidth="5" strokeLinejoin="round"/><circle cx="0" cy="-2" r="5" fill="#E2574C"/></g>}
          {badge==="halo"&&<ellipse cx="200" cy="34" rx="70" ry="16" fill="none" stroke="#F2C14E" strokeWidth="7" opacity="0.9"/>}
        </g>
      </g>
    </svg>
  );
}
