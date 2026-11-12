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

test('all two hundred presets, categories, favorites and session looks work', async ({ page }) => {
  await openDemo(page);
  await expect(page.locator('.preset-card')).toHaveCount(200);
  await page.locator('.category-chip').filter({ hasText: '90s Film' }).click();
  await expect(page.locator('.preset-card')).toHaveCount(25);
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

test('engine covers all 200 presets and transparent export', async ({ page }) => {
  await page.goto('/editor.html');
  const result = await page.evaluate(async () => {
    const { presets } = await import('/scripts/presets.js');
    const { initialState, frameTypes, presetState, renderImage, exportBlob } = await import('/scripts/engine.js');
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
    const frameOffsets = frameTypes.map(frame => {
      const state = initialState(); state.frame.type = frame.id; state.frame.width = 10;
      const result = renderImage(source, state, { maxSide: 50 });
      const padding = ['none', 'rounded'].includes(frame.id) ? 0 : 4;
      return Math.round(result.content.y * result.canvas.height) === padding;
    });
    const resized = initialState(); resized.resize = { width: 4000, height: 3000 };
    const preview = renderImage(source, resized, { maxSide: 50 }).canvas;
    return { count: hashes.size, alpha: check.getContext('2d').getImageData(30, 15, 1, 1).data[3], frameOffsets, preview: [preview.width, preview.height] };
  });
  expect(result.count).toBe(200);
  expect(result.alpha).toBe(0);
  expect(result.frameOffsets.every(Boolean)).toBe(true);
  expect(result.preview[0]).toBeLessThanOrEqual(50);
  expect(result.preview[1]).toBeLessThanOrEqual(50);
});

test('home comparison handle drags and accessibility scale enlarges the interface', async ({ page }) => {
  await page.goto('/');
  await page.locator('#hero-comparison').scrollIntoViewIfNeeded();
  const before = Number(await page.locator('#hero-compare').inputValue());
  const handle = await page.locator('.comparison-line > span').boundingBox();
  await page.mouse.move(handle.x + handle.width / 2, handle.y + handle.height / 2);
  await page.mouse.down();
  await page.mouse.move(handle.x + handle.width / 2 + 140, handle.y + handle.height / 2, { steps: 10 });
  await page.mouse.up();
  await expect.poll(async () => Number(await page.locator('#hero-compare').inputValue())).toBeGreaterThan(before);
  await page.locator('#hero-compare').focus();
  const keyboardBefore = Number(await page.locator('#hero-compare').inputValue());
  await page.keyboard.press('ArrowLeft');
  await expect.poll(async () => Number(await page.locator('#hero-compare').inputValue())).toBeLessThan(keyboardBefore);
  await page.locator('[data-open-accessibility]').click();
  await page.locator('[data-ui-scale="160"]').click();
  await expect(page.locator('[data-ui-scale-value]')).toHaveText('160%');
  await page.locator('#accessibility-dialog [data-close-dialog]').last().click();
  await expect(page.locator('#accessibility-dialog')).toBeHidden();
  expect(await page.evaluate(() => getComputedStyle(document.body).zoom)).toBe('1.6');
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  await page.locator('[data-open-accessibility]').click();
  await page.locator('#accessibility-reset').click();
  await expect(page.locator('[data-ui-scale-value]')).toHaveText('100%');
});

test('expanded libraries expose 24 effects, 32 frames, 26 fonts, stickers and emoji', async ({ page }) => {
  await openDemo(page);
  await page.locator('[data-tool="effects"]').click();
  await expect(page.locator('#inspector-content input[type=range]')).toHaveCount(24);
  const before = await pixels(page);
  await page.locator('.effect-group').nth(1).locator('summary').click();
  await setRange(page, '#range-effects-invert', 100);
  await expect.poll(() => pixels(page), { timeout: 10000 }).not.toBe(before);
  await page.locator('[data-tool="frame"]').click();
  await expect(page.locator('[data-frame]')).toHaveCount(32);
  await page.locator('[data-frame="stamp"]').click();
  await expect(page.locator('[data-frame="stamp"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-tool="text"]').click();
  await page.locator('#add-text').click();
  await expect(page.locator('.font-option')).toHaveCount(26);
  await page.locator('#font-search').fill('Kanit');
  await expect(page.locator('.font-option')).toHaveCount(1);
  await page.locator('.font-option').click();
  await expect(page.locator('.font-option')).toHaveAttribute('aria-selected', 'true');
  await page.locator('[data-tool="stickers"]').click();
  await expect(page.locator('[data-sticker]')).toHaveCount(40);
  await page.locator('[data-sticker-tab="emoji"]').click();
  await expect(page.locator('[data-sticker]')).toHaveCount(90);
  await page.locator('[data-sticker="emoji:🚀"]').click();
  await expect(page.locator('#inspector-content')).toContainText('ปรับสติ๊กเกอร์ที่เลือก');
  await expect(page.locator('#object-color')).toHaveCount(0);
});

test('action buttons have breathing room and large UI stays inside a mobile viewport', async ({ page }) => {
  await openDemo(page);
  await page.locator('[data-tool="draw"]').click();
  const gap = await page.evaluate(() => {
    const first = document.querySelector('#undo-stroke').getBoundingClientRect();
    const second = document.querySelector('#clear-strokes').getBoundingClientRect();
    return second.top - first.bottom;
  });
  expect(gap).toBeGreaterThanOrEqual(10);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('[data-open-accessibility]').click();
  await page.locator('[data-ui-scale="160"]').click();
  await page.locator('#accessibility-dialog [data-close-dialog]').last().click();
  await expect(page.locator('#accessibility-dialog')).toBeHidden();
  expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
  for (const tool of ['presets', 'adjust', 'effects', 'frame', 'text', 'stickers']) {
    await page.locator(`[data-tool="${tool}"]`).click();
    await expect(page.locator('#inspector-title')).toBeVisible();
  }
});

test('large UI keeps the editor toolbar and export inside the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openDemo(page);
  await page.locator('[data-open-accessibility]').click();
  await page.locator('[data-ui-scale="160"]').click();
  await page.locator('#accessibility-dialog [data-close-dialog]').last().click();
  await expect(page.locator('#accessibility-dialog')).toBeHidden();
  const bounds = await page.evaluate(() => {
    const rail = document.querySelector('.tool-rail').getBoundingClientRect();
    const exportButton = document.querySelector('#export-button').getBoundingClientRect();
    return { railBottom: rail.bottom, exportRight: exportButton.right, height: innerHeight, width: innerWidth };
  });
  expect(bounds.railBottom).toBeLessThanOrEqual(bounds.height + 1);
  expect(bounds.exportRight).toBeLessThanOrEqual(bounds.width + 1);
  await page.locator('#export-button').click();
  await expect(page.locator('#download-button')).toBeVisible();
  const dialog = await page.locator('#export-dialog').boundingBox();
  expect(dialog.x).toBeGreaterThanOrEqual(0);
  expect(dialog.width).toBeLessThanOrEqual(390);
});

test('motion toggle, section links and FAQ remain usable with reduced motion', async ({ page }) => {
  await page.goto('/');
  await page.locator('#motion-toggle').click();
  await expect(page.locator('body')).toHaveClass(/reduce-motion/);
  await page.locator('.desktop-nav a[href="#features"]').click();
  await expect(page).toHaveURL(/#features$/);
  const featureTop = await page.locator('#features').evaluate(element => element.getBoundingClientRect().top);
  expect(featureTop).toBeLessThan(200);
  const faq = page.locator('.faq-list details').first();
  await faq.locator('summary').click();
  await expect(faq).toHaveAttribute('open', '');
  await faq.locator('summary').click();
  await expect(faq).not.toHaveAttribute('open', '');
  await page.locator('#motion-toggle').click();
  await expect(page.locator('body')).not.toHaveClass(/reduce-motion/);
  await page.locator('.site-header a[href="editor.html"]').click();
  await expect(page).toHaveURL(/editor\.html/);
  await expect(page.locator('#empty-state')).toBeVisible();
});
