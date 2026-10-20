import { readFile, writeFile, mkdir, copyFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('..', import.meta.url));
const source = await readFile(resolve(root, 'index.html'), 'utf8');
const output = resolve(root, 'showcase');
await mkdir(resolve(output, 'assets'), { recursive: true });
await mkdir(resolve(output, 'assets/fonts'), { recursive: true });
const fontRoot = resolve(root, 'node_modules/@fontsource/noto-sans-sc');
const fontCss = await readFile(resolve(fontRoot, '400.css'), 'utf8');
const points = [...new Set([...source + '借鉴 / Inspired by stackedlol/ascii-sharks · Rendered with HyperFrames'].map(c => c.codePointAt(0)))];
const faces = [];
for (const block of fontCss.match(/@font-face\s*\{[\s\S]*?\}/g)) {
  const ranges = block.match(/unicode-range:\s*([^;]+)/)?.[1].split(',') ?? [];
  const needed = ranges.some(range => {
    const [first, last = first] = range.trim().replace(/^U\+/i, '').split('-').map(x => parseInt(x, 16));
    return points.some(point => point >= first && point <= last);
  });
  if (!needed) continue;
  const file = block.match(/url\(\.\/files\/([^)]*\.woff2)\)/)[1];
  await copyFile(resolve(fontRoot, 'files', file), resolve(output, 'assets/fonts', file));
  faces.push(block.replace(/src:[^;]+;/, `src:url('assets/fonts/${file}') format('woff2');`));
}
await copyFile(resolve(fontRoot, 'LICENSE'), resolve(output, 'assets/fonts/OFL-LICENSE.txt'));
let body = source.match(/<body>([\s\S]*?)<script type="module"/)[1];
body = body.replace('<petrel-background id="petrels"></petrel-background>', '<canvas id="petrels" class="clip" data-start="0" data-duration="10" data-track-index="0" data-layout-allow-overflow aria-hidden="true"></canvas>')
  .replace('<section id="reference" hidden', '<section id="reference"')
  .replace('<button id="view-toggle">聊天布局</button>', '<span class="video-label">10 SECOND SHOWCASE</span>')
  .replace('<button id="clean" aria-label="隐藏控制面板">纯背景 ↗</button>', '')
  .replace('5 PETRELS IN FLIGHT', '4 PETRELS IN FLIGHT');
const style = (await readFile(resolve(root, 'src/style.css'), 'utf8')) + '\n' + (await readFile(resolve(root, 'src/reference.css'), 'utf8'));
// Generic families use the render host's installed glyph coverage; no proprietary fonts are redistributed.
const css = style.replaceAll('"Segoe UI","Microsoft YaHei",sans-serif', 'sans-serif')
  .replaceAll('"Segoe UI",sans-serif', 'sans-serif').replaceAll('Consolas,monospace', 'monospace');
await writeFile(resolve(output, 'assets/project.css'), css + `
body{width:1920px;height:1080px;overflow:hidden}
#root{position:relative;width:100%;height:100%;overflow:hidden}
#petrels{width:100%;height:100%}
.video-label{font:11px monospace;letter-spacing:.08em}
.video-credit{position:absolute;bottom:28px;left:0;right:0;text-align:center;color:#445a7f;font:14px sans-serif;pointer-events:none}
footer>div{display:none}.header-right>span:not(.video-label){display:none}
#reference>p{color:#526780}body.light .wordmark small,body.light .header-right .video-label,body.light #flight-status{color:#526780}
body.light .bird-mark{color:#526780}.composer-bottom{color:#526780}
`);
await copyFile(resolve(root, 'dist/sdk/petrel.global.js'), resolve(output, 'assets/petrel.global.js'));
await copyFile(resolve(root, 'node_modules/gsap/dist/gsap.min.js'), resolve(output, 'assets/gsap.min.js'));
const gsap = await readFile(resolve(root, 'node_modules/gsap/dist/gsap.min.js'), 'utf8');
await writeFile(resolve(output, 'assets/GSAP-NOTICE.txt'), gsap.match(/^\/\*![\s\S]*?\*\//)[0] + '\n');
await writeFile(resolve(output, 'index.html'), `<!doctype html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=1920,height=1080">
<title>Agent Petrel · 10 second showcase</title><link rel="stylesheet" href="assets/project.css">
<style>${faces.join('\n')}body{font-family:'Noto Sans SC',sans-serif}.video-credit{font-family:'Noto Sans SC',sans-serif}</style>
<script src="assets/gsap.min.js"></script></head>
<body class="reference-mode light"><div id="root" data-composition-id="main" data-start="0" data-duration="10" data-width="1920" data-height="1080">
${body}
<div class="video-credit">借鉴 / Inspired by stackedlol/ascii-sharks · Rendered with HyperFrames</div>
</div>
<script src="assets/petrel.global.js"></script>
<script>
document.fonts.ready.then(() => {
  const engine = new AgentPetrel.PetrelEngine(document.getElementById('petrels'), {theme:'day',count:4,scale:1.4,centerClear:0.9,interactive:false});
  const clock = { seconds: 0 };
  engine.renderAt(0);
  const timeline = gsap.timeline({ paused: true });
  timeline.to(clock, { seconds: 10, duration: 10, ease: 'none', onUpdate: () => engine.renderAt(clock.seconds) }, 0);
  window.__timelines['main'] = timeline;
});
</script></body></html>`);
console.log('Prepared a 10s HyperFrames composition using the actual project DOM, CSS and engine.');
