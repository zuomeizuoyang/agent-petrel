# Bundled SDK

`<plugin-root>/runtime/petrel.global.js` is a standalone browser bundle with the global `AgentPetrel` and the `<petrel-background>` custom element. `petrel.js` is the equivalent ES module. Copy the chosen file into the target web project's public assets; it has no runtime imports. Both include the same engine as the preview.

```html
<script src="/petrel.global.js"></script>
<style>
  .agent-shell { position:relative; isolation:isolate; min-height:100vh; }
  .agent-content { position:relative; z-index:1; }
</style>
<div class="agent-shell">
  <petrel-background theme="day" count="4" speed="0.65" center-clear="0.9"></petrel-background>
  <div class="agent-content">Your existing interface</div>
</div>
```

The background uses absolute positioning inside its parent. Do not cover or intercept the foreground. Match day/storm/moon/dawn to the page's palette. Removing the custom element disposes the engine.

For programmatic Canvas usage:

```js
const engine = new AgentPetrel.PetrelEngine(canvas, { count: 4, theme: 'day' });
engine.configure({ state: 'working', speed: 0.8 });
engine.pause();
engine.resume();
// Deterministic video frame; pauses live playback:
engine.renderAt(4);
// On component unmount:
engine.destroy();
```

`mountPetrel(host, options)` mounts a reusable Web Component. The caller owns host sizing and content layering. Exports: PetrelEngine, PetrelBackground, mountPetrel, defaults, normalize. Options include count, speed, opacity, scale, fps, theme, state, seed, texture (`tiles` or `glyphs`), centerClear, transparent, interactive and reducedMotion. Respect system reduced-motion preferences. State is explicitly supplied by the host; do not claim automatic agent-state detection.

For React/Vue, instantiate after mount and call destroy/remove on unmount; SSR must load the SDK only in the browser. This SDK cannot inject into a native desktop application's main chat view.
