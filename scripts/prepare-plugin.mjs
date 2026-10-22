import { mkdir, readFile, writeFile, copyFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const plugin = resolve(root, 'plugins/agent-petrel');
const { version } = JSON.parse(await readFile(resolve(root, 'package.json'), 'utf8'));
const description = '在 Codex 侧栏预览 ASCII 海燕、调整主题与鸟群，并接入自己的 agent 网页。';
const ui = {
  displayName: 'Agent Petrel · 海燕',
  shortDescription: 'ASCII 海燕动态背景与网页接入',
  longDescription: '离线海燕预览、四种配色、鸟群参数与通用 Canvas SDK。通过 Codex 内置浏览器在侧栏展示，不替换原生主聊天背景。无需 API key 或账号。',
  developerName: 'zuomeizuoyang',
  category: 'Productivity',
  websiteURL: 'https://github.com/zuomeizuoyang/agent-petrel',
  defaultPrompt: ['打开海燕动态背景', '把海燕改成月光银，3 只，速度 0.5', '把海燕背景接入这个网页'],
  brandColor: '#3153aa'
};
const manifest = {
  name: 'agent-petrel', version, description,
  author: { name: 'zuomeizuoyang' },
  repository: 'https://github.com/zuomeizuoyang/agent-petrel',
  license: 'MIT'
};
await mkdir(resolve(plugin, '.codex-plugin'), { recursive: true });
await mkdir(resolve(plugin, 'runtime'), { recursive: true });
await writeFile(resolve(plugin, '.codex-plugin/plugin.json'), JSON.stringify({ ...manifest, skills: './skills/', interface: ui }, null, 2) + '\n');
await writeFile(resolve(plugin, 'plugin.json'), JSON.stringify({
  $schema: 'https://agent-plugins.org/schemas/1.0.0/plugin.schema.json',
  ...manifest,
  extensions: { 'com.openai': { interface: ui } }
}, null, 2) + '\n');
for (const [from, to] of [
  ['dist/petrel-preview.html', 'runtime/preview.html'],
  ['dist/sdk/petrel.js', 'runtime/petrel.js'],
  ['dist/sdk/petrel.global.js', 'runtime/petrel.global.js'],
  ['LICENSE', 'LICENSE']
]) await copyFile(resolve(root, from), resolve(plugin, to));
const notices = await readFile(resolve(root, 'THIRD_PARTY_NOTICES.md'), 'utf8');
await writeFile(resolve(plugin, 'THIRD_PARTY_NOTICES.md'), notices.split('## Video tooling')[0] + 'The plugin runtime has no third-party runtime dependencies. Video tooling and its licenses are included separately in the full project repository.\n');
console.log(`Prepared Codex plugin ${version}: plugins/agent-petrel (no npm install needed by users).`);
