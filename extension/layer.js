// IIFE is deliberately repeatable: clicking again removes the element and engine.
(() => {
  const id = 'agent-petrel-decoration-v1';
  const old = document.getElementById(id);
  if (old) { old.remove(); return; }
  const layer = document.createElement('petrel-background');
  // Only inspect presentation colors, never page text or form values.
  const surface = [document.body, document.documentElement].filter(Boolean)
    .map(el => getComputedStyle(el).backgroundColor)
    .find(color => color !== 'rgba(0, 0, 0, 0)' && color !== 'transparent');
  const rgb = surface?.match(/[\d.]+/g)?.slice(0, 3).map(Number);
  const light = rgb ? rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722 > 150 : !matchMedia('(prefers-color-scheme: dark)').matches;
  layer.id = id;
  layer.setAttribute('theme', light ? 'day' : 'storm');
  layer.setAttribute('transparent', 'true');
  layer.setAttribute('opacity', '0.28');
  layer.setAttribute('count', '4');
  layer.setAttribute('interactive', 'false');
  layer.style.cssText = `position:fixed!important;inset:0!important;z-index:2147483646!important;pointer-events:none!important;mix-blend-mode:${light ? 'multiply' : 'screen'}!important;mask-image:linear-gradient(90deg,#000,transparent 34%,transparent 66%,#000)!important;`;
  document.documentElement.append(layer);
})();
