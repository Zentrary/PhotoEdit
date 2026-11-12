import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { deflateSync } from 'node:zlib';

function pngFixture() {
  const chunk = (type, data) => {
    const name = Buffer.from(type); const length = Buffer.alloc(4); length.writeUInt32BE(data.length);
    const crc = Buffer.alloc(4); crc.writeUInt32BE(zlibCrc(Buffer.concat([name, data])));
    return Buffer.concat([length, name, data, crc]);
  };
  const header = Buffer.alloc(13); header.writeUInt32BE(2, 0); header.writeUInt32BE(2, 4); header[8] = 8; header[9] = 6;
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', header), chunk('IDAT', deflateSync(Buffer.from([0, 255, 0, 0, 255, 0, 0, 255, 0, 0, 0, 0, 0, 0, 0, 0, 255]))), chunk('IEND', Buffer.alloc(0))]);
}
function zlibCrc(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) { crc ^= byte; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
const tinyPng = pngFixture();
async function openDemo(page) {
  await page.goto('/editor.html?demo=1');
  await expect(page.locator('#loading-overlay')).toBeHidden();
  await expect(page.locator('#export-button')).toBeEnabled();
  await expect(page.locator('#file-name')).toHaveText('my-little-universe.jpg');
  await expect(page.locator('#empty-state')).toBeHidden();
  await page.waitForFunction(() => { const canvas = document.querySelector('#preview-canvas'); return canvas.width > 100 && canvas.getContext('2d').getImageData(Math.floor(canvas.width / 2), Math.floor(canvas.height / 2), 1, 1).data[3] > 0; });
}
async function pixels(page) { return page.locator('#preview-canvas').evaluate(canvas => canvas.toDataURL()); }
async function setRange(page, selector, value) {
  await page.locator(selector).evaluate((input, value) => { input.value = String(value); input.dispatchEvent(new Event('input', { bubbles: true })); input.dispatchEvent(new Event('change', { bubbles: true })); }, value);
  await page.waitForTimeout(400);
}

test('home loads local assets, compares presets and opens privacy', async ({ page }) => {
  const external = [];
  const errors = [];
  page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:3000') && !request.url().startsWith('data:') && !request.url().startsWith('blob:')) external.push(request.url()); });
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toContainText('จักรวาลของคุณ');
  await expect(page.locator('.style-card')).toHaveCount(5);
  const before = await pixelsHero(page);
  await page.locator('.demo-preset[data-preset="warm-disposable"]').click();
  expect(await pixelsHero(page)).not.toBe(before);
  await page.locator('#hero-compare').fill('70');
  await expect(page.locator('#hero-comparison')).toHaveAttribute('style', /70%/);
  await page.locator('[data-open-privacy]').first().click();
  await expect(page.locator('#privacy-dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#privacy-dialog')).toBeHidden();
  expect(external).toEqual([]);
  expect(errors).toEqual([]);
});
async function pixelsHero(page) { return page.locator('#hero-after').evaluate(canvas => canvas.toDataURL()); }

test('all forty presets, categories, favorites and session looks work', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('.preset-card')).toHaveCount(40);
  await page.locator('.category-chip').filter({ hasText: '90s Film' }).click();
  await expect(page.locator('.preset-card')).toHaveCount(5);
  await page.locator('.preset-card').first().click();
  await expect(page.locator('.preset-card').first()).toHaveAttribute('aria-pressed', 'true');
  await page.locator('.favorite-toggle').first().click();
  await page.locator('.category-chip').filter({ hasText: 'ที่ชอบ' }).click();
  await expect(page.locator('.preset-card')).toHaveCount(1);
  await page.locator('[data-tool="looks"]').click();
  await page.locator('#look-name').fill('My Film');
  await page.locator('#save-look').click();
  await expect(page.locator('.look-card')).toContainText('My Film');
  await page.locator('#original-preset').count();
  await page.locator('[data-tool="presets"]').click();
  await page.locator('#original-preset').click();
  await page.locator('[data-tool="looks"]').click();
  await page.locator('.look-card > button').first().click();
  await expect(page.locator('#undo-button')).toBeEnabled();
  page.once('dialog', dialog => dialog.accept());
  await page.goto('/editor.html');
  await expect(page.locator('#empty-state')).toBeVisible();
  const storage = await page.evaluate(() => ({ local: localStorage.length, session: sessionStorage.length, cookies: document.cookie }));
  expect(storage).toEqual({ local: 0, session: 0, cookies: '' });
});

