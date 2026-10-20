export type Theme = 'storm' | 'moon' | 'dawn' | 'day';
export type AgentState = 'idle' | 'working' | 'waiting' | 'done';
export interface PetrelOptions {
  count: number;
  speed: number;
  opacity: number;
  scale: number;
  fps: number;
  theme: Theme;
  state: AgentState;
  interactive: boolean;
  transparent: boolean;
  reducedMotion: boolean;
  seed: number;
  texture: 'glyphs' | 'tiles';
  centerClear: number;
}
export const defaults: PetrelOptions = {
  count: 5, speed: 0.65, opacity: 0.8, scale: 1, fps: 30,
  theme: 'storm', state: 'idle', interactive: true, transparent: false,
  reducedMotion: false, seed: 87, texture: 'tiles', centerClear: 0.7
};
const clamp = (v: unknown, lo: number, hi: number, fallback: number) =>
  typeof v === 'number' && Number.isFinite(v) ? Math.min(hi, Math.max(lo, v)) : fallback;
export function normalize(input: Partial<PetrelOptions>, base = defaults): PetrelOptions {
  return {
    count: Math.round(clamp(input.count, 0, 12, base.count)),
    speed: clamp(input.speed, 0, 3, base.speed),
    opacity: clamp(input.opacity, 0, 1, base.opacity),
    scale: clamp(input.scale, 0.3, 2, base.scale),
    fps: Math.round(clamp(input.fps, 1, 60, base.fps)),
    seed: Math.round(clamp(input.seed, 1, 2147483646, base.seed)),
    theme: ['storm', 'moon', 'dawn', 'day'].includes(input.theme ?? '') ? input.theme! : base.theme,
    state: ['idle', 'working', 'waiting', 'done'].includes(input.state ?? '') ? input.state! : base.state,
    interactive: typeof input.interactive === 'boolean' ? input.interactive : base.interactive,
    transparent: typeof input.transparent === 'boolean' ? input.transparent : base.transparent,
    reducedMotion: typeof input.reducedMotion === 'boolean' ? input.reducedMotion : base.reducedMotion,
    texture: ['glyphs', 'tiles'].includes(input.texture ?? '') ? input.texture! : base.texture,
    centerClear: clamp(input.centerClear, 0, 1, base.centerClear)
  };
}
export const palettes = {
  storm: { bg: '#090f15', body: [116, 163, 176], accent: '#94cfc4', spray: '#31515d', wave: '#1d3541' },
  moon: { bg: '#0c0d17', body: [165, 173, 203], accent: '#ccd6fb', spray: '#41455f', wave: '#2c3044' },
  dawn: { bg: '#151217', body: [197, 163, 147], accent: '#edc5a7', spray: '#62484c', wave: '#3d3038' },
  day: { bg: '#f6fafb', body: [34, 65, 135], accent: '#3153aa', spray: '#7594b2', wave: '#c1d1de' }
} as const;
