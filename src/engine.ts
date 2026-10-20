import { normalize, palettes, type PetrelOptions } from './options';

interface Bird { x: number; y: number; heading: number; phase: number; size: number; turn: number; }
const TAU = Math.PI * 2;
const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const angle = (v: number) => Math.atan2(Math.sin(v), Math.cos(v));
/** A seeded original flight simulation, independent from the reference shark source. */
export class PetrelEngine {
  private ctx: CanvasRenderingContext2D;
  private mask = document.createElement('canvas');
  private ink: CanvasRenderingContext2D;
  private birds: Bird[] = [];
  private width = 0;
  private height = 0;
  private cw = 5;
  private ch = 7;
  private time = 0;
  private raf = 0;
  private last = 0;
  private rng = 87;
  private paused = false;
  private disposed = false;
  private visible = true;
  private resizeObserver: ResizeObserver;
  private intersectionObserver: IntersectionObserver;
  private motion = matchMedia('(prefers-reduced-motion: reduce)');
  private pointer = { x: 0, y: 0, active: false };
  private settings: PetrelOptions;
  private frameCount = 0;

  constructor(private canvas: HTMLCanvasElement, options: Partial<PetrelOptions> = {}) {
    const context = canvas.getContext('2d', { alpha: true });
    const ink = this.mask.getContext('2d', { willReadFrequently: true });
    if (!context || !ink) throw new Error('Canvas 2D is required');
    this.ctx = context;
    this.ink = ink;
    this.settings = normalize(options);
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.intersectionObserver = new IntersectionObserver(([entry]) => {
      this.visible = entry.isIntersecting; this.sync();
    });
    this.resizeObserver.observe(canvas);
    this.intersectionObserver.observe(canvas);
    document.addEventListener('visibilitychange', this.sync);
    this.motion.addEventListener('change', this.sync);
    window.addEventListener('pointermove', this.onPointer, { passive: true });
    window.addEventListener('blur', this.clearPointer);
    document.documentElement.addEventListener('pointerleave', this.clearPointer);
    this.resize();
    this.sync();
  }

  get options(): Readonly<PetrelOptions> { return { ...this.settings }; }
  get stats() { return { frames: this.frameCount, birds: this.birds.length, running: this.raf !== 0, time: this.time, destroyed: this.disposed }; }