test('adjustments, undo, redo, compare and reset are real image operations', async ({ page }) => {
  await openDemo(page);
  const original = await pixels(page);
  await page.locator('[data-tool="adjust"]').click();
  await setRange(page, '#range-adjustments-brightness', 140);
  await expect.poll(() => pixels(page), { timeout: 10000 }).not.toBe(original);
  const bright = await pixels(page);
  await page.locator('#undo-button').click();
  await expect.poll(() => pixels(page), { timeout: 10000 }).toBe(original);
  await page.locator('#redo-button').click();
  await expect.poll(() => pixels(page), { timeout: 10000 }).toBe(bright);
  await page.locator('#compare-button').hover();
  await page.mouse.down();
  await expect(page.locator('#original-canvas')).toBeVisible();
  await page.mouse.up();
  await expect(page.locator('#original-canvas')).toBeHidden();
  await page.locator('#reset-button').click();
  await page.locator('#confirm-action').click();
  await expect.poll(() => pixels(page), { timeout: 10000 }).toBe(original);
});

test('crop ratios, rotation, straighten and custom resize affect export', async ({ page }) => {
  await openDemo(page);
  await page.locator('[data-tool="crop"]').click();
  await page.locator('[data-ratio="1:1"]').click();
  await page.locator('#apply-crop').click();
  await page.waitForTimeout(200);
  const square = await page.locator('#canvas-dimensions').textContent();
  const dimensions = square.match(/[\d,]+/g).map(value => Number(value.replaceAll(',', '')));
  expect(dimensions[0]).toBe(dimensions[1]);
  await page.locator('#rotate-right').click();
  await setRange(page, '#range-crop-straighten', 10);
  await page.locator('[data-tool="resize"]').click();
  await page.locator('#resize-lock').click();
  await page.locator('#resize-width').fill('400');
  await page.locator('#resize-height').fill('400');
  await page.locator('#apply-resize').click();
  await expect(page.locator('#canvas-dimensions')).toHaveText('400 × 400 px');
  await page.locator('#resize-width').fill('9000');
  await page.locator('#apply-resize').click();
  await expect(page.locator('#toast')).toContainText('8,192');
  await page.locator('#export-button').click();
  await expect(page.locator('#export-dimensions')).toHaveText('400 × 400 px');
});

test('frames, text dragging, stickers, drawing and eraser work', async ({ page }) => {
  await openDemo(page);
  await page.locator('[data-tool="frame"]').click();
  await page.locator('[data-frame="polaroid"]').click();
  await page.locator('[data-tool="text"]').click();
  await page.locator('#add-text').click();
  await page.locator('#object-text').fill('สวัสดีจักรวาล');
  await page.locator('#object-text').dispatchEvent('change');
  await setRange(page, '#range-object-size', 10);
  const box = await page.locator('#preview-canvas').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height * 0.46);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.65, box.y + box.height * 0.35, { steps: 8 });
  await page.mouse.up();
  await page.locator('[data-tool="stickers"]').click();
  await page.locator('[data-sticker="planet"]').click();
  await expect(page.locator('#range-object-size')).toBeVisible();
  await page.locator('[data-tool="draw"]').click();
  const before = await pixels(page);
  await page.mouse.move(box.x + box.width * 0.2, box.y + box.height * 0.3);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width * 0.4, box.y + box.height * 0.4, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(200);
  expect(await pixels(page)).not.toBe(before);
  await expect(page.locator('#inspector-content')).toContainText('จำนวนเส้นปัจจุบัน: 1');
  await page.locator('#undo-stroke').click();
  await expect(page.locator('#inspector-content')).toContainText('จำนวนเส้นปัจจุบัน: 0');
});

