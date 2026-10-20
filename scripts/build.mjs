import { build } from 'vite';
import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
await build({ base: './' });
await build({ configFile: false, build: { outDir: 'dist/sdk', emptyOutDir: true, lib: {
  entry: 'src/index.ts', name: 'AgentPetrel', formats: ['es', 'iife'],
  fileName: format => format === 'es' ? 'petrel.js' : 'petrel.global.js'
} } });
execFileSync(process.execPath, ['node_modules/typescript/bin/tsc', '--noEmit', 'false', '--declaration', '--emitDeclarationOnly', '--outDir', 'dist/sdk/types'], { stdio: 'inherit' });
const html = await readFile('dist/index.html', 'utf8');
const jsPath = html.match(/<script[^>]*src="([^"]+)"[^>]*><\/script>/)?.[1];
const cssPath = html.match(/<link[^>]*href="([^"]+\.css)"[^>]*>/)?.[1];
if (!jsPath || !cssPath) throw new Error('Expected built JS and CSS assets');
const js = await readFile('dist/' + jsPath.replace(/^\.\//, ''), 'utf8');
const css = await readFile('dist/' + cssPath.replace(/^\.\//, ''), 'utf8');
const standalone = html.replace(/<script[^>]*src="[^"]+"[^>]*><\/script>/, () => `<script type="module">${js.replace(/<\/script/gi, '<\\/script')}</script>`)
  .replace(/<link[^>]*href="[^"]+\.css"[^>]*>/, () => `<style>${css}</style>`);
await writeFile('dist/petrel-preview.html', standalone);
await mkdir('dist/extension', { recursive: true });
const bundle = await readFile('dist/sdk/petrel.global.js', 'utf8');
const layer = await readFile('extension/layer.js', 'utf8');
await writeFile('dist/extension/content.js', bundle + '\n' + layer);
for (const file of ['manifest.json', 'service-worker.js']) await copyFile('extension/' + file, 'dist/extension/' + file);
console.log('Built: offline preview, ES/IIFE SDK, declarations, opt-in browser extension.');
