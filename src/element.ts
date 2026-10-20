import { PetrelEngine } from './engine';
import type { PetrelOptions } from './options';
import { defaults } from './options';
const numeric = ['count', 'speed', 'opacity', 'scale', 'fps', 'seed', 'center-clear'];
const boolean = ['interactive', 'transparent', 'reduced-motion'];
export class PetrelBackground extends HTMLElement {
  static observedAttributes = [...numeric, ...boolean, 'theme', 'state', 'texture', 'paused'];
  private canvas: HTMLCanvasElement;
  private engine?: PetrelEngine;
  constructor() {
    super();
    const root = this.attachShadow({ mode: 'open' });
    const style = document.createElement('style');
    style.textContent = ':host{display:block;position:absolute;inset:0;pointer-events:none;overflow:hidden;contain:strict}canvas{display:block;width:100%;height:100%;pointer-events:none}';
    this.canvas = document.createElement('canvas'); this.canvas.setAttribute('aria-hidden', 'true');
    root.append(style, this.canvas);
  }
  connectedCallback() { this.engine = new PetrelEngine(this.canvas, this.read()); this.applyPause(); }
  disconnectedCallback() { this.engine?.destroy(); this.engine = undefined; }
  attributeChangedCallback() { this.engine?.configure(this.read()); this.applyPause(); }
  get controller() { return this.engine; }
  private applyPause() { this.hasAttribute('paused') ? this.engine?.pause() : this.engine?.resume(); }
  private read(): Partial<PetrelOptions> {
    const value: Record<string, unknown> = {};
    for (const name of PetrelBackground.observedAttributes) {
      if (name === 'paused' || !this.hasAttribute(name)) continue;
      const raw = this.getAttribute(name)!;
      const key = name === 'reduced-motion' ? 'reducedMotion' : name === 'center-clear' ? 'centerClear' : name;
      value[key] = numeric.includes(name) ? (raw.trim() ? Number(raw) : NaN) : boolean.includes(name) ? raw !== 'false' : raw;
    }
    // Missing attributes must restore defaults on removal.
    return { ...defaults, ...value };
  }
}
export function definePetrel() { if (!customElements.get('petrel-background')) customElements.define('petrel-background', PetrelBackground); }
definePetrel();
