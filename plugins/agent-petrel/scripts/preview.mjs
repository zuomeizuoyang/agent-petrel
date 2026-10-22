import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const files = new Map([
  ['/', ['preview.html', 'text/html; charset=utf-8']],
  ['/sdk/petrel.js', ['petrel.js', 'text/javascript; charset=utf-8']],
  ['/sdk/petrel.global.js', ['petrel.global.js', 'text/javascript; charset=utf-8']]
]);

export function previewURL(port, options = {}) {
  const url = new URL(`http://127.0.0.1:${port}/`);
  url.searchParams.set('view', 'chat');
  for (const [key, value] of Object.entries(options)) url.searchParams.set(key, String(value));
  return url.href;
}

// Exact resource allowlist: never serve the workspace or arbitrary files.
export function createPreviewServer() {
  return http.createServer(async (req, res) => {
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    if (!/^127\.0\.0\.1:\d+$/.test(req.headers.host ?? '')) {
      res.writeHead(403); res.end('Loopback host required'); return;
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { Allow: 'GET, HEAD' }); res.end(); return;
    }
    const url = new URL(req.url, 'http://127.0.0.1');
    if (url.pathname === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(req.method === 'HEAD' ? '' : JSON.stringify({ app: 'agent-petrel', mode: 'local-preview' })); return;
    }
    const file = files.get(url.pathname);
    if (!file) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const body = await readFile(new URL('../runtime/' + file[0], import.meta.url));
      res.writeHead(200, { 'Content-Type': file[1] });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(500); res.end('Missing plugin runtime; rebuild the plugin.'); }
  });
}

export function parseArgs(args) {
  let port = 4197;
  const options = {};
  const enums = {
    theme: ['day', 'storm', 'moon', 'dawn'], view: ['chat', 'console'],
    state: ['idle', 'working', 'waiting', 'done'], texture: ['tiles', 'glyphs']
  };
  const ranges = { count: [0, 12], speed: [0, 3], opacity: [0, 1], scale: [0.3, 2], fps: [1, 60], 'center-clear': [0, 1], seed: [1, 2147483646] };
  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, '');
    const value = args[i + 1];
    if (!args[i]?.startsWith('--') || value === undefined || value === '') throw new Error('Use --name value pairs.');
    if (key === 'port') {
      port = Number(value);
      if (!Number.isInteger(port) || port < 0 || port > 65535) throw new Error('Invalid port.');
    } else if (Object.hasOwn(enums, key)) {
      if (!enums[key].includes(value)) throw new Error(`Invalid ${key}.`);
      options[key] = value;
    } else if (Object.hasOwn(ranges, key)) {
      const n = Number(value), [min, max] = ranges[key];
      if (!Number.isFinite(n) || n < min || n > max || (['count', 'fps', 'seed'].includes(key) && !Number.isInteger(n))) throw new Error(`Invalid ${key}.`);
      options[key] = n;
    } else if (['embed', 'paused', 'reduced-motion', 'interactive', 'transparent'].includes(key)) {
      if (!['true', 'false'].includes(value)) throw new Error(`Invalid ${key}.`);
      // These two flags are presence-based in the application.
      if (!['embed', 'paused'].includes(key) || value === 'true') options[key] = value;
    } else throw new Error(`Unknown option: ${key}`);
  }
  return { port, options };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { port, options } = parseArgs(process.argv.slice(2));
    const server = createPreviewServer();
    server.on('error', err => { console.error(err.code === 'EADDRINUSE' ? 'Port in use. Choose another --port; do not stop unrelated processes.' : err.message); process.exitCode = 1; });
    server.listen(port, '127.0.0.1', () => {
      console.log(JSON.stringify({ app: 'agent-petrel', url: previewURL(server.address().port, options), stop: 'Ctrl+C in this process session' }));
    });
    for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
