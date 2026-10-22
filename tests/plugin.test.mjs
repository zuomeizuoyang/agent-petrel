import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { request } from 'node:http';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { createPreviewServer, parseArgs, previewURL } from '../plugins/agent-petrel/scripts/preview.mjs';

test('plugin serves bundled offline page and SDK; rejects unrelated paths, writes and remote host', async t => {
  const server = createPreviewServer();
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => server.close());
  const base = `http://127.0.0.1:${server.address().port}`;
  const page = await fetch(base);
  assert.equal(page.status, 200);
  assert.equal(await page.text(), await readFile('dist/petrel-preview.html', 'utf8'));
  const sdk = await fetch(base + '/sdk/petrel.global.js');
  assert.equal(await sdk.text(), await readFile('dist/sdk/petrel.global.js', 'utf8'));
  assert.equal((await fetch(base + '/health')).status, 200);
  assert.equal((await fetch(base + '/package.json')).status, 404);
  assert.equal((await fetch(base + '/%2e%2e/%2e%2e/package.json')).status, 404);
  assert.equal((await fetch(base + '/', { method: 'POST' })).status, 405);
  const status = await new Promise((resolve, reject) => {
    const req = request(base, { headers: { Host: 'example.com' } }, res => { res.resume(); resolve(res.statusCode); });
    req.on('error', reject); req.end();
  });
  assert.equal(status, 403);
});

test('plugin CLI prints a usable ephemeral URL from another working directory', async t => {
  const script = new URL('../plugins/agent-petrel/scripts/preview.mjs', import.meta.url);
  const { fileURLToPath } = await import('node:url');
  const child = spawn(process.execPath, [fileURLToPath(script), '--port', '0', '--theme', 'moon', '--count', '3'], { cwd: 'plugins', stdio: ['ignore', 'pipe', 'pipe'] });
  t.after(() => child.kill());
  const line = await new Promise((resolve, reject) => {
    let data = '';
    child.stdout.on('data', chunk => { data += chunk; if (data.includes('\n')) resolve(data.split('\n')[0]); });
    child.on('error', reject);
    child.on('exit', code => reject(new Error(`Preview exited before startup: ${code}`)));
  });
  const { url } = JSON.parse(line);
  assert.equal(new URL(url).searchParams.get('theme'), 'moon');
  assert.equal(new URL(url).searchParams.get('count'), '3');
  assert.equal((await fetch(url)).status, 200);
});

test('CLI validates user parameters and false presence flags remain absent', () => {
  const { port, options } = parseArgs(['--port', '0', '--count', '4', '--embed', 'false', '--paused', 'false']);
  assert.equal(port, 0); assert.equal(options.count, 4);
  const url = new URL(previewURL(4197, options));
  assert.equal(url.searchParams.has('embed'), false);
  assert.equal(url.searchParams.has('paused'), false);
  for (const args of [['--count', '13'], ['--count', '1.5'], ['--theme', 'fish'], ['--port', '-1'], ['--speed'], ['--unknown', '1']]) assert.throws(() => parseArgs(args));
});
