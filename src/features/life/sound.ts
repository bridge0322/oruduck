// サウンド。外部音源を使わず Web Audio のオシレータ＋ノイズ合成で効果音を自作。
// 既定OFF。設定でON＋音量。AudioContext はユーザー操作後の初回再生で遅延生成する。
export type SoundName = "whine" | "crunch" | "snore" | "step" | "wag" | "fanfare";

let ctx: AudioContext | null = null;
let enabled = false;
let volume = 0.5;

export function configureSound(on: boolean, vol: number) { enabled = on; volume = Math.max(0, Math.min(1, vol)); }
export const soundEnabled = () => enabled;

function ac(): AudioContext | null {
  try {
    if (!ctx) {
      const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    return ctx;
  } catch { return null; }
}

function noiseBuf(c: AudioContext, dur: number): AudioBuffer {
  const n = Math.max(1, Math.floor(c.sampleRate * dur));
  const b = c.createBuffer(1, n, c.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function env(g: GainNode, t: number, a: number, d: number, peak: number) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(peak, t + a);
  g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
}

export function playSound(name: SoundName) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  try {
    const t = c.currentTime;
    const master = c.createGain();
    master.gain.value = volume;
    master.connect(c.destination);
    if (name === "whine") { // 甘え鳴き：くぅ〜んと上下するピッチ
      const o = c.createOscillator(); o.type = "triangle";
      o.frequency.setValueAtTime(520, t);
      o.frequency.linearRampToValueAtTime(880, t + 0.13);
      o.frequency.linearRampToValueAtTime(600, t + 0.4);
      const g = c.createGain(); env(g, t, 0.05, 0.42, 0.5);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.55);
    } else if (name === "crunch") { // カリカリ：高音ノイズの短いバースト×3
      for (let i = 0; i < 3; i++) {
        const tt = t + i * 0.09;
        const s = c.createBufferSource(); s.buffer = noiseBuf(c, 0.06);
        const f = c.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 1600;
        const g = c.createGain(); env(g, tt, 0.004, 0.06, 0.4);
        s.connect(f).connect(g).connect(master); s.start(tt); s.stop(tt + 0.07);
      }
    } else if (name === "snore") { // 寝息：低いフィルタノイズがふわっ
      const s = c.createBufferSource(); s.buffer = noiseBuf(c, 0.7);
      const f = c.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 480;
      const g = c.createGain(); env(g, t, 0.28, 0.5, 0.22);
      s.connect(f).connect(g).connect(master); s.start(t); s.stop(t + 0.85);
    } else if (name === "step") { // 足音：短い低音ポッ
      const o = c.createOscillator(); o.type = "sine";
      o.frequency.setValueAtTime(190, t); o.frequency.exponentialRampToValueAtTime(90, t + 0.08);
      const g = c.createGain(); env(g, t, 0.004, 0.1, 0.3);
      o.connect(g).connect(master); o.start(t); o.stop(t + 0.13);
    } else if (name === "fanfare") { // ファンファーレ：ドミソド↑の明るいアルペジオ
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5 E5 G5 C6
      notes.forEach((f, i) => {
        const tt = t + i * 0.14;
        const o = c.createOscillator(); o.type = "triangle"; o.frequency.value = f;
        const g = c.createGain(); env(g, tt, 0.01, i === notes.length - 1 ? 0.5 : 0.18, 0.4);
        o.connect(g).connect(master); o.start(tt); o.stop(tt + (i === notes.length - 1 ? 0.6 : 0.24));
      });
    } else if (name === "wag") { // しっぽぱたぱた：軽い木質音×2
      for (let i = 0; i < 2; i++) {
        const tt = t + i * 0.12;
        const o = c.createOscillator(); o.type = "square"; o.frequency.value = 220;
        const g = c.createGain(); env(g, tt, 0.004, 0.05, 0.14);
        o.connect(g).connect(master); o.start(tt); o.stop(tt + 0.06);
      }
    }
  } catch { /* 音は鳴らなくても致命的でない */ }
}
