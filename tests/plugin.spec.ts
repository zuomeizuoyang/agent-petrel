import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';
import { resolve } from 'node:path';

test('installed plugin assets animate without external requests and URL customization works', async ({ page }) => {
  // Start the deliverable itself, not Vite or the source implementation.
  const server = spawn(process.execPath, [resolve('plugins/agent-petrel/scripts/preview.mjs'), '--port', '0'], { stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    const url = await new Promise<string>((resolve, reject) => {
      let output = '';
      server.stdout.on('data', chunk => { output += chunk; if (output.includes('\n')) resolve(JSON.parse(output.split('\n')[0]).url); });
      server.on('error', reject);
      server.on('exit', code => reject(new Error(`Preview exited: ${code}`)));
    });
    const errors: string[] = [], external: string[] = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('request', req => { if (new URL(req.url()).origin !== new URL(url).origin) external.push(req.url()); });
    await page.goto(url + '&theme=moon&count=3&speed=0.5');
    const birds = page.locator('petrel-background');
    await expect(birds).toHaveAttribute('theme', 'moon');
    await expect(birds).toHaveAttribute('count', '3');
    await expect.poll(() => birds.evaluate((e: any) => e.controller.stats.frames)).toBeGreaterThan(5);
    await expect(page.locator('#reference')).toBeVisible();
    await page.goto(new URL('?view=console&theme=day&count=2', url).href);
    await page.locator('#pause').click();
    const frames = await birds.evaluate((e: any) => e.controller.stats.frames);
    await page.waitForTimeout(100);
    expect(await birds.evaluate((e: any) => e.controller.stats.frames)).toBe(frames);
    expect(errors).toEqual([]); expect(external).toEqual([]);
  } finally { server.kill(); }
});
