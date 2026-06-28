import type { CSSProperties } from "react";

export type CorgiStage = "egg" | "puppy" | "young" | "adult" | "legend";
export type CorgiCondition = "thriving" | "happy" | "normal" | "down" | "cold";

export interface CorgiMascotProps {
  stage?: CorgiStage;
  condition?: CorgiCondition;
  size?: number;
  bob?: boolean;
  style?: CSSProperties;
}

export function CorgiMascot({ stage = "adult", condition = "happy", size = 160, bob = false, style }: CorgiMascotProps) {
  const OL="#7A5230",TAN="#E3A857",CREAM="#FBEAD2",INNER="#D89243",EARSH="#C77F35",DARK="#3A2418",BLUSH="#F3C2B6",TONGUE="#F08CA0",COLD="#A9CBDD",GOLD="#F2C14E",GOLD_D="#B8860B",SKY="#7FB7D6",CORAL="#E2574C",CORAL_D="#A8392F",LEAF="#7FB069",LEAF_D="#4E7A3F",SKY_D="#4E97C2";
  const c=({thriving:{eyes:"open",mouth:"tongue",cheek:BLUSH,aura:"sparkle"},happy:{eyes:"open",mouth:"tongue",cheek:BLUSH},normal:{eyes:"open",mouth:"smile",cheek:BLUSH},down:{eyes:"worried",mouth:"frown",cheek:BLUSH,aura:"sweat"},cold:{eyes:"worried",mouth:"wavy",cheek:COLD,aura:"cold"}} as Record<string,{eyes:string;mouth:string;cheek:string;aura?:string}>)[condition]||{eyes:"open",mouth:"tongue",cheek:BLUSH};
  const Eyes=(<g><ellipse cx="160" cy="150" rx="15" ry="17" fill={DARK}/><ellipse cx="240" cy="150" rx="15" ry="17" fill={DARK}/><circle cx="163" cy="144" r="5" fill="#fff"/><circle cx="243" cy="144" r="5" fill="#fff"/>{c.eyes==="worried"&&<g fill="none" stroke={OL} strokeWidth="6" strokeLinecap="round"><path d="M136 136 Q156 121 179 118"/><path d="M221 118 Q244 121 264 136"/></g>}</g>);
  const Tears=(<g fill="#8FC3DE" stroke="#5C9FC4" strokeWidth="2.5" strokeLinejoin="round"><path d="M150 160 q-7 16 0 22 q7 -6 0 -22 Z"/><path d="M250 160 q-7 16 0 22 q7 -6 0 -22 Z"/></g>);
  const nose=<ellipse cx="200" cy="176" rx="13" ry="9" fill={DARK}/>;
  const Muzzle=<ellipse cx="200" cy="201" rx="40" ry="32" fill={CREAM} stroke={OL} strokeWidth="7"/>;
  const Mouth = c.mouth==="tongue" ? (
    <g>{nose}<path className="m-tn" d="M200 186 L200 196"/><path className="m-tn" d="M200 196 q-20 16 -34 2"/><path className="m-tn" d="M200 196 q20 16 34 2"/><path className="m-ol" fill={TONGUE} strokeWidth="6" d="M184 202 q16 26 32 0 q-2 18 -16 18 q-14 0 -16 -18 z"/></g>
  ) : c.mouth==="smile" ? (
    <g>{nose}<path className="m-tn" d="M200 186 L200 196"/><path className="m-tn" d="M200 196 q-18 14 -32 2"/><path className="m-tn" d="M200 196 q18 14 32 2"/></g>
  ) : c.mouth==="frown" ? (
    <g>{nose}<path className="m-tn" d="M200 186 L200 197"/><path className="m-tn" d="M176 210 q24 -22 48 0"/></g>
  ) : (
    <g>{nose}<path className="m-tn" d="M200 186 L200 197"/><path className="m-tn" d="M174 208 q12 -11 24 0 q12 11 24 0"/></g>
  );
  const Sprout=(<g transform="translate(200 60)"><path className="m-ol" strokeWidth="6" fill={LEAF} d="M0 0 q-20 -10 -16 -34 q22 4 16 34 z"/><path className="m-ol" strokeWidth="6" fill={LEAF_D} d="M0 2 q20 -12 38 -6 q-14 22 -38 4 z"/></g>);
  const Bandana=(<path d="M120 232 q80 30 160 0 q-10 26 -80 26 q-70 0 -80 -26 z" fill={SKY} stroke={OL} strokeWidth="6" strokeLinejoin="round"/>);
  const Crown=(<g transform="translate(200 44)"><path d="M-40 14 L-40 -14 L-20 4 L0 -22 L20 4 L40 -14 L40 14 Z" fill={GOLD} stroke={GOLD_D} strokeWidth="5" strokeLinejoin="round"/><circle cx="0" cy="-2" r="5" fill={CORAL}/></g>);
  const Scarf=(<g><path d="M120 232 q80 30 160 0 q-10 26 -80 26 q-70 0 -80 -26 z" fill={CORAL} stroke={CORAL_D} strokeWidth="6" strokeLinejoin="round"/><path d="M250 256 L274 320 L250 314 L242 260 Z" fill={CORAL} stroke={CORAL_D} strokeWidth="5" strokeLinejoin="round"/></g>);
  const Sparkles=(<g fill={GOLD} opacity="0.95">{([[70,96,16],[330,80,20],[336,210,13]] as [number,number,number][]).map(([x,y,s],i)=><path key={i} d={`M${x} ${y-s} Q${x+s*0.25} ${y-s*0.25} ${x+s} ${y} Q${x+s*0.25} ${y+s*0.25} ${x} ${y+s} Q${x-s*0.25} ${y+s*0.25} ${x-s} ${y} Q${x-s*0.25} ${y-s*0.25} ${x} ${y-s} Z`}/>)}</g>);
  const Sweat=<path d="M296 132 q-9 15 0 23 q9 -8 0 -23 Z" fill={SKY_D} opacity="0.85"/>;
  const Shiver=(<g stroke={COLD} strokeWidth="5" strokeLinecap="round" fill="none" opacity="0.9"><path d="M72 150 q6 -7 12 0 q6 7 12 0"/><path d="M304 150 q6 -7 12 0 q6 7 12 0"/></g>);
  const Egg=(<g transform="translate(0 8)"><g stroke={OL} strokeWidth="9" strokeLinejoin="round" strokeLinecap="round"><path fill={CREAM} d="M200 70 C262 70 300 168 300 240 C300 308 256 350 200 350 C144 350 100 308 100 240 C100 168 138 70 200 70 Z"/><path fill="none" d="M100 222 L138 208 L162 234 L194 212 L222 240 L252 216 L282 236 L300 226"/></g><circle cx="160" cy="150" r="8" fill={TAN} opacity="0.6"/><circle cx="248" cy="186" r="6" fill={TAN} opacity="0.6"/><circle cx="170" cy="262" r="10" fill={TAN} opacity="0.5"/><g fill={TAN} stroke={OL} strokeWidth="8" strokeLinejoin="round"><path d="M162 100 C150 64 153 44 164 47 C174 56 173 84 162 100 Z"/><path d="M238 100 C250 64 247 44 236 47 C226 56 227 84 238 100 Z"/></g><path d="M170 168 Q182 178 194 168" fill="none" stroke={DARK} strokeWidth="7" strokeLinecap="round"/><path d="M206 168 Q218 178 230 168" fill="none" stroke={DARK} strokeWidth="7" strokeLinecap="round"/></g>);
  const SC=({egg:1,puppy:0.8,young:0.91,adult:1,legend:1.06} as Record<string,number>)[stage]||1;
  const Dog=(
    <g transform={`translate(200 250) scale(${SC * 0.86} ${SC}) translate(-200 -250)`}>
      {c.aura==="sparkle"&&Sparkles}{c.aura==="cold"&&Shiver}
      <path className="m-ol" fill={TAN} d="M124 250 q-30 -6 -34 -34 q-2 -16 12 -16 q10 14 6 30 q14 6 16 20 z" transform="rotate(-12 122 234)"/>
      <path className="m-ol" fill={TAN} d="M200 150 C150 150 120 185 120 245 C120 312 150 348 200 348 C250 348 280 312 280 245 C280 185 250 150 200 150 Z"/>
      <path fill={CREAM} d="M200 198 C176 198 162 222 162 264 C162 314 180 340 200 340 C220 340 238 314 238 264 C238 222 224 198 200 198 Z"/>
      <path className="m-ol" fill={CREAM} d="M168 324 q-2 22 14 22 q16 0 14 -22 z"/>
      <path className="m-ol" fill={CREAM} d="M204 324 q-2 22 14 22 q16 0 14 -22 z"/>
      <path className="m-tn" d="M186 288 q8 10 14 0 q6 10 14 0"/>
      {c.aura==="cold"?Scarf:stage==="adult"?Bandana:null}{stage==="legend"&&Bandana}
      <path className="m-ol" fill={TAN} d="M200 60 C140 60 104 108 104 162 C104 214 146 244 200 244 C254 244 296 214 296 162 C296 108 260 60 200 60 Z"/>
      <path className="m-ol" fill={INNER} d="M162 84 C148 90 142 106 140 130 C138 164 138 202 132 226 q-8 12 -18 5 q-10 -3 -15 -15 C86 198 72 188 72 160 C72 118 102 82 140 74 C150 71 158 76 162 84 Z"/>
      <path className="m-ol" fill={INNER} d="M238 84 C252 90 258 106 260 130 C262 164 262 202 268 226 q8 12 18 5 q10 -3 15 -15 C314 198 328 188 328 160 C328 118 298 82 260 74 C250 71 242 76 238 84 Z"/>
      <path fill={EARSH} opacity="0.45" d="M140 130 C138 164 140 200 148 222 q6 4 11 -2 C142 198 144 164 146 134 Z"/>
      <path fill={EARSH} opacity="0.45" d="M260 130 C262 164 260 200 252 222 q-6 4 -11 -2 C258 198 256 164 254 134 Z"/>
      <path fill={CREAM} d="M200 78 C188 78 182 108 182 140 C158 150 150 178 162 200 C176 224 224 224 238 200 C250 178 242 150 218 140 C218 108 212 78 200 78 Z"/>
      <ellipse cx="160" cy="178" rx="16" ry="11" fill={c.cheek}/>
      <ellipse cx="240" cy="178" rx="16" ry="11" fill={c.cheek}/>
      {Eyes}{Muzzle}{Mouth}{(condition==="down"||condition==="cold")&&Tears}{c.aura==="sweat"&&Sweat}{stage==="puppy"&&Sprout}{stage==="legend"&&Crown}
    </g>
  );
  return (
    <svg viewBox="0 0 400 392" width={size} height={size} role="img" aria-label={`corgi ${stage} ${condition}`}
      style={{display:"block",overflow:"visible",transformOrigin:"50% 85%",animation:bob?"corgi-bob 2.4s ease-in-out infinite":undefined,...style}}>
      <defs><style>{`.m-ol{stroke:${OL};stroke-width:9;stroke-linejoin:round;stroke-linecap:round;}.m-tn{stroke:${OL};stroke-width:6;fill:none;stroke-linecap:round;}`}</style></defs>
      {stage==="egg"?Egg:Dog}
    </svg>
  );
}