test('exports PNG, JPG and WebP at requested dimensions without metadata', async ({ page }) => {
  await page.goto('/editor.html');
  await page.locator('#file-input').setInputFiles({ name: 'tiny.png', mimeType: 'image/png', buffer: tinyPng });
  await expect(page.locator('#export-button')).toBeEnabled();
  await page.locator('[data-tool="resize"]').click();
  await page.locator('#resize-lock').click();
  await page.locator('#resize-width').fill('120');
  await page.locator('#resize-height').fill('80');
  await page.locator('#apply-resize').click();
  for (const [format, extension] of [['image/png', 'png'], ['image/jpeg', 'jpg'], ['image/webp', 'webp']]) {
    await page.locator('#export-button').click();
    await page.locator(`[data-format="${format}"]`).click();
    await page.locator('#export-filename').fill('test-export');
    const downloaded = page.waitForEvent('download');
    await page.locator('#download-button').click();
    const download = await downloaded;
    expect(download.suggestedFilename()).toBe(`test-export.${extension}`);
    const buffer = await readFile(await download.path());
    expect(buffer.length).toBeGreaterThan(20);
    if (format === 'image/png') { expect(buffer.readUInt32BE(16)).toBe(120); expect(buffer.readUInt32BE(20)).toBe(80); expect(buffer.toString('latin1')).not.toContain('eXIf'); }
    await expect(page.locator('#export-dialog')).toBeHidden();
  }
});

test('invalid files are rejected and navigation warns about unsaved work', async ({ page }) => {
  await page.goto('/editor.html');
  await page.locator('#file-input').setInputFiles({ name: 'bad.txt', mimeType: 'text/plain', buffer: Buffer.from('not an image') });
  await expect(page.locator('#toast')).toContainText('รองรับ JPG');
  await expect(page.locator('#export-button')).toBeDisabled();
  await openDemo(page);
  await page.locator('[data-tool="adjust"]').click();
  await setRange(page, '#range-adjustments-brightness', 120);
  await page.locator('#home-link').click();
  await expect(page.locator('#confirm-dialog')).toBeVisible();
  await page.locator('#confirm-dialog .button-outline').click();
  expect(page.url()).toContain('editor');
});

test('mobile layout stays inside viewport and tools remain reachable', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
  expect(overflow).toBe(false);
  for (const tool of ['adjust', 'crop', 'resize', 'effects', 'frame', 'text', 'stickers', 'draw', 'looks']) {
    await page.locator(`[data-tool="${tool}"]`).click();
    await expect(page.locator('#inspector-title')).toBeVisible();
  }
  await page.locator('#export-button').click();
  await expect(page.locator('#download-button')).toBeVisible();
  const dialog = await page.locator('#export-dialog').boundingBox();
  expect(dialog.x).toBeGreaterThanOrEqual(0);
  expect(dialog.width).toBeLessThanOrEqual(390);
});

test('engine covers every preset and transparent export', async ({ page }) => {
  await page.goto('/editor.html');
  const result = await page.evaluate(async () => {
    const { presets } = await import('/scripts/presets.js');
    const { presetState, renderImage, exportBlob } = await import('/scripts/engine.js');
    const source = document.createElement('canvas'); source.width = 40; source.height = 30;
    const context = source.getContext('2d'); const gradient = context.createLinearGradient(0, 0, 40, 30); gradient.addColorStop(0, '#ff8844'); gradient.addColorStop(0.5, '#4488ff'); gradient.addColorStop(1, '#663377'); context.fillStyle = gradient; context.fillRect(0, 0, 40, 30); context.clearRect(30, 0, 10, 30);
    const hashes = new Set();
    for (const preset of presets) {
      const { canvas } = renderImage(source, presetState(preset.id, 100), { maxSide: 50 });
      hashes.add(canvas.toDataURL());
    }
    const blob = await exportBlob(source, presetState(null), 'image/png');
    const bitmap = await createImageBitmap(blob);
    const check = document.createElement('canvas'); check.width = bitmap.width; check.height = bitmap.height; check.getContext('2d').drawImage(bitmap, 0, 0);
    return { count: hashes.size, alpha: check.getContext('2d').getImageData(30, 15, 1, 1).data[3] };
  });
  expect(result.count).toBe(40);
  expect(result.alpha).toBe(0);
});