  configure(patch: Partial<PetrelOptions>) {
    if (this.disposed) return;
    const next = normalize(patch, this.settings);
    const reseed = next.count !== this.settings.count || next.seed !== this.settings.seed;
    this.settings = next;
    if (reseed) this.seed();
    this.draw(); this.sync();
  }
  pause() { this.paused = true; this.sync(); }
  resume() { this.paused = false; this.sync(); }
  /** Seek a reproducible frame for video export. This leaves realtime playback paused. */
  renderAt(seconds: number) {
    if (this.disposed) return;
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > 600) {
      throw new RangeError('renderAt expects a time between 0 and 600 seconds');
    }
    this.pause();
    this.pointer.active = false;
    this.seed();
    const steps = Math.floor(seconds * 60 + 1e-8);
    for (let i = 0; i < steps; i++) this.step(1 / 60);
    const remainder = seconds - steps / 60;
    if (remainder > 1e-8) this.step(remainder);
    this.draw();
  }
  destroy() {
    if (this.disposed) return;
    this.disposed = true;
    cancelAnimationFrame(this.raf); this.raf = 0;
    this.resizeObserver.disconnect(); this.intersectionObserver.disconnect();
    document.removeEventListener('visibilitychange', this.sync);
    this.motion.removeEventListener('change', this.sync);
    window.removeEventListener('pointermove', this.onPointer);
    window.removeEventListener('blur', this.clearPointer);
    document.documentElement.removeEventListener('pointerleave', this.clearPointer);
    this.ctx.clearRect(0, 0, this.width, this.height);
  }
  private random() {
    this.rng = (Math.imul(this.rng, 1664525) + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }
  private seed() {
    this.rng = this.settings.seed;
    this.time = 0;
    this.birds = Array.from({ length: this.settings.count }, (_, i) => {
      const a = i / Math.max(1, this.settings.count) * TAU + 0.4;
      return {
        x: this.width * (0.5 + Math.cos(a) * 0.33),
        y: this.height * (0.5 + Math.sin(a) * 0.31),
        heading: a + Math.PI / 2, phase: this.random() * TAU,
        size: 0.65 + this.random() * 0.45, turn: 0
      };
    });
  }
  private resize() {
    if (this.disposed) return;
    const rect = this.canvas.getBoundingClientRect();
    const oldW = this.width, oldH = this.height;
    this.width = Math.max(1, rect.width); this.height = Math.max(1, rect.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * dpr);
    this.canvas.height = Math.round(this.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Bound the grid for large / HiDPI displays; max ~33k cells.
    const gridScale = Math.max(1, Math.sqrt(this.width * this.height / 1150000));
    this.cw = 5 * gridScale; this.ch = 7 * gridScale;
    this.mask.width = Math.ceil(this.width / this.cw);
    this.mask.height = Math.ceil(this.height / this.ch);
    if (!oldW || !oldH) this.seed();
    else for (const b of this.birds) { b.x *= this.width / oldW; b.y *= this.height / oldH; }
    this.draw();
  }
  private sync = () => {
    cancelAnimationFrame(this.raf); this.raf = 0;
    if (this.disposed) return;
    if (this.motion.matches || this.settings.reducedMotion) { this.draw(); return; }
    if (this.paused || !this.visible || document.hidden || !this.width) return;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.frame);
  };
  private frame = (now: number) => {
    this.raf = 0;
    if (this.disposed || this.paused || !this.visible || document.hidden) return;
    const elapsed = (now - this.last) / 1000;
    if (elapsed >= 1 / this.settings.fps) {
      this.last = now - (elapsed % (1 / this.settings.fps)) * 1000;
      this.step(Math.min(0.1, elapsed)); this.draw(); this.frameCount++;
    }
    this.raf = requestAnimationFrame(this.frame);
  };
  private onPointer = (event: PointerEvent) => {
    const r = this.canvas.getBoundingClientRect();
    this.pointer = { x: event.clientX - r.left, y: event.clientY - r.top,
      active: event.pointerType !== 'touch' && event.clientX >= r.left && event.clientX <= r.right && event.clientY >= r.top && event.clientY <= r.bottom };
  };
  private clearPointer = () => { this.pointer.active = false; };

  private step(dt: number) {
    const activity = { idle: 1, working: 1.45, waiting: 0.65, done: 0.85 }[this.settings.state];
    const d = dt * this.settings.speed * activity;
    this.time += d;
    for (let i = 0; i < this.birds.length; i++) {
      const b = this.birds[i];
      const cx = this.width * (0.5 + Math.sin(this.time * 0.045 + i) * 0.08);
      const cy = this.height * (0.5 + Math.cos(this.time * 0.06 + i) * 0.1);
      const nx = (b.x - cx) / Math.max(100, this.width * 0.36);
      const ny = (b.y - cy) / Math.max(80, this.height * 0.34);
      const orbit = Math.atan2(ny, nx) + Math.PI / 2 + clamp((Math.hypot(nx, ny) - 1) * 0.9, -0.8, 0.8);
      let desired = orbit + Math.sin(this.time * 0.3 + b.phase) * 0.17;
      if (this.settings.interactive && this.pointer.active) {
        const dx = b.x - this.pointer.x, dy = b.y - this.pointer.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 150) desired += angle(Math.atan2(dy, dx) - desired) * (1 - dist / 150);
      }
      for (const other of this.birds) {
        if (other === b) continue;
        const dx = b.x - other.x, dy = b.y - other.y, dist = Math.hypot(dx, dy);
        if (dist > 0 && dist < 90) desired += angle(Math.atan2(dy, dx) - desired) * 0.12;
      }
      const turn = clamp(angle(desired - b.heading), -1.1, 1.1);
      b.heading += turn * d * 0.85;
      b.turn += (turn - b.turn) * Math.min(1, d * 4);
      const speed = (34 + b.size * 20) * Math.max(0.65, Math.min(this.width, this.height) / 750);
      b.x += Math.cos(b.heading) * speed * d;
      b.y += Math.sin(b.heading) * speed * d;
    }
  }

  /** Articulated swept wings, short forked tail, small head and pointed bill. */
  private birdShape(b: Bird) {
    const ctx = this.ink;
    const size = clamp(Math.min(this.width, this.height) / 780, 0.45, 1.5) * b.size * this.settings.scale;
    const flapCycle = (this.time * 0.95 + b.phase) % TAU;
    // Long glides alternate with a brief pair of shallow wing beats.
    const flap = flapCycle < 2.2 ? Math.sin(flapCycle * 5.7) * 0.2 : Math.sin(this.time + b.phase) * 0.035;
    ctx.save();
    ctx.translate(b.x / this.cw, b.y / this.ch);
    ctx.scale(size / this.cw, size / this.ch);
    ctx.rotate(b.heading);
    for (const side of [-1, 1]) {
      const reach = 1 + flap - b.turn * side * 0.13;
      ctx.save(); ctx.scale(1, side * reach);
      const g = ctx.createLinearGradient(0, 0, -15, 108);
      g.addColorStop(0, '#e0e0e0'); g.addColorStop(0.4, '#929292'); g.addColorStop(1, '#d0d0d0');
      ctx.fillStyle = g; ctx.beginPath();
      ctx.moveTo(15, 3); ctx.bezierCurveTo(10, 22, -1, 42, -5, 57);
      ctx.bezierCurveTo(-12, 76, -27, 98, -43, 115);
      ctx.lineTo(-30, 80); ctx.lineTo(-23, 62); ctx.lineTo(-26, 67);
      ctx.bezierCurveTo(-17, 35, -15, 22, -18, 5);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#494949'; ctx.lineWidth = 1.5;
      for (let j = 0; j < 6; j++) {
        ctx.beginPath(); ctx.moveTo(-7 - j * 1.8, 47 + j * 5);
        ctx.lineTo(-20 - j * 3.2, 76 + j * 6); ctx.stroke();
      }
      ctx.restore();
    }
    ctx.fillStyle = '#afafaf'; ctx.beginPath();
    ctx.ellipse(-6, 0, 32, 7.8, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#eaeaea'; ctx.beginPath(); ctx.ellipse(23, 0, 10, 6.2, 0, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.moveTo(29, -2.6); ctx.lineTo(42, 0); ctx.lineTo(29, 2.6); ctx.fill();
    // Forked tail and pale rump distinguish the petrel from a fish silhouette.
    ctx.fillStyle = '#999999'; ctx.beginPath(); ctx.moveTo(-26, -4); ctx.lineTo(-55, -14);
    ctx.lineTo(-47, 0); ctx.lineTo(-55, 14); ctx.lineTo(-26, 4); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(-29, -4.5, 7, 9);
    ctx.fillStyle = '#141414'; ctx.fillRect(25, -4.7, 2.7, 2.5);
    ctx.restore();
  }
  private draw() {
    if (this.disposed || !this.width) return;
    const ctx = this.ctx, p = palettes[this.settings.theme];
    ctx.clearRect(0, 0, this.width, this.height);
    if (!this.settings.transparent) { ctx.fillStyle = p.bg; ctx.fillRect(0, 0, this.width, this.height); }
    ctx.globalAlpha = this.settings.opacity;
    // Sparse salt spray and long wind / swell contours, all drawn as text.
    ctx.font = `${this.ch}px Consolas, "Courier New", monospace`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    for (let row = 0; row < this.mask.height; row += 2) {
      for (let col = 0; col < this.mask.width; col += 3) {
        const key = ((Math.imul(col + 13, 374761393) ^ Math.imul(row + 7, 668265263)) >>> 0) / 4294967296;
        if (key > 0.14) continue;
        ctx.fillStyle = p.spray;
        ctx.globalAlpha = this.settings.opacity * (0.15 + 0.25 * (1 + Math.sin(this.time * 0.3 + key * 50)));
        ctx.fillText(key < 0.015 ? '+' : '.', col * this.cw, row * this.ch);
      }
    }
    ctx.fillStyle = p.wave;
    ctx.globalAlpha = this.settings.opacity * 0.65;
    for (let j = 0; j < 7; j++) {
      for (let x = 0; x < this.width; x += this.cw * 2) {
        const y = this.height * (0.13 + j * 0.135) + Math.sin(x / 190 + j * 1.3 + this.time * 0.1) * 22 + Math.cos(x / 330 - this.time * 0.08) * 17;
        if (Math.sin(x / 85 + j + this.time * 0.08) > 0.25) ctx.fillText('·', x, y);
      }
    }
    this.ink.clearRect(0, 0, this.mask.width, this.mask.height);
    this.birds.forEach(b => this.birdShape(b));
    const data = this.ink.getImageData(0, 0, this.mask.width, this.mask.height).data;
    const glyphs = '.,:;=+*%#@';
    ctx.globalAlpha = this.settings.opacity;
    ctx.font = `bold ${this.ch + 1}px Consolas, "Courier New", monospace`;
    for (let row = 0; row < this.mask.height; row++) for (let col = 0; col < this.mask.width; col++) {
      const offset = (row * this.mask.width + col) * 4;
      if (data[offset + 3] < 40) continue;
      const light = data[offset] / 255;
      const grain = ((col * 17 + row * 31) % 13) / 13;
      const glyph = glyphs[clamp(Math.floor(light * 7 + grain * 2), 0, 9)];
      const bright = this.settings.theme === 'day' ? 0.55 + light * 0.6 : 0.32 + light * 0.9;
      const [r, g, b] = p.body;
      ctx.fillStyle = `rgb(${Math.round(r * bright)},${Math.round(g * bright)},${Math.round(b * bright)})`;
      const x = (col + 0.5) * this.cw, y = (row + 0.5) * this.ch;
      // Soft protected ellipse around the host's centered reading / input area.
      const protection = Math.exp(-Math.pow((x - this.width / 2) / (this.width * 0.26), 4) - Math.pow((y - this.height / 2) / (this.height * 0.19), 4));
      ctx.globalAlpha = this.settings.opacity * Math.min(1, data[offset + 3] / 180) * (1 - this.settings.centerClear * protection);
      if (this.settings.texture === 'tiles' && data[offset + 3] > 155) {
        ctx.fillRect(col * this.cw + 0.6, row * this.ch + 0.6, this.cw - 1.2, this.ch - 1.2);
        ctx.fillStyle = this.settings.theme === 'day' ? '#edf4fc' : '#08131a';
        ctx.globalAlpha *= 0.72;
      }
      ctx.fillText(glyph, (col + 0.5) * this.cw, (row + 0.5) * this.ch);
    }
    ctx.globalAlpha = 1;
  }
}
