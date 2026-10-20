import { test, expect } from '@playwright/test';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
test('renders living birds, controls, clean view and readable input', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto('/');
  await expect.poll(() => page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.frames)).toBeGreaterThan(5);
  const before = await page.locator('petrel-background canvas').screenshot();
  await page.waitForTimeout(700);
  const after = await page.locator('petrel-background canvas').screenshot();
  expect(before.equals(after)).toBe(false);
  await page.locator('#count').fill('8');
  expect(await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.birds)).toBe(8);
  await page.getByRole('button', { name: '月光银' }).click();
  await expect(page.locator('petrel-background')).toHaveAttribute('theme', 'moon');
  await page.locator('#pause').click();
  const frames = await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.frames);
  await page.waitForTimeout(250);
  expect(await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.frames)).toBe(frames);
  await page.locator('#pause').click();
  await page.getByRole('button', { name: '阅读效果' }).click();
  await page.getByRole('textbox').fill('海燕继续飞，输入正常。');
  await expect(page.getByRole('textbox')).toHaveValue('海燕继续飞，输入正常。');
  await page.locator('#chat-close').click();
  await page.getByRole('button', { name: '隐藏控制面板' }).click();
  await expect(page.locator('main')).toBeHidden();
  await page.getByRole('button', { name: '显示控制台' }).click();
  await expect(page.locator('main')).toBeVisible();
  await page.locator('#count').fill('5');
  await page.getByRole('button', { name: '风暴蓝' }).click();
  await page.screenshot({ path: 'docs/preview.png', fullPage: true });
  expect(errors).toEqual([]);
});
test('offline standalone opens with no network; exported config matches UI', async ({ page }) => {
  const errors: string[] = [], network: string[] = [];
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => { if (/^https?:/.test(r.url())) network.push(r.url()); });
  await page.goto(pathToFileURL(resolve('dist/petrel-preview.html')).href);
  await expect.poll(() => page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.frames)).toBeGreaterThan(2);
  await page.locator('#speed').fill('1.25');
  const downloadEvent = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出配置' }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe('petrel.config.json');
  expect(await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.options.speed)).toBe(1.25);
  expect(network).toEqual([]); expect(errors).toEqual([]);
});
test('built browser extension decoration toggles off and does not intercept input', async ({ page }) => {
  await page.goto('/?count=0');
  await page.addScriptTag({ path: 'dist/extension/content.js' });
  const layer = page.locator('#agent-petrel-decoration-v1');
  await expect(layer).toHaveCount(1);
  await expect(layer).toHaveCSS('pointer-events', 'none');
  await page.getByRole('button', { name: '阅读效果' }).click();
  await page.getByRole('textbox').fill('扩展不挡输入');
  await expect(page.getByRole('textbox')).toHaveValue('扩展不挡输入');
  await page.addScriptTag({ path: 'dist/extension/content.js' });
  await expect(layer).toHaveCount(0);
  await page.locator('#chat-close').click();
  await page.getByRole('button', { name: '晴空白' }).click();
  await page.addScriptTag({ path: 'dist/extension/content.js' });
  await expect(layer).toHaveAttribute('theme', 'day');
  await expect(layer).toHaveCSS('mix-blend-mode', 'multiply');
});
test('reduced motion, attribute removal, resizing and complete disposal', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' }); await page.goto('/?count=3');
  const stopped = await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats);
  expect(stopped.birds).toBe(3); expect(stopped.running).toBe(false);
  await page.evaluate(() => {
    const el = document.querySelector('petrel-background')!;
    el.setAttribute('count', '99');
  });
  expect(await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.birds)).toBe(12);
  await page.evaluate(() => document.querySelector('petrel-background')!.removeAttribute('count'));
  expect(await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.stats.birds)).toBe(5);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator('petrel-background canvas')).toBeVisible();
  await page.screenshot({ path: 'docs/mobile.png', fullPage: true });
  const disposed = await page.evaluate(() => {
    const el = document.querySelector('petrel-background') as any;
    const controller = el.controller; el.remove(); return controller.stats;
  });
  expect(disposed.destroyed).toBe(true); expect(disposed.running).toBe(false);
});
test('ES SDK can mount twice and detach without stealing clicks', async ({ page }) => {
  await page.goto('/?count=1');
  const result = await page.evaluate(async () => {
    const { mountPetrel } = await import('/src/index.ts');
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;inset:0'; document.body.append(host);
    const a = mountPetrel(host, { count: 2, transparent: true }); const b = mountPetrel(host);
    const result = { same: a === b, count: host.querySelectorAll('petrel-background').length, pointer: getComputedStyle(a).pointerEvents };
    host.remove(); return result;
  });
  expect(result).toEqual({ same: true, count: 1, pointer: 'none' });
});
test('flight remains visible after ten simulated minutes in a tall Codex panel', async ({ page }) => {
  await page.setViewportSize({ width: 1062, height: 1292 });
  await page.goto('/?count=5');
  const positions = await page.evaluate(() => {
    const engine = (document.querySelector('petrel-background') as any).controller;
    engine.pause();
    for (let i = 0; i < 18000; i++) engine.step(1 / 30);
    engine.configure({});
    return engine.birds.map((b: any) => ({ x: b.x, y: b.y }));
  });
  for (const b of positions) {
    expect(Number.isFinite(b.x) && Number.isFinite(b.y)).toBe(true);
    expect(b.x).toBeGreaterThan(-100); expect(b.x).toBeLessThan(1162);
    expect(b.y).toBeGreaterThan(-100); expect(b.y).toBeLessThan(1392);
  }
});
test('reference layout uses light tiled birds, protects the composer, and remains usable on mobile', async ({ page }) => {
  await page.goto('/?view=chat');
  await expect(page.locator('body')).toHaveClass(/reference-mode/);
  await expect(page.locator('body')).toHaveClass(/light/);
  await expect(page.locator('main')).toBeHidden();
  await expect(page.locator('#reference')).toBeVisible();
  const options = await page.evaluate(() => (document.querySelector('petrel-background') as any).controller.options);
  expect(options).toMatchObject({ theme: 'day', texture: 'tiles', centerClear: 0.9, count: 4, scale: 1.4 });
  await page.getByRole('textbox', { name: '参考布局输入' }).fill('让海燕飞过工作台');
  await expect(page.getByRole('textbox', { name: '参考布局输入' })).toHaveValue('让海燕飞过工作台');
  await page.screenshot({ path: 'docs/reference-preview.png' });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole('textbox', { name: '参考布局输入' })).toBeInViewport();
  await page.screenshot({ path: 'docs/reference-mobile.png' });
  await page.getByRole('button', { name: '控制台布局' }).click();
  await expect(page.locator('main')).toBeVisible();
  await page.getByRole('button', { name: '月光银' }).click();
  await expect(page.locator('body')).not.toHaveClass(/light/);
});
test('video frames can be sought in any order without a live animation clock', async ({ page }) => {
  await page.goto('/?view=chat');
  await expect(page.locator('petrel-background canvas')).toBeVisible();
  const result = await page.evaluate(async () => {
    await document.fonts.ready;
    const element = document.querySelector('petrel-background') as any;
    const controller = element.controller;
    const canvas = element.shadowRoot.querySelector('canvas') as HTMLCanvasElement;
    // Compare the engine's pixels, excluding composited DOM text, carets and browser UI.
    controller.renderAt(4); const a = canvas.toDataURL();
    controller.renderAt(8); const different = a !== canvas.toDataURL();
    controller.renderAt(1); controller.renderAt(4);
    return { same: a === canvas.toDataURL(), different, running: controller.stats.running };
  });
  expect(result).toEqual({ same: true, different: true, running: false });
});
