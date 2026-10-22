var z = Object.defineProperty;
var R = (n, e, t) => e in n ? z(n, e, { enumerable: !0, configurable: !0, writable: !0, value: t }) : n[e] = t;
var a = (n, e, t) => R(n, typeof e != "symbol" ? e + "" : e, t);
const P = {
  count: 5,
  speed: 0.65,
  opacity: 0.8,
  scale: 1,
  fps: 30,
  theme: "storm",
  state: "idle",
  interactive: !0,
  transparent: !1,
  reducedMotion: !1,
  seed: 87,
  texture: "tiles",
  centerClear: 0.7
}, u = (n, e, t, i) => typeof n == "number" && Number.isFinite(n) ? Math.min(t, Math.max(e, n)) : i;
function A(n, e = P) {
  return {
    count: Math.round(u(n.count, 0, 12, e.count)),
    speed: u(n.speed, 0, 3, e.speed),
    opacity: u(n.opacity, 0, 1, e.opacity),
    scale: u(n.scale, 0.3, 2, e.scale),
    fps: Math.round(u(n.fps, 1, 60, e.fps)),
    seed: Math.round(u(n.seed, 1, 2147483646, e.seed)),
    theme: ["storm", "moon", "dawn", "day"].includes(n.theme ?? "") ? n.theme : e.theme,
    state: ["idle", "working", "waiting", "done"].includes(n.state ?? "") ? n.state : e.state,
    interactive: typeof n.interactive == "boolean" ? n.interactive : e.interactive,
    transparent: typeof n.transparent == "boolean" ? n.transparent : e.transparent,
    reducedMotion: typeof n.reducedMotion == "boolean" ? n.reducedMotion : e.reducedMotion,
    texture: ["glyphs", "tiles"].includes(n.texture ?? "") ? n.texture : e.texture,
    centerClear: u(n.centerClear, 0, 1, e.centerClear)
  };
}
const L = {
  storm: { bg: "#090f15", body: [116, 163, 176], accent: "#94cfc4", spray: "#31515d", wave: "#1d3541" },
  moon: { bg: "#0c0d17", body: [165, 173, 203], accent: "#ccd6fb", spray: "#41455f", wave: "#2c3044" },
  dawn: { bg: "#151217", body: [197, 163, 147], accent: "#edc5a7", spray: "#62484c", wave: "#3d3038" },
  day: { bg: "#f6fafb", body: [34, 65, 135], accent: "#3153aa", spray: "#7594b2", wave: "#c1d1de" }
}, p = Math.PI * 2, v = (n, e, t) => Math.max(e, Math.min(t, n)), k = (n) => Math.atan2(Math.sin(n), Math.cos(n));
class O {
  constructor(e, t = {}) {
    a(this, "ctx");
    a(this, "mask", document.createElement("canvas"));
    a(this, "ink");
    a(this, "birds", []);
    a(this, "width", 0);
    a(this, "height", 0);
    a(this, "cw", 5);
    a(this, "ch", 7);
    a(this, "time", 0);
    a(this, "raf", 0);
    a(this, "last", 0);
    a(this, "rng", 87);
    a(this, "paused", !1);
    a(this, "disposed", !1);
    a(this, "visible", !0);
    a(this, "resizeObserver");
    a(this, "intersectionObserver");
    a(this, "motion", matchMedia("(prefers-reduced-motion: reduce)"));
    a(this, "pointer", { x: 0, y: 0, active: !1 });
    a(this, "settings");
    a(this, "frameCount", 0);
    a(this, "sync", () => {
      if (cancelAnimationFrame(this.raf), this.raf = 0, !this.disposed) {
        if (this.motion.matches || this.settings.reducedMotion) {
          this.draw();
          return;
        }
        this.paused || !this.visible || document.hidden || !this.width || (this.last = performance.now(), this.raf = requestAnimationFrame(this.frame));
      }
    });
    a(this, "frame", (e) => {
      if (this.raf = 0, this.disposed || this.paused || !this.visible || document.hidden) return;
      const t = (e - this.last) / 1e3;
      t >= 1 / this.settings.fps && (this.last = e - t % (1 / this.settings.fps) * 1e3, this.step(Math.min(0.1, t)), this.draw(), this.frameCount++), this.raf = requestAnimationFrame(this.frame);
    });
    a(this, "onPointer", (e) => {
      const t = this.canvas.getBoundingClientRect();
      this.pointer = {
        x: e.clientX - t.left,
        y: e.clientY - t.top,
        active: e.pointerType !== "touch" && e.clientX >= t.left && e.clientX <= t.right && e.clientY >= t.top && e.clientY <= t.bottom
      };
    });
    a(this, "clearPointer", () => {
      this.pointer.active = !1;
    });
    this.canvas = e;
    const i = e.getContext("2d", { alpha: !0 }), h = this.mask.getContext("2d", { willReadFrequently: !0 });
    if (!i || !h) throw new Error("Canvas 2D is required");
    this.ctx = i, this.ink = h, this.settings = A(t), this.resizeObserver = new ResizeObserver(() => this.resize()), this.intersectionObserver = new IntersectionObserver(([s]) => {
      this.visible = s.isIntersecting, this.sync();
    }), this.resizeObserver.observe(e), this.intersectionObserver.observe(e), document.addEventListener("visibilitychange", this.sync), this.motion.addEventListener("change", this.sync), window.addEventListener("pointermove", this.onPointer, { passive: !0 }), window.addEventListener("blur", this.clearPointer), document.documentElement.addEventListener("pointerleave", this.clearPointer), this.resize(), this.sync();
  }
  get options() {
    return { ...this.settings };
  }
  get stats() {
    return { frames: this.frameCount, birds: this.birds.length, running: this.raf !== 0, time: this.time, destroyed: this.disposed };
  }
  configure(e) {
    if (this.disposed) return;
    const t = A(e, this.settings), i = t.count !== this.settings.count || t.seed !== this.settings.seed;
    this.settings = t, i && this.seed(), this.draw(), this.sync();
  }
  pause() {
    this.paused = !0, this.sync();
  }
  resume() {
    this.paused = !1, this.sync();
  }
  /** Seek a reproducible frame for video export. This leaves realtime playback paused. */
  renderAt(e) {
    if (this.disposed) return;
    if (!Number.isFinite(e) || e < 0 || e > 600)
      throw new RangeError("renderAt expects a time between 0 and 600 seconds");
    this.pause(), this.pointer.active = !1, this.seed();
    const t = Math.floor(e * 60 + 1e-8);
    for (let h = 0; h < t; h++) this.step(1 / 60);
    const i = e - t / 60;
    i > 1e-8 && this.step(i), this.draw();
  }
  destroy() {
    this.disposed || (this.disposed = !0, cancelAnimationFrame(this.raf), this.raf = 0, this.resizeObserver.disconnect(), this.intersectionObserver.disconnect(), document.removeEventListener("visibilitychange", this.sync), this.motion.removeEventListener("change", this.sync), window.removeEventListener("pointermove", this.onPointer), window.removeEventListener("blur", this.clearPointer), document.documentElement.removeEventListener("pointerleave", this.clearPointer), this.ctx.clearRect(0, 0, this.width, this.height));
  }
  random() {
    return this.rng = Math.imul(this.rng, 1664525) + 1013904223 >>> 0, this.rng / 4294967296;
  }
  seed() {
    this.rng = this.settings.seed, this.time = 0, this.birds = Array.from({ length: this.settings.count }, (e, t) => {
      const i = t / Math.max(1, this.settings.count) * p + 0.4;
      return {
        x: this.width * (0.5 + Math.cos(i) * 0.33),
        y: this.height * (0.5 + Math.sin(i) * 0.31),
        heading: i + Math.PI / 2,
        phase: this.random() * p,
        size: 0.65 + this.random() * 0.45,
        turn: 0
      };
    });
  }
  resize() {
    if (this.disposed) return;
    const e = this.canvas.getBoundingClientRect(), t = this.width, i = this.height;
    this.width = Math.max(1, e.width), this.height = Math.max(1, e.height);
    const h = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.width * h), this.canvas.height = Math.round(this.height * h), this.ctx.setTransform(h, 0, 0, h, 0, 0);
    const s = Math.max(1, Math.sqrt(this.width * this.height / 115e4));
    if (this.cw = 5 * s, this.ch = 7 * s, this.mask.width = Math.ceil(this.width / this.cw), this.mask.height = Math.ceil(this.height / this.ch), !t || !i) this.seed();
    else for (const r of this.birds)
      r.x *= this.width / t, r.y *= this.height / i;
    this.draw();
  }
  step(e) {
    const t = { idle: 1, working: 1.45, waiting: 0.65, done: 0.85 }[this.settings.state], i = e * this.settings.speed * t;
    this.time += i;
    for (let h = 0; h < this.birds.length; h++) {
      const s = this.birds[h], r = this.width * (0.5 + Math.sin(this.time * 0.045 + h) * 0.08), o = this.height * (0.5 + Math.cos(this.time * 0.06 + h) * 0.1), c = (s.x - r) / Math.max(100, this.width * 0.36), d = (s.y - o) / Math.max(80, this.height * 0.34);
      let l = Math.atan2(d, c) + Math.PI / 2 + v((Math.hypot(c, d) - 1) * 0.9, -0.8, 0.8) + Math.sin(this.time * 0.3 + s.phase) * 0.17;
      if (this.settings.interactive && this.pointer.active) {
        const f = s.x - this.pointer.x, m = s.y - this.pointer.y, g = Math.hypot(f, m);
        g < 150 && (l += k(Math.atan2(m, f) - l) * (1 - g / 150));
      }
      for (const f of this.birds) {
        if (f === s) continue;
        const m = s.x - f.x, g = s.y - f.y, b = Math.hypot(m, g);
        b > 0 && b < 90 && (l += k(Math.atan2(g, m) - l) * 0.12);
      }
      const y = v(k(l - s.heading), -1.1, 1.1);
      s.heading += y * i * 0.85, s.turn += (y - s.turn) * Math.min(1, i * 4);
      const w = (34 + s.size * 20) * Math.max(0.65, Math.min(this.width, this.height) / 750);
      s.x += Math.cos(s.heading) * w * i, s.y += Math.sin(s.heading) * w * i;
    }
  }
  /** Articulated swept wings, short forked tail, small head and pointed bill. */
  birdShape(e) {
    const t = this.ink, i = v(Math.min(this.width, this.height) / 780, 0.45, 1.5) * e.size * this.settings.scale, h = (this.time * 0.95 + e.phase) % p, s = h < 2.2 ? Math.sin(h * 5.7) * 0.2 : Math.sin(this.time + e.phase) * 0.035;
    t.save(), t.translate(e.x / this.cw, e.y / this.ch), t.scale(i / this.cw, i / this.ch), t.rotate(e.heading);
    for (const r of [-1, 1]) {
      const o = 1 + s - e.turn * r * 0.13;
      t.save(), t.scale(1, r * o);
      const c = t.createLinearGradient(0, 0, -15, 108);
      c.addColorStop(0, "#e0e0e0"), c.addColorStop(0.4, "#929292"), c.addColorStop(1, "#d0d0d0"), t.fillStyle = c, t.beginPath(), t.moveTo(15, 3), t.bezierCurveTo(10, 22, -1, 42, -5, 57), t.bezierCurveTo(-12, 76, -27, 98, -43, 115), t.lineTo(-30, 80), t.lineTo(-23, 62), t.lineTo(-26, 67), t.bezierCurveTo(-17, 35, -15, 22, -18, 5), t.closePath(), t.fill(), t.strokeStyle = "#494949", t.lineWidth = 1.5;
      for (let d = 0; d < 6; d++)
        t.beginPath(), t.moveTo(-7 - d * 1.8, 47 + d * 5), t.lineTo(-20 - d * 3.2, 76 + d * 6), t.stroke();
      t.restore();
    }
    t.fillStyle = "#afafaf", t.beginPath(), t.ellipse(-6, 0, 32, 7.8, 0, 0, p), t.fill(), t.fillStyle = "#eaeaea", t.beginPath(), t.ellipse(23, 0, 10, 6.2, 0, 0, p), t.fill(), t.beginPath(), t.moveTo(29, -2.6), t.lineTo(42, 0), t.lineTo(29, 2.6), t.fill(), t.fillStyle = "#999999", t.beginPath(), t.moveTo(-26, -4), t.lineTo(-55, -14), t.lineTo(-47, 0), t.lineTo(-55, 14), t.lineTo(-26, 4), t.fill(), t.fillStyle = "#ffffff", t.fillRect(-29, -4.5, 7, 9), t.fillStyle = "#141414", t.fillRect(25, -4.7, 2.7, 2.5), t.restore();
  }
  draw() {
    if (this.disposed || !this.width) return;
    const e = this.ctx, t = L[this.settings.theme];
    e.clearRect(0, 0, this.width, this.height), this.settings.transparent || (e.fillStyle = t.bg, e.fillRect(0, 0, this.width, this.height)), e.globalAlpha = this.settings.opacity, e.font = `${this.ch}px Consolas, "Courier New", monospace`, e.textAlign = "center", e.textBaseline = "middle";
    for (let s = 0; s < this.mask.height; s += 2)
      for (let r = 0; r < this.mask.width; r += 3) {
        const o = ((Math.imul(r + 13, 374761393) ^ Math.imul(s + 7, 668265263)) >>> 0) / 4294967296;
        o > 0.14 || (e.fillStyle = t.spray, e.globalAlpha = this.settings.opacity * (0.15 + 0.25 * (1 + Math.sin(this.time * 0.3 + o * 50))), e.fillText(o < 0.015 ? "+" : ".", r * this.cw, s * this.ch));
      }
    e.fillStyle = t.wave, e.globalAlpha = this.settings.opacity * 0.65;
    for (let s = 0; s < 7; s++)
      for (let r = 0; r < this.width; r += this.cw * 2) {
        const o = this.height * (0.13 + s * 0.135) + Math.sin(r / 190 + s * 1.3 + this.time * 0.1) * 22 + Math.cos(r / 330 - this.time * 0.08) * 17;
        Math.sin(r / 85 + s + this.time * 0.08) > 0.25 && e.fillText("·", r, o);
      }
    this.ink.clearRect(0, 0, this.mask.width, this.mask.height), this.birds.forEach((s) => this.birdShape(s));
    const i = this.ink.getImageData(0, 0, this.mask.width, this.mask.height).data, h = ".,:;=+*%#@";
    e.globalAlpha = this.settings.opacity, e.font = `bold ${this.ch + 1}px Consolas, "Courier New", monospace`;
    for (let s = 0; s < this.mask.height; s++) for (let r = 0; r < this.mask.width; r++) {
      const o = (s * this.mask.width + r) * 4;
      if (i[o + 3] < 40) continue;
      const c = i[o] / 255, d = (r * 17 + s * 31) % 13 / 13, C = h[v(Math.floor(c * 7 + d * 2), 0, 9)], l = this.settings.theme === "day" ? 0.55 + c * 0.6 : 0.32 + c * 0.9, [y, w, f] = t.body;
      e.fillStyle = `rgb(${Math.round(y * l)},${Math.round(w * l)},${Math.round(f * l)})`;
      const m = (r + 0.5) * this.cw, g = (s + 0.5) * this.ch, b = Math.exp(-Math.pow((m - this.width / 2) / (this.width * 0.26), 4) - Math.pow((g - this.height / 2) / (this.height * 0.19), 4));
      e.globalAlpha = this.settings.opacity * Math.min(1, i[o + 3] / 180) * (1 - this.settings.centerClear * b), this.settings.texture === "tiles" && i[o + 3] > 155 && (e.fillRect(r * this.cw + 0.6, s * this.ch + 0.6, this.cw - 1.2, this.ch - 1.2), e.fillStyle = this.settings.theme === "day" ? "#edf4fc" : "#08131a", e.globalAlpha *= 0.72), e.fillText(C, (r + 0.5) * this.cw, (s + 0.5) * this.ch);
    }
    e.globalAlpha = 1;
  }
}
const T = ["count", "speed", "opacity", "scale", "fps", "seed", "center-clear"], E = ["interactive", "transparent", "reduced-motion"], x = class x extends HTMLElement {
  constructor() {
    super();
    a(this, "canvas");
    a(this, "engine");
    const t = this.attachShadow({ mode: "open" }), i = document.createElement("style");
    i.textContent = ":host{display:block;position:absolute;inset:0;pointer-events:none;overflow:hidden;contain:strict}canvas{display:block;width:100%;height:100%;pointer-events:none}", this.canvas = document.createElement("canvas"), this.canvas.setAttribute("aria-hidden", "true"), t.append(i, this.canvas);
  }
  connectedCallback() {
    this.engine = new O(this.canvas, this.read()), this.applyPause();
  }
  disconnectedCallback() {
    var t;
    (t = this.engine) == null || t.destroy(), this.engine = void 0;
  }
  attributeChangedCallback() {
    var t;
    (t = this.engine) == null || t.configure(this.read()), this.applyPause();
  }
  get controller() {
    return this.engine;
  }
  applyPause() {
    var t, i;
    this.hasAttribute("paused") ? (t = this.engine) == null || t.pause() : (i = this.engine) == null || i.resume();
  }
  read() {
    const t = {};
    for (const i of x.observedAttributes) {
      if (i === "paused" || !this.hasAttribute(i)) continue;
      const h = this.getAttribute(i), s = i === "reduced-motion" ? "reducedMotion" : i === "center-clear" ? "centerClear" : i;
      t[s] = T.includes(i) ? h.trim() ? Number(h) : NaN : E.includes(i) ? h !== "false" : h;
    }
    return { ...P, ...t };
  }
};
a(x, "observedAttributes", [...T, ...E, "theme", "state", "texture", "paused"]);
let M = x;
function S() {
  customElements.get("petrel-background") || customElements.define("petrel-background", M);
}
S();
function N(n, e = {}) {
  S();
  const t = Array.from(n.children).find((h) => h instanceof M);
  if (t) return t;
  const i = document.createElement("petrel-background");
  for (const [h, s] of Object.entries(e))
    i.setAttribute(h === "reducedMotion" ? "reduced-motion" : h === "centerClear" ? "center-clear" : h, String(s));
  return n.prepend(i), i;
}
export {
  M as PetrelBackground,
  O as PetrelEngine,
  P as defaults,
  S as definePetrel,
  N as mountPetrel,
  A as normalize
};
