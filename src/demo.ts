import { PetrelBackground } from './element';
import { defaults } from './options';
import './style.css';
import './reference.css';
const background = document.querySelector<PetrelBackground>('#petrels')!;
const query = new URLSearchParams(location.search);
if (query.has('embed')) document.body.classList.add('embed');
for (const key of PetrelBackground.observedAttributes) if (query.has(key)) background.setAttribute(key, query.get(key)!);
try {
  if (!query.size) {
    const config = JSON.parse(localStorage.getItem('petrel-settings') ?? '{}');
    for (const key of ['count', 'speed', 'opacity', 'theme', 'state']) if (key in config) background.setAttribute(key, String(config[key]));
  }
} catch { /* Storage disabled or an old config: use defaults. */ }
function syncUI() {
  for (const key of ['count', 'speed', 'opacity', 'state'] as const) {
    const input = document.getElementById(key) as HTMLInputElement;
    input.value = String(background.controller?.options[key] ?? defaults[key]);
  }
  for (const key of ['count', 'speed', 'opacity']) updateLabel(key);
  const theme = background.controller?.options.theme ?? 'storm';
  document.body.classList.toggle('light', theme === 'day');
  document.documentElement.style.colorScheme = theme === 'day' ? 'light' : 'dark';
  document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach(b => b.classList.toggle('selected', b.dataset.theme === theme));
}
function updateLabel(key: string) {
  const value = (document.getElementById(key) as HTMLInputElement).value;
  document.getElementById(key + '-value')!.textContent = key === 'speed' ? Number(value).toFixed(2) + '×' : key === 'opacity' ? Math.round(Number(value) * 100) + '%' : value;
  document.getElementById('flight-status')!.textContent = `${(document.getElementById('count') as HTMLInputElement).value} PETRELS IN FLIGHT`;
}
function save() { try { localStorage.setItem('petrel-settings', JSON.stringify(background.controller?.options)); } catch { /* Optional. */ } }
for (const key of ['count', 'speed', 'opacity', 'state']) {
  document.getElementById(key)!.addEventListener('input', event => {
    background.setAttribute(key, (event.target as HTMLInputElement).value);
    if (key !== 'state') updateLabel(key); save();
  });
}
document.querySelectorAll<HTMLButtonElement>('[data-theme]').forEach(b => b.addEventListener('click', () => {
  background.setAttribute('theme', b.dataset.theme!); syncUI(); save();
}));
document.getElementById('pause')!.addEventListener('click', event => {
  background.toggleAttribute('paused');
  (event.target as HTMLElement).textContent = background.hasAttribute('paused') ? '继续飞行' : '暂停飞行';
});
const restore = document.getElementById('restore')!;
document.getElementById('clean')!.addEventListener('click', () => { document.body.classList.add('clean'); restore.hidden = false; });
restore.addEventListener('click', () => { document.body.classList.remove('clean'); restore.hidden = true; });
document.getElementById('export')!.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(background.controller?.options, null, 2)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'petrel.config.json'; a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  document.getElementById('notice')!.textContent = '配置已导出，可用于 SDK 或后续 agent 适配器。';
});
const chat = document.getElementById('chat')!;
document.getElementById('chat-toggle')!.addEventListener('click', () => { chat.hidden = !chat.hidden; });
document.getElementById('chat-close')!.addEventListener('click', () => { chat.hidden = true; });
const help = document.getElementById('help') as HTMLDialogElement;
document.getElementById('help-toggle')!.addEventListener('click', () => help.showModal());
document.getElementById('help-close')!.addEventListener('click', () => help.close());
syncUI();
const reference = document.getElementById('reference')!;
const viewToggle = document.getElementById('view-toggle')!;
function setView(chatMode: boolean) {
  document.body.classList.toggle('reference-mode', chatMode); reference.hidden = !chatMode;
  viewToggle.textContent = chatMode ? '控制台布局' : '聊天布局';
  chat.hidden = true;
}
viewToggle.addEventListener('click', () => setView(!document.body.classList.contains('reference-mode')));
if (query.get('view') === 'chat' && !query.has('embed')) {
  background.setAttribute('theme', query.get('theme') ?? 'day');
  background.setAttribute('scale', query.get('scale') ?? '1.4');
  background.setAttribute('count', query.get('count') ?? '4');
  background.setAttribute('center-clear', '0.9');
  setView(true); syncUI();
}
