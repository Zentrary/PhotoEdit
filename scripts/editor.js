import { categories, presets, getPreset, neutral, adjustmentKeys, effectKeys } from './presets.js';
import { initialState, clone, clamp, LIMITS, frameTypes, stickerTypes, emojiTypes, decodeFile, geometrySize, outputSize, paintPreview, renderImage, presetState, drawSticker, validateResize, exportBlob } from './engine.js';
import { fontFamilies, loadFont } from './fonts.js';
import { initAccessibility, openDialog, closeDialog, setMotionOverride } from './ui.js';

const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const icon = name => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${name}"></use></svg>`;
const escapeHTML = value => String(value).replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
const uid = () => globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const nextFrame = () => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));
const canvas = $('#preview-canvas');
const viewport = $('#canvas-viewport');
const mat = $('#canvas-mat');
const inspector = $('#inspector-content');
const fileInput = $('#file-input');
const exportDialog = $('#export-dialog');
const toolInfo = {
  presets: ['FIND YOUR MOOD', 'สไตล์รูป'], adjust: ['COLOR & LIGHT', 'ปรับแสงและสี'], crop: ['FRAME YOUR MOMENT', 'ครอปและจัดแนว'], resize: ['THE PERFECT FIT', 'เปลี่ยนขนาดรูป'], effects: ['A LITTLE EXTRA', 'เอฟเฟกต์'], frame: ['FINISHING TOUCH', 'กรอบรูป'], text: ['SAY IT YOUR WAY', 'ข้อความ'], stickers: ['MAKE IT PLAYFUL', 'สติ๊กเกอร์'], draw: ['LEAVE YOUR MARK', 'วาดรูป'], looks: ['MADE BY YOU', 'สไตล์ของฉัน']
};
const adjustmentLabels = { brightness: 'ความสว่าง', contrast: 'คอนทราสต์', saturation: 'ความอิ่มสี', warmth: 'อุ่น – เย็น', tint: 'เขียว – ม่วง', hue: 'เปลี่ยนเฉดสี', fade: 'เฟด / สีจาง', blur: 'ความเบลอ' };
const effectLabels = { grain: 'เกรนฟิล์ม', vignette: 'ขอบมืด', glow: 'แสงฟุ้ง', scanlines: 'เส้นสแกน VHS', chromatic: 'สีเหลื่อม', dust: 'ฝุ่นละออง', leak: 'แสงรั่ว', sparkle: 'ละอองดาว', pixelate: 'พิกเซลแตก', posterize: 'ลดระดับสี', halftone: 'จุดหนังสือพิมพ์', duotone: 'ดูโอโทน', invert: 'กลับสี', solarize: 'โซลาไรซ์', threshold: 'ขาวดำสองค่า', radialBlur: 'เบลอพุ่งกลาง', motionBlur: 'เบลอเคลื่อนไหว', tiltShift: 'เบลอบนล่าง', fog: 'หมอก', bokeh: 'โบเก้', rain: 'ฝน', snow: 'หิมะ', scratches: 'รอยขีดฟิล์ม', glitch: 'ภาพกระตุก' };
const effectGroups = [['ฟิล์มและพื้นผิว', ['grain', 'dust', 'scratches', 'scanlines', 'halftone']], ['แสงและสี', ['glow', 'leak', 'vignette', 'chromatic', 'duotone', 'posterize', 'invert', 'solarize', 'threshold']], ['เบลอและเคลื่อนไหว', ['radialBlur', 'motionBlur', 'tiltShift', 'glitch', 'pixelate']], ['บรรยากาศ', ['fog', 'bokeh', 'rain', 'snow', 'sparkle']]];
const stickerLabels = { star: 'ดาว', heart: 'หัวใจ', moon: 'ดวงจันทร์', planet: 'ดาวเคราะห์', sparkle: 'ประกาย', flower: 'ดอกไม้', bolt: 'สายฟ้า', butterfly: 'ผีเสื้อ', smile: 'ยิ้ม', cherry: 'เชอร์รี', diamond: 'เพชร', music: 'ดนตรี', sun: 'ดวงอาทิตย์', cloud: 'เมฆ', rainbow: 'สายรุ้ง', rocket: 'จรวด', ufo: 'จานบิน', comet: 'ดาวหาง', crown: 'มงกุฎ', camera: 'กล้อง', cassette: 'เทปคาสเซ็ต', floppy: 'ฟลอปปี้ดิสก์', gamepad: 'จอยเกม', gift: 'ของขวัญ', balloon: 'ลูกโป่ง', cake: 'เค้ก', icecream: 'ไอศกรีม', coffee: 'กาแฟ', pizza: 'พิซซ่า', strawberry: 'สตรอว์เบอร์รี', leaf: 'ใบไม้', cactus: 'กระบองเพชร', paw: 'รอยเท้าสัตว์', peace: 'สันติภาพ', fire: 'ไฟ', drop: 'หยดน้ำ', snowflake: 'เกล็ดหิมะ', mountain: 'ภูเขา', wave: 'คลื่น', shell: 'เปลือกหอย' };
const stickerLabel = type => type.startsWith('emoji:') ? type.slice(6) : stickerLabels[type] || type;
const colors = ['#ffffff', '#1b1426', '#c4a0f5', '#f1acd0', '#a5d8e6', '#a4d5a2', '#f4d38d', '#ef8d79'];
let source = null;
let state = initialState();
let sourceName = '';
let history = [];
let historyIndex = -1;
let tool = 'presets';
let category = 'all';
let search = '';
let selectedId = null;
let favorites = new Set();
let savedLooks = [];
let cropDraft = null;
let cropRatio = 'free';
let cropDrag = null;
let interaction = null;
let drawOptions = { tool: 'pen', color: '#c4a0f5', size: 0.8 };
let zoom = 1;
let fitScale = 1;
let metadata = { bounds: [], content: { x: 0, y: 0, w: 1, h: 1 } };
let renderPending = false;
let interacting = false;
let loading = false;
let comparing = false;
let toastTimer;
let confirmResolver;
let exportFormat = 'image/png';
let exportLocked = true;
let exportNatural = { width: 1, height: 1 };
let lastExportUrl = null;
let baseline = JSON.stringify(initialState());
let thumbnailSource = null;
let thumbnailVersion = 0;
let stickerTab = 'drawn';
let fontSearch = '';
let thumbnailObserver;
let thumbnailQueue = [];
let thumbnailWorking = false;
const thumbnailCache = new Map();
let thumbnailSourcePromise;
let loadVersion = 0;

function isDirty() { return !!source && JSON.stringify(state) !== baseline; }
function notify(message, error = false) {
  const toast = $('#toast');
  toast.querySelector('span').textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 6500 : 3500);
}
function setBusy(value, text = 'กำลังเตรียมรูปของคุณ…') {
  loading = value;
  $('#loading-text').textContent = text;
  $('#loading-overlay').hidden = !value;
  updateControls();
}
function updateControls() {
  const ready = !!source && !loading;
  for (const selector of ['#export-button', '#reset-button', '#compare-button', '#zoom-out', '#zoom-in', '#zoom-fit', '#fit-button']) $(selector).disabled = !ready;
  $('#undo-button').disabled = !ready || historyIndex <= 0;
  $('#redo-button').disabled = !ready || historyIndex >= history.length - 1;
  $('#reset-tool').disabled = !ready;
  $('#canvas-dimensions').textContent = source ? `${outputSize(source, state).width.toLocaleString()} × ${outputSize(source, state).height.toLocaleString()} px` : 'ยังไม่มีรูปในพื้นที่ทำงาน';
  $('#file-name').textContent = sourceName || 'ยังไม่ได้เลือกรูป';
  $('#file-meta').textContent = source ? `${source.width.toLocaleString()} × ${source.height.toLocaleString()} px · ต้นฉบับ` : 'พื้นที่สร้างสรรค์ของคุณ';
}
function commit() {
  const snapshot = JSON.stringify(state);
  if (history[historyIndex] === snapshot) { updateControls(); return; }
  history = history.slice(0, historyIndex + 1);
  history.push(snapshot);
  if (history.length > 50) history.shift();
  historyIndex = history.length - 1;
  updateControls();
}
function mutate(action, refresh = true) {
  if (!source || loading) return;
  action();
  commit();
  if (refresh) renderPanel();
  scheduleRender();
}
function travelHistory(direction) {
  if (!source || loading) return;
  const next = historyIndex + direction;
  if (next < 0 || next >= history.length) return;
  historyIndex = next;
  state = JSON.parse(history[historyIndex]);
  selectedId = null;
  cropDraft = tool === 'crop' ? clone(state.crop) : null;
  stopCompare();
  renderPanel(); scheduleRender(); updateControls();
}
function scheduleRender() {
  if (renderPending || !source) return;
  renderPending = true;
  requestAnimationFrame(() => {
    renderPending = false;
    try { renderPreview(); } catch (error) { notify(error.message || 'แสดงรูปไม่สำเร็จ ลองลดขนาดรูป', true); }
  });
}
function previewState() {
  if (tool !== 'crop' || !cropDraft) return state;
  return { ...state, crop: { x: 0, y: 0, w: 1, h: 1 }, frame: { ...state.frame, type: 'none' }, resize: null, texts: [], stickers: [], strokes: [] };
}
function renderPreview() {
  if (!source) return;
  const previousWidth = parseFloat(mat.style.width) || 0;
  metadata = paintPreview(canvas, source, previewState(), { maxSide: interacting ? 850 : LIMITS.preview, selectedId, interactive: !comparing && ['text', 'stickers'].includes(tool) });
  sizeCanvas(!previousWidth);
  updateCropOverlay();
  mat.classList.toggle('drawing', tool === 'draw');
  mat.classList.toggle('moving', ['text', 'stickers'].includes(tool));
  mat.style.touchAction = ['draw', 'crop', 'text', 'stickers'].includes(tool) ? 'none' : 'pan-x pan-y';
  if (comparing) paintOriginal();
  updateControls();
}
function sizeCanvas(resetScroll = false) {
  if (!source || !canvas.width) return;
  const mobile = innerWidth <= 700;
  const padding = mobile ? 44 : 76;
  fitScale = Math.min((viewport.clientWidth - padding) / canvas.width, (viewport.clientHeight - padding) / canvas.height, 1.5);
  fitScale = Math.max(0.02, fitScale);
  mat.style.width = `${canvas.width * fitScale * zoom}px`;
  mat.style.height = `${canvas.height * fitScale * zoom}px`;
  $('#zoom-fit').textContent = zoom === 1 ? 'พอดี' : `${Math.round(fitScale * zoom * 100)}%`;
  $('#zoom-out').disabled = zoom <= 0.25;
  $('#zoom-in').disabled = zoom >= 5;
  if (resetScroll) { $('#canvas-scroll').scrollLeft = 0; $('#canvas-scroll').scrollTop = 0; }
}
function changeZoom(amount) {
  zoom = clamp(Math.round((zoom + amount) * 100) / 100, 0.25, 5);
  sizeCanvas();
  if (tool === 'crop') updateCropOverlay();
}
function fitCanvas() { zoom = 1; sizeCanvas(true); }
new ResizeObserver(() => { sizeCanvas(); if (tool === 'crop') updateCropOverlay(); }).observe(viewport);

function rangeHTML(label, key, value, min, max, group = '', step = 1, unit = '') {
  const progress = (value - min) / (max - min) * 100;
  return `<div class="range-group"><div class="range-label"><label for="range-${group}-${key}">${label}</label><output for="range-${group}-${key}" data-output="${group}-${key}">${value}${unit}</output></div><input id="range-${group}-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-key="${key}" data-group="${group}" data-unit="${unit}" style="--range-progress:${progress}%"></div>`;
}
function bindRanges() {
  inspector.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', () => {
      const value = Number(input.value), key = input.dataset.key, group = input.dataset.group;
      if (group === 'object') { const object = selectedObject(); if (!object) return; object[key] = value; }
      else if (group === 'frame') state.frame[key] = value;
      else if (group === 'crop') { state[key] = value; cropDraft = clone(state.crop); }
      else if (group === 'draw') drawOptions[key] = value;
      else if (group === 'preset') state.presetStrength = value;
      else state[group][key] = value;
      input.style.setProperty('--range-progress', `${(value - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
      const output = inspector.querySelector(`[data-output="${group}-${key}"]`);
      if (output) output.textContent = `${value}${input.dataset.unit}`;
      if (group !== 'draw') { stopCompare(); scheduleRender(); }
    });
    input.addEventListener('change', () => { if (input.dataset.group !== 'draw') commit(); });
  });
}
function emptyInspector() {
  inspector.innerHTML = `<div class="inspector-empty">${icon('image')}<h3>เริ่มจากภาพของคุณ</h3><p>เลือกรูปก่อน แล้วเครื่องมือทั้งหมด<br>จะพร้อมให้ปล่อยไอเดียเต็มที่</p><button class="button button-outline" id="panel-open">${icon('upload')} เลือกรูปจากเครื่อง</button><button class="text-button" id="panel-demo">ลองรูปตัวอย่าง ${icon('arrow')}</button></div>`;
  $('#panel-open').onclick = () => fileInput.click();
  $('#panel-demo').onclick = () => loadDemo();
}
function renderPanel() {
  thumbnailVersion++;
  $('#inspector-kicker').textContent = toolInfo[tool][0];
  $('#inspector-title').textContent = toolInfo[tool][1];
  if (!source) { emptyInspector(); return; }
  const builders = { presets: presetPanel, adjust: adjustPanel, crop: cropPanel, resize: resizePanel, effects: effectsPanel, frame: framePanel, text: textPanel, stickers: stickerPanel, draw: drawPanel, looks: looksPanel };
  builders[tool]();
  bindRanges();
  inspector.classList.remove('panel-enter');
  void inspector.offsetWidth;
  inspector.classList.add('panel-enter');
  updateControls();
}
function setTool(next) {
  if (!toolInfo[next]) return;
  stopCompare();
  selectedId = null;
  tool = next;
  cropDraft = next === 'crop' && source ? clone(state.crop) : null;
  $$('.tool-button').forEach(button => { const active = button.dataset.tool === next; button.classList.toggle('active', active); button.setAttribute('aria-pressed', String(active)); });
  $('#workspace-hint').textContent = { presets: 'เลือกสไตล์ที่ใช่ แล้วปรับความแรงให้เป็นคุณ', adjust: 'ทุกการปรับแก้คำนวณจากรูปต้นฉบับเสมอ', crop: 'ลากกรอบหรือมุมทั้งสี่ แล้วกดใช้การครอป', resize: 'กำหนดขนาดเป็นพิกเซลหรือเปอร์เซ็นต์', effects: 'เติมบรรยากาศทีละนิด รูปก็มีเรื่องเล่า', frame: 'เลือกกรอบที่เข้ากับภาพของคุณ', text: 'เพิ่มข้อความ แล้วลากวางบนรูปได้เลย', stickers: 'เลือกสติ๊กเกอร์ แล้วลากไปวางที่ถูกใจ', draw: 'วาดด้วยนิ้วหรือเมาส์ ยางลบจะลบเฉพาะเส้นวาด', looks: 'สไตล์ที่บันทึกอยู่ในรอบใช้งานนี้เท่านั้น' }[next];
  renderPanel(); scheduleRender();
  if (innerWidth <= 700) $(`.tool-button[data-tool="${next}"]`).scrollIntoView({ behavior: document.body.classList.contains('reduce-motion') ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
}
function presetPanel() {
  inspector.innerHTML = `<p class="inspector-description">200 สไตล์ 8 บรรยากาศ ค้นหาโทนสีที่ใช่สำหรับภาพของคุณ</p><div class="search-field"><input id="preset-search" type="search" placeholder="ค้นหากลิ่นอายที่คุณชอบ…" aria-label="ค้นหาสไตล์รูป" value="${escapeHTML(search)}"></div><div class="category-chips" id="category-chips"></div><button class="preset-original ${!state.preset ? 'active' : ''}" id="original-preset">${icon('image')} Original · ไม่ใช้สไตล์</button><div class="preset-result-count" id="preset-result-count" role="status"></div><div class="preset-grid" id="preset-grid"></div><div class="panel-section"><div id="preset-description" class="preset-description">${state.preset ? escapeHTML(getPreset(state.preset)?.description || '') : 'เริ่มจากสีต้นฉบับ แล้วปรับแสงและสีด้วยตัวคุณเอง'}</div><div style="margin-top:18px">${rangeHTML('ความแรงของสไตล์', 'presetStrength', state.presetStrength, 0, 100, 'preset', 1, '%')}</div></div>`;
  const chipContainer = $('#category-chips');
  for (const item of [...categories, { id: 'favorites', name: '♥ ที่ชอบ' }]) {
    const button = document.createElement('button'); button.className = `category-chip ${category === item.id ? 'active' : ''}`; button.textContent = item.name; button.setAttribute('aria-pressed', String(category === item.id));
    button.onclick = () => { category = item.id; renderPanel(); };
    chipContainer.append(button);
  }
  $('#preset-search').addEventListener('input', event => { search = event.target.value; renderPresetGrid(); });
  $('#original-preset').onclick = () => mutate(() => { state.preset = null; });
  renderPresetGrid();
}
function renderPresetGrid() {
  const container = $('#preset-grid');
  if (!container) return;
  const version = ++thumbnailVersion;
  container.replaceChildren();
  const filtered = presets.filter(preset => (category === 'all' || category === preset.category || category === 'favorites' && favorites.has(preset.id)) && `${preset.name} ${preset.description} ${categories.find(item => item.id === preset.category)?.name}`.toLowerCase().includes(search.toLowerCase().trim()));
  $('#preset-result-count').textContent = `พบ ${filtered.length} สไตล์`;
  thumbnailObserver?.disconnect();
  thumbnailQueue = [];
  if (!filtered.length) { container.innerHTML = '<p class="empty-results">ยังไม่พบสไตล์นี้ ลองคำอื่นหรือกด ♡ ที่สไตล์ที่ชอบ</p>'; return; }
  thumbnailObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      thumbnailObserver.unobserve(entry.target);
      thumbnailQueue.push({ target: entry.target, id: entry.target.dataset.presetThumb, version });
    }
    pumpThumbnails();
  }, { root: inspector, rootMargin: '220px' });
  for (const preset of filtered) {
    const wrapper = document.createElement('div'); wrapper.className = 'preset-wrapper';
    const button = document.createElement('button'); button.className = `preset-card ${state.preset === preset.id ? 'active' : ''}`; button.setAttribute('aria-pressed', String(state.preset === preset.id)); button.setAttribute('aria-label', preset.name);
    const thumb = document.createElement('canvas'); thumb.width = 150; thumb.height = 112; thumb.setAttribute('aria-hidden', 'true'); thumb.dataset.presetThumb = preset.id;
    const name = document.createElement('span'); name.className = 'preset-card-name'; name.textContent = preset.name;
    button.append(thumb, name);
    button.onclick = () => {
      mutate(() => { state.preset = preset.id; }, false);
      inspector.querySelectorAll('.preset-card').forEach(card => { card.classList.toggle('active', card === button); card.setAttribute('aria-pressed', String(card === button)); });
      $('#original-preset').classList.remove('active');
      $('#preset-description').textContent = preset.description;
    };
    const favorite = document.createElement('button'); favorite.className = `favorite-toggle ${favorites.has(preset.id) ? 'active' : ''}`; favorite.innerHTML = icon('heart'); favorite.setAttribute('aria-label', `ชื่นชอบ ${preset.name}`); favorite.setAttribute('aria-pressed', String(favorites.has(preset.id)));
    favorite.onclick = () => { if (favorites.has(preset.id)) favorites.delete(preset.id); else favorites.add(preset.id); if (category === 'favorites') renderPresetGrid(); else { favorite.classList.toggle('active', favorites.has(preset.id)); favorite.setAttribute('aria-pressed', String(favorites.has(preset.id))); } };
    wrapper.append(button, favorite); container.append(wrapper);
    const cached = thumbnailCache.get(preset.id);
    if (cached) thumb.getContext('2d').drawImage(cached, 0, 0);
    else thumbnailObserver.observe(thumb);
  }
}
async function prepareThumbnailSource() {
  if (thumbnailSource) return thumbnailSource;
  if (!thumbnailSourcePromise) thumbnailSourcePromise = (async () => {
    const image = new Image(); image.src = 'assets/images/cosmic-lake.jpg'; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 180; canvas.height = 120;
    const context = canvas.getContext('2d'); const scale = Math.max(180 / image.width, 120 / image.height);
    context.drawImage(image, (180 - image.width * scale) / 2, (120 - image.height * scale) / 2, image.width * scale, image.height * scale);
    thumbnailSource = canvas;
    return canvas;
  })().catch(error => { thumbnailSourcePromise = null; throw error; });
  return thumbnailSourcePromise;
}
async function pumpThumbnails() {
  if (thumbnailWorking) return;
  thumbnailWorking = true;
  try {
    const source = await prepareThumbnailSource();
    while (thumbnailQueue.length) {
      const job = thumbnailQueue.shift();
      if (job.version !== thumbnailVersion || !job.target.isConnected) continue;
      await nextFrame();
      if (job.version !== thumbnailVersion || !job.target.isConnected) continue;
      let cached = thumbnailCache.get(job.id);
      if (!cached) {
        const result = renderImage(source, presetState(job.id, 95), { maxSide: 150 });
        cached = document.createElement('canvas'); cached.width = 150; cached.height = 112;
        const context = cached.getContext('2d'); const scale = Math.max(150 / result.canvas.width, 112 / result.canvas.height);
        context.drawImage(result.canvas, (150 - result.canvas.width * scale) / 2, (112 - result.canvas.height * scale) / 2, result.canvas.width * scale, result.canvas.height * scale);
        thumbnailCache.set(job.id, cached);
      }
      job.target.getContext('2d').drawImage(cached, 0, 0);
    }
  } catch { notify('โหลดภาพตัวอย่างสไตล์ไม่สำเร็จ ลองเปิดเครื่องมือสไตล์อีกครั้ง', true); }
  finally { thumbnailWorking = false; }
}
function adjustPanel() {
  inspector.innerHTML = `<p class="inspector-description">ปรับทีละนิดจนใช่ ทุกค่าทำงานร่วมกับสไตล์ที่เลือกได้</p>${adjustmentKeys.map(key => { const base = ['brightness', 'contrast', 'saturation'].includes(key); return rangeHTML(adjustmentLabels[key], key, state.adjustments[key], base ? 0 : key === 'hue' ? -180 : key === 'blur' ? 0 : -100, base ? 200 : key === 'hue' ? 180 : key === 'blur' ? 20 : 100, 'adjustments', key === 'blur' ? 0.1 : 1); }).join('')}<p class="field-note">ค่าปรับสีเป็นค่าเพิ่มเติมจากพรีเซ็ต กดรีเซ็ตด้านบนเพื่อคืนค่าเฉพาะเครื่องมือนี้</p>`;
}
function effectsPanel() {
  inspector.innerHTML = `<p class="inspector-description">24 เอฟเฟกต์ ปรับผสมได้อิสระจากพรีเซ็ต ค่า 0 คือปิดเอฟเฟกต์นั้น</p>${effectGroups.map(([title, keys], index) => `<details class="effect-group" ${index === 0 ? 'open' : ''}><summary>${title}<span>${keys.length}</span></summary><div class="effect-group-body">${keys.map(key => rangeHTML(effectLabels[key], key, state.effects[key], 0, 100, 'effects')).join('')}</div></details>`).join('')}<p class="field-note">เอฟเฟกต์หนักหลายตัวพร้อมกันอาจทำให้เครื่องช้าลงเล็กน้อยขณะส่งออกความละเอียดสูง</p>`;
}
function cropPanel() {
  const ratios = [['free', 'อิสระ', ''], ['original', 'ต้นฉบับ', ''], ['1:1', '1:1', 'square'], ['4:5', '4:5', 'portrait'], ['3:4', '3:4', 'portrait'], ['9:16', '9:16', 'story'], ['16:9', '16:9', 'wide'], ['3:2', '3:2', 'wide']];
  inspector.innerHTML = `<p class="inspector-description">ลากกรอบบนรูปเพื่อเลือกส่วนที่ใช่ สัดส่วนคำนวณตามระนาบหลังหมุนและจัดแนว</p><div class="button-grid">${ratios.map(([id, name, shape]) => `<button class="option-button ${cropRatio === id ? 'active' : ''}" data-ratio="${id}" aria-pressed="${cropRatio === id}"><span class="ratio-symbol ${shape}"></span>${name}</button>`).join('')}</div><div class="field-row" style="margin-top:13px"><label>สัดส่วนกว้าง<input id="crop-ratio-w" type="number" min="1" max="100" value="4"></label><label>สัดส่วนสูง<input id="crop-ratio-h" type="number" min="1" max="100" value="5"></label></div><button class="button button-outline full-width" id="custom-ratio">ใช้สัดส่วนที่กำหนด</button><div class="panel-section"><div class="panel-title">หมุนและกลับด้าน</div><div class="button-grid"><button class="option-button" id="rotate-left">${icon('undo')} ซ้าย 90°</button><button class="option-button" id="rotate-right">${icon('redo')} ขวา 90°</button><button class="option-button ${state.flipX ? 'active' : ''}" id="flip-x">${icon('flip')} กลับซ้าย–ขวา</button><button class="option-button ${state.flipY ? 'active' : ''}" id="flip-y">${icon('flip')} กลับบน–ล่าง</button></div><div style="margin-top:18px">${rangeHTML('ปรับมุมเอียง', 'straighten', state.straighten, -45, 45, 'crop', 0.5, '°')}</div><p class="field-note">จัดแนวจะครอปขอบบางส่วนอัตโนมัติเพื่อไม่ให้มีพื้นที่ว่าง</p></div><div class="panel-actions"><button class="button button-outline" id="cancel-crop">ยกเลิก</button><button class="button button-primary" id="apply-crop">${icon('check')} ใช้การครอป</button></div>`;
  inspector.querySelectorAll('[data-ratio]').forEach(button => button.onclick = () => { setCropRatio(button.dataset.ratio); renderPanel(); });
  $('#custom-ratio').onclick = () => { const width = Number($('#crop-ratio-w').value), height = Number($('#crop-ratio-h').value); if (!(width > 0 && height > 0 && width <= 100 && height <= 100)) return notify('ใส่สัดส่วนตั้งแต่ 1 ถึง 100 ทั้งสองช่อง', true); setCropRatio(width / height); inspector.querySelectorAll('[data-ratio]').forEach(button => button.classList.remove('active')); notify(`ใช้สัดส่วน ${width}:${height} แล้ว`); };
  $('#rotate-left').onclick = () => mutate(() => { const crop = state.crop; state.crop = { x: crop.y, y: 1 - crop.x - crop.w, w: crop.h, h: crop.w }; cropDraft = clone(state.crop); state.rotation = (state.rotation + 270) % 360; }, false);
  $('#rotate-right').onclick = () => mutate(() => { const crop = state.crop; state.crop = { x: 1 - crop.y - crop.h, y: crop.x, w: crop.h, h: crop.w }; cropDraft = clone(state.crop); state.rotation = (state.rotation + 90) % 360; }, false);
  $('#flip-x').onclick = () => mutate(() => { state.flipX = !state.flipX; });
  $('#flip-y').onclick = () => mutate(() => { state.flipY = !state.flipY; });
  $('#cancel-crop').onclick = () => { cropDraft = clone(state.crop); cropRatio = 'free'; updateCropOverlay(); notify('ยกเลิกการครอปที่ยังไม่ได้ใช้แล้ว'); };
  $('#apply-crop').onclick = () => { mutate(() => { state.crop = clone(cropDraft); }, false); fitCanvas(); notify('ใช้การครอปแล้ว · ย้อนกลับได้เสมอ'); };
}
function fullGeometrySize() { return geometrySize(source, { ...state, crop: { x: 0, y: 0, w: 1, h: 1 } }); }
function setCropRatio(ratio) {
  cropRatio = ratio;
  const full = fullGeometrySize();
  let numeric = ratio;
  if (ratio === 'free') { updateCropOverlay(); return; }
  if (ratio === 'original') numeric = source.width / source.height;
  if (typeof ratio === 'string' && ratio.includes(':')) { const [w, h] = ratio.split(':').map(Number); numeric = w / h; }
  const normalized = numeric / (full.width / full.height);
  const center = { x: cropDraft.x + cropDraft.w / 2, y: cropDraft.y + cropDraft.h / 2 };
  let width = 1, height = 1;
  if (normalized > 1) height = 1 / normalized; else width = normalized;
  cropDraft = { x: clamp(center.x - width / 2, 0, 1 - width), y: clamp(center.y - height / 2, 0, 1 - height), w: width, h: height };
  updateCropOverlay();
}
function updateCropOverlay() {
  const overlay = $('#crop-overlay');
  overlay.hidden = tool !== 'crop' || !source || !cropDraft;
  if (overlay.hidden) return;
  overlay.style.left = `${cropDraft.x * 100}%`; overlay.style.top = `${cropDraft.y * 100}%`; overlay.style.width = `${cropDraft.w * 100}%`; overlay.style.height = `${cropDraft.h * 100}%`;
  const full = fullGeometrySize();
  $('#crop-size').textContent = `${Math.round(full.width * cropDraft.w)} × ${Math.round(full.height * cropDraft.h)}`;
}
$('#crop-overlay').addEventListener('pointerdown', event => {
  if (tool !== 'crop' || !cropDraft) return;
  event.preventDefault(); event.stopPropagation();
  const rect = canvas.getBoundingClientRect();
  cropDrag = { handle: event.target.dataset.handle || 'move', x: event.clientX, y: event.clientY, crop: clone(cropDraft), width: rect.width, height: rect.height };
  event.currentTarget.setPointerCapture(event.pointerId);
});
$('#crop-overlay').addEventListener('pointermove', event => {
  if (!cropDrag) return;
  const dx = (event.clientX - cropDrag.x) / cropDrag.width, dy = (event.clientY - cropDrag.y) / cropDrag.height;
  const initial = cropDrag.crop;
  if (cropDrag.handle === 'move') { cropDraft = { ...initial, x: clamp(initial.x + dx, 0, 1 - initial.w), y: clamp(initial.y + dy, 0, 1 - initial.h) }; }
  else {
    const handle = cropDrag.handle;
    let x = handle.includes('w') ? clamp(initial.x + dx, 0, initial.x + initial.w - 0.04) : initial.x;
    let y = handle.includes('n') ? clamp(initial.y + dy, 0, initial.y + initial.h - 0.04) : initial.y;
    let width = handle.includes('w') ? initial.x + initial.w - x : clamp(initial.w + dx, 0.04, 1 - x);
    let height = handle.includes('n') ? initial.y + initial.h - y : clamp(initial.h + dy, 0.04, 1 - y);
    if (cropRatio !== 'free') {
      const full = fullGeometrySize();
      let ratio = cropRatio === 'original' ? source.width / source.height : typeof cropRatio === 'number' ? cropRatio : Number(cropRatio.split(':')[0]) / Number(cropRatio.split(':')[1]);
      ratio /= full.width / full.height;
      height = width / ratio;
      if (height > (handle.includes('n') ? initial.y + initial.h : 1 - y)) { height = handle.includes('n') ? initial.y + initial.h : 1 - y; width = height * ratio; }
      if (handle.includes('w')) x = initial.x + initial.w - width;
      if (handle.includes('n')) y = initial.y + initial.h - height;
    }
    cropDraft = { x, y, w: width, h: height };
  }
  updateCropOverlay();
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) $('#crop-overlay').addEventListener(type, () => { cropDrag = null; });

function resizePanel() {
  const natural = outputSize(source, { ...state, resize: null });
  const current = state.resize || natural;
  inspector.innerHTML = `<p class="inspector-description">กำหนดขนาดไฟล์ส่งออกโดยอิสระจากการครอป ล็อกสัดส่วนเพื่อไม่ให้ภาพยืดผิดรูป</p><div class="export-size-row"><span>ขนาดปัจจุบันรวมกรอบ</span><span>${natural.width} × ${natural.height} px</span></div><div class="resize-fields"><label>กว้าง (px)<input id="resize-width" type="number" min="1" max="8192" value="${current.width}"></label><button class="icon-button" id="resize-lock" aria-label="ล็อกสัดส่วน" aria-pressed="true">${icon('link')}</button><label>สูง (px)<input id="resize-height" type="number" min="1" max="8192" value="${current.height}"></label></div><label class="checkbox-label" style="margin-top:15px"><input id="resize-percent-mode" type="checkbox"> กำหนดเป็นเปอร์เซ็นต์</label><div class="field-row" id="resize-percent-field" hidden><label>ขนาด (%)<input id="resize-percent" type="number" min="1" max="500" value="100"></label></div><div class="panel-section"><div class="panel-title">ขนาดที่ใช้บ่อย</div><div class="button-grid two">${[25, 50, 100, 200].map(percent => `<button class="option-button" data-percent="${percent}">${percent}%</button>`).join('')}</div></div><button class="button button-primary full-width" id="apply-resize">${icon('check')} ใช้ขนาดนี้</button><button class="button button-outline full-width" id="original-size">คืนขนาดธรรมชาติ</button><p class="field-note">ขยายรูปเพิ่มจำนวนพิกเซล แต่ไม่ได้เพิ่มรายละเอียดต้นฉบับ ส่งออกสูงสุด 24 ล้านพิกเซลและด้านยาว 8,192 px</p>`;
  let locked = true;
  let ratio = current.width / current.height;
  $('#resize-lock').onclick = event => { locked = !locked; ratio = Number($('#resize-width').value) / Math.max(1, Number($('#resize-height').value)); const button = event.currentTarget; button.setAttribute('aria-pressed', String(locked)); button.innerHTML = icon(locked ? 'link' : 'unlock'); };
  for (const dimension of ['width', 'height']) $(`#resize-${dimension}`).addEventListener('input', event => {
    if (!locked) return;
    const value = Number(event.target.value);
    if (value > 0) $(`#resize-${dimension === 'width' ? 'height' : 'width'}`).value = Math.max(1, Math.round(dimension === 'width' ? value / ratio : value * ratio));
  });
  $('#resize-percent-mode').onchange = event => { $('#resize-percent-field').hidden = !event.target.checked; };
  $('#resize-percent').oninput = event => { const percent = Number(event.target.value) / 100; if (percent > 0) { $('#resize-width').value = Math.max(1, Math.round(natural.width * percent)); $('#resize-height').value = Math.max(1, Math.round(natural.height * percent)); ratio = natural.width / natural.height; } };
  inspector.querySelectorAll('[data-percent]').forEach(button => button.onclick = () => { $('#resize-percent-mode').checked = true; $('#resize-percent-field').hidden = false; $('#resize-percent').value = button.dataset.percent; $('#resize-percent').dispatchEvent(new Event('input')); });
  $('#apply-resize').onclick = () => { try { const size = validateResize(Number($('#resize-width').value), Number($('#resize-height').value)); mutate(() => { state.resize = size; }, false); fitCanvas(); notify(`ตั้งขนาด ${size.width} × ${size.height} px แล้ว`); } catch (error) { notify(error.message, true); } };
  $('#original-size').onclick = () => mutate(() => { state.resize = null; });
}
function framePanel() {
  inspector.innerHTML = `<p class="inspector-description">32 กรอบ เลือกขอบที่เข้ากับภาพของคุณ ปรับความหนาและสีได้บางกรอบ</p><div class="button-grid two frame-grid">${frameTypes.map(frame => `<button class="option-button ${state.frame.type === frame.id ? 'active' : ''}" data-frame="${frame.id}" aria-pressed="${state.frame.type === frame.id}"><span class="frame-preview frame-${frame.id}"><span></span></span>${frame.name}</button>`).join('')}</div><div class="panel-section" id="frame-options" ${state.frame.type === 'none' ? 'hidden' : ''}>${rangeHTML('ความหนาของกรอบ', 'width', state.frame.width, 1, 15, 'frame', 0.5, '%')}<label class="color-field">สีกรอบ<input id="frame-color" type="color" value="${state.frame.color}"></label><p class="field-note">กรอบสีสำเร็จรูปและกรอบลวดลายใช้สีประจำแบบ ส่วนมุมมนจะคงพื้นหลังโปร่งใส</p></div>`;
  inspector.querySelectorAll('[data-frame]').forEach(button => button.onclick = () => mutate(() => { state.frame.type = button.dataset.frame; }));
  $('#frame-color').oninput = event => { state.frame.color = event.target.value; scheduleRender(); };
  $('#frame-color').onchange = () => commit();
}
function selectedObject() { return [...state.texts, ...state.stickers].find(object => object.id === selectedId); }
function swatchHTML(target) { return `<div class="swatches">${colors.map(color => `<button class="swatch" style="background:${color}" data-color="${color}" data-target="${target}" aria-label="เลือกสี ${color}"></button>`).join('')}</div>`; }
function bindSwatches() {
  inspector.querySelectorAll('[data-color]').forEach(button => button.onclick = () => mutate(() => { const target = button.dataset.target; if (target === 'draw') drawOptions.color = button.dataset.color; else if (target === 'object') { const object = selectedObject(); if (object) object.color = button.dataset.color; } }));
}
function objectList(objects, kind) {
  return objects.length ? `<div class="object-list">${objects.map((object, index) => `<button data-object="${object.id}" class="${selectedId === object.id ? 'active' : ''}">${icon(kind === 'text' ? 'type' : 'sticker')}<span>${escapeHTML(kind === 'text' ? object.text.slice(0, 28) || 'ข้อความว่าง' : stickerLabel(object.type))} ${index + 1}</span></button>`).join('')}</div>` : '';
}
function bindObjectList() { inspector.querySelectorAll('[data-object]').forEach(button => button.onclick = () => { selectedId = button.dataset.object; renderPanel(); scheduleRender(); }); }
function objectControls(object, isText) {
  const isEmoji = !isText && object.type.startsWith('emoji:');
  return `<div class="panel-section"><div class="panel-title">${isText ? 'ปรับข้อความที่เลือก' : 'ปรับสติ๊กเกอร์ที่เลือก'}</div>${isText ? `<label class="field-label" for="object-text">ข้อความ</label><textarea id="object-text" maxlength="160" rows="2">${escapeHTML(object.text)}</textarea><label class="field-label" for="font-search">ฟอนต์ · ${fontFamilies.length} แบบ</label><div class="search-field"><input id="font-search" type="search" placeholder="ค้นหาฟอนต์…" value="${escapeHTML(fontSearch)}" aria-label="ค้นหาฟอนต์"></div><div class="font-grid" id="font-grid" role="listbox" aria-label="เลือกฟอนต์"></div><label class="checkbox-label" style="margin-top:13px"><input id="object-shadow" type="checkbox" ${object.shadow ? 'checked' : ''}> เงาให้อ่านง่าย</label>` : ''}${isEmoji ? '<p class="field-note">อีโมจิใช้สีมาตรฐานของระบบ เปลี่ยนสีไม่ได้ แต่ย่อ ขยาย และหมุนได้</p>' : `<label class="color-field">สี<input id="object-color" type="color" value="${object.color}"></label>${swatchHTML('object')}`}${rangeHTML('ขนาด', 'size', object.size, isText ? 2 : 3, isText ? 25 : 45, 'object', 0.5, '%')}${rangeHTML('หมุน', 'rotation', object.rotation, -180, 180, 'object', 1, '°')}<div class="panel-actions"><button class="button button-outline" id="duplicate-object">ทำสำเนา</button><button class="button button-outline danger-button" id="delete-object">${icon('trash')} ลบ</button></div><div class="button-grid nudge-grid"><button class="option-button" data-nudge="left" aria-label="เลื่อนซ้าย">←</button><button class="option-button" data-nudge="up" aria-label="เลื่อนขึ้น">↑</button><button class="option-button" data-nudge="down" aria-label="เลื่อนลง">↓</button><button class="option-button" data-nudge="right" aria-label="เลื่อนขวา">→</button></div><p class="field-note">ลากบนรูปเพื่อจัดตำแหน่ง หรือใช้ปุ่มลูกศรเพื่อเลื่อนทีละนิด</p></div>`;
}
function bindObjectControls(isText) {
  const object = selectedObject();
  if (!object) return;
  if (isText) {
    $('#object-text').oninput = event => { object.text = event.target.value; scheduleRender(); };
    $('#object-text').onchange = () => commit();
    $('#object-shadow').onchange = event => mutate(() => { object.shadow = event.target.checked; }, false);
    $('#font-search').oninput = event => { fontSearch = event.target.value; renderFontGrid(object); };
    renderFontGrid(object);
  }
  if ($('#object-color')) {
    $('#object-color').oninput = event => { object.color = event.target.value; scheduleRender(); };
    $('#object-color').onchange = () => commit();
  }
  $('#delete-object').onclick = () => deleteSelected();
  $('#duplicate-object').onclick = () => mutate(() => { const copy = { ...clone(object), id: uid(), x: clamp(object.x + 0.04, 0, 1), y: clamp(object.y + 0.04, 0, 1) }; (isText ? state.texts : state.stickers).push(copy); selectedId = copy.id; });
  inspector.querySelectorAll('[data-nudge]').forEach(button => button.onclick = () => mutate(() => { const direction = button.dataset.nudge; if (direction === 'left') object.x = clamp(object.x - 0.01, 0, 1); if (direction === 'right') object.x = clamp(object.x + 0.01, 0, 1); if (direction === 'up') object.y = clamp(object.y - 0.01, 0, 1); if (direction === 'down') object.y = clamp(object.y + 0.01, 0, 1); }, false));
  bindSwatches();
}
function renderFontGrid(object) {
  const container = $('#font-grid');
  if (!container) return;
  container.replaceChildren();
  const query = fontSearch.toLowerCase().trim();
  const filtered = fontFamilies.filter(font => `${font.label} ${font.family} ${font.group}`.toLowerCase().includes(query));
  if (!filtered.length) { container.innerHTML = '<p class="empty-results">ไม่พบฟอนต์นี้</p>'; return; }
  for (const font of filtered) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `font-option ${object.font === font.family ? 'active' : ''}`;
    button.setAttribute('role', 'option');
    button.setAttribute('aria-selected', String(object.font === font.family));
    button.dataset.font = font.family;
    const sample = document.createElement('span'); sample.className = 'font-sample'; sample.style.fontFamily = `"${font.family}", "Noto Sans Thai", sans-serif`; sample.textContent = font.group === 'display' ? 'Aa 123' : 'กข Aa';
    const name = document.createElement('small'); name.textContent = font.label;
    button.append(sample, name);
    button.onclick = async () => {
      button.disabled = true;
      try { await loadFont(font.family); }
      catch { notify('โหลดฟอนต์ไม่สำเร็จ ใช้ฟอนต์สำรองแทน', true); }
      mutate(() => { object.font = font.family; }, false);
      renderFontGrid(object);
    };
    container.append(button);
    loadFont(font.family).catch(() => {});
  }
}
function textPanel() {
  const object = state.texts.find(item => item.id === selectedId);
  inspector.innerHTML = `<p class="inspector-description">ใส่คำที่เป็นคุณ ลากวาง หมุน และเลือกสีได้อย่างอิสระ</p><button class="button button-primary full-width" id="add-text">${icon('plus')} เพิ่มข้อความ</button>${objectList(state.texts, 'text')}${object ? objectControls(object, true) : '<div class="object-empty">เพิ่มข้อความใหม่ หรือเลือกข้อความบนรูปเพื่อแก้ไข</div>'}`;
  $('#add-text').onclick = () => { if (state.texts.length >= 30) return notify('ใส่ข้อความได้สูงสุด 30 รายการต่อภาพ', true); mutate(() => { const object = { id: uid(), text: 'ความเป็นคุณ', x: 0.5, y: 0.5, size: 8, color: '#ffffff', font: 'Noto Sans Thai', weight: 600, rotation: 0, shadow: true }; state.texts.push(object); selectedId = object.id; }); };
  bindObjectList(); bindObjectControls(true);
}
function stickerPanel() {
  const object = state.stickers.find(item => item.id === selectedId);
  const drawn = stickerTypes.map(type => `<button class="sticker-option" data-sticker="${type}" aria-label="เพิ่ม${stickerLabels[type]}"><canvas width="84" height="84" data-sticker-preview="${type}" aria-hidden="true"></canvas></button>`).join('');
  const emoji = emojiTypes.map(value => `<button class="sticker-option emoji-option" data-sticker="emoji:${value}" aria-label="เพิ่มอีโมจิ ${value}"><span aria-hidden="true">${value}</span></button>`).join('');
  inspector.innerHTML = `<p class="inspector-description">${stickerTypes.length} สติ๊กเกอร์วาด และ ${emojiTypes.length} อีโมจิ เลือกแล้วลากไปวางได้เลย</p><div class="segmented-control" role="tablist" aria-label="ชนิดสติ๊กเกอร์"><button role="tab" id="sticker-tab-drawn" data-sticker-tab="drawn" aria-selected="${stickerTab === 'drawn'}" aria-controls="sticker-library">สติ๊กเกอร์</button><button role="tab" id="sticker-tab-emoji" data-sticker-tab="emoji" aria-selected="${stickerTab === 'emoji'}" aria-controls="sticker-library">อีโมจิ</button></div><div class="sticker-grid" id="sticker-library" role="tabpanel" aria-labelledby="sticker-tab-${stickerTab}">${stickerTab === 'drawn' ? drawn : emoji}</div>${objectList(state.stickers, 'sticker')}${object ? objectControls(object, false) : '<div class="object-empty">เลือกสติ๊กเกอร์ด้านบนเพื่อเพิ่มลงบนภาพ</div>'}`;
  inspector.querySelectorAll('[data-sticker-tab]').forEach(button => button.onclick = () => { stickerTab = button.dataset.stickerTab; renderPanel(); });
  inspector.querySelectorAll('[data-sticker-preview]').forEach(target => { const context = target.getContext('2d'); context.translate(42, 42); drawSticker(context, target.dataset.stickerPreview, 62, '#c4a0f5'); });
  inspector.querySelectorAll('[data-sticker]').forEach(button => button.onclick = () => { if (state.stickers.length >= 60) return notify('ใส่สติ๊กเกอร์และอีโมจิได้สูงสุด 60 รายการต่อภาพ', true); mutate(() => { const object = { id: uid(), type: button.dataset.sticker, x: 0.5, y: 0.5, size: 16, color: '#c4a0f5', rotation: 0 }; state.stickers.push(object); selectedId = object.id; }); });
  bindObjectList(); bindObjectControls(false);
}
function drawPanel() {
  inspector.innerHTML = `<p class="inspector-description">วาดเส้นของคุณลงบนภาพ ยางลบจะลบเฉพาะเส้นที่วาด ไม่ลบเนื้อภาพ</p><div class="button-grid">${[['pen', 'ปากกา', 'pen'], ['highlighter', 'ไฮไลต์', 'highlighter'], ['eraser', 'ยางลบ', 'eraser']].map(([id, name, symbol]) => `<button class="option-button ${drawOptions.tool === id ? 'active' : ''}" data-draw-tool="${id}" aria-pressed="${drawOptions.tool === id}">${icon(symbol)}${name}</button>`).join('')}</div><label class="color-field">สีปากกา<input id="draw-color" type="color" value="${drawOptions.color}"></label>${swatchHTML('draw')}${rangeHTML('ความหนาเส้น', 'size', drawOptions.size, 0.2, 8, 'draw', 0.1, '%')}<div class="panel-section button-stack"><button class="button button-outline full-width" id="undo-stroke" ${state.strokes.length ? '' : 'disabled'}>${icon('undo')} ลบเส้นล่าสุด</button><button class="button button-outline danger-button full-width" id="clear-strokes" ${state.strokes.length ? '' : 'disabled'}>${icon('trash')} ล้างเส้นวาดทั้งหมด</button></div><p class="field-note">ทุกเส้นย้อนกลับได้ จำนวนเส้นปัจจุบัน: ${state.strokes.length}</p>`;
  inspector.querySelectorAll('[data-draw-tool]').forEach(button => button.onclick = () => { drawOptions.tool = button.dataset.drawTool; renderPanel(); });
  $('#draw-color').onchange = event => { drawOptions.color = event.target.value; };
  $('#undo-stroke').onclick = () => mutate(() => { state.strokes.pop(); });
  $('#clear-strokes').onclick = () => confirmAction('ล้างเส้นวาดทั้งหมด?', 'ลบเฉพาะเส้นที่วาด สี สไตล์ และข้อความอื่นยังอยู่ และย้อนกลับได้', 'ล้างเส้นวาด').then(ok => { if (ok) mutate(() => { state.strokes = []; }); });
  bindSwatches();
}
function looksPanel() {
  inspector.innerHTML = `<p class="inspector-description">เก็บสี เอฟเฟกต์ และกรอบที่ปรับไว้ ใช้กับรูปอื่นในรอบนี้ได้ ไม่บันทึกลงเครื่องหรือเซิร์ฟเวอร์</p><label class="field-label" for="look-name">ตั้งชื่อสไตล์ของคุณ</label><input id="look-name" type="text" maxlength="36" placeholder="เช่น My Sunday Film"><button class="button button-primary full-width" id="save-look">${icon('save')} บันทึกรอบใช้งานนี้</button><div class="panel-section"><div class="panel-title">สไตล์ที่บันทึกไว้ <span>${savedLooks.length}/12</span></div><div id="look-list"></div>${savedLooks.length ? '' : '<div class="object-empty">ยังไม่มีสไตล์ที่บันทึก ลองปรับสีแล้วตั้งชื่อเลย</div>'}</div><p class="field-note">เมื่อปิดหรือรีเฟรชหน้า สไตล์เหล่านี้จะหายไปตามนโยบายไม่เก็บข้อมูล</p>`;
  $('#save-look').onclick = () => {
    const name = $('#look-name').value.trim();
    if (!name) { $('#look-name').focus(); return notify('ตั้งชื่อสไตล์ก่อนบันทึกนะ', true); }
    if (savedLooks.length >= 12) return notify('บันทึกได้สูงสุด 12 สไตล์ ลบอันเก่าก่อนเพิ่มใหม่', true);
    savedLooks.push({ id: uid(), name, settings: clone({ preset: state.preset, presetStrength: state.presetStrength, adjustments: state.adjustments, effects: state.effects, frame: state.frame }) });
    renderPanel(); notify(`บันทึก “${name}” ในรอบใช้งานแล้ว`);
  };
  const list = $('#look-list');
  for (const look of savedLooks) {
    const row = document.createElement('div'); row.className = 'look-card';
    const apply = document.createElement('button'); apply.textContent = look.name; apply.onclick = () => mutate(() => { Object.assign(state, clone(look.settings)); selectedId = null; });
    const remove = document.createElement('button'); remove.className = 'icon-button'; remove.innerHTML = icon('trash'); remove.setAttribute('aria-label', `ลบสไตล์ ${look.name}`); remove.onclick = () => { savedLooks = savedLooks.filter(item => item.id !== look.id); renderPanel(); };
    row.append(apply, remove); list.append(row);
  }
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
  const content = metadata.content;
  return { x: (x - content.x) / content.w, y: (y - content.y) / content.h };
}
mat.addEventListener('pointerdown', event => {
  if (!source || loading || tool === 'crop' || event.target.closest('#crop-overlay') || comparing) return;
  const point = canvasPoint(event);
  if (tool === 'draw') {
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    event.preventDefault();
    const stroke = { id: uid(), ...clone(drawOptions), points: [point] };
    state.strokes.push(stroke);
    interaction = { type: 'draw', stroke, pointerId: event.pointerId };
    interacting = true; mat.setPointerCapture(event.pointerId); scheduleRender();
  } else if (['text', 'stickers'].includes(tool)) {
    const photoX = point.x * canvas.width * metadata.content.w, photoY = point.y * canvas.height * metadata.content.h;
    const hit = [...metadata.bounds].reverse().find(box => photoX >= box.x - 6 && photoX <= box.x + box.w + 6 && photoY >= box.y - 6 && photoY <= box.y + box.h + 6);
    selectedId = hit?.id || null;
    if (hit) {
      const object = selectedObject();
      interaction = { type: 'object', object, x: point.x, y: point.y, initialX: object.x, initialY: object.y, pointerId: event.pointerId };
      interacting = true; mat.setPointerCapture(event.pointerId); event.preventDefault();
    }
    renderPanel(); scheduleRender();
  }
});
mat.addEventListener('pointermove', event => {
  if (!interaction || event.pointerId !== interaction.pointerId) return;
  const point = canvasPoint(event);
  if (interaction.type === 'draw') {
    const last = interaction.stroke.points.at(-1), next = { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) };
    if (Math.hypot(next.x - last.x, next.y - last.y) > 0.002 && interaction.stroke.points.length < 4000) interaction.stroke.points.push(next);
  } else {
    interaction.object.x = clamp(interaction.initialX + point.x - interaction.x, 0, 1);
    interaction.object.y = clamp(interaction.initialY + point.y - interaction.y, 0, 1);
  }
  scheduleRender();
});
function finishInteraction(event) {
  if (!interaction || event.pointerId !== interaction.pointerId) return;
  if (interaction.type === 'draw' && event.type === 'pointercancel') state.strokes = state.strokes.filter(stroke => stroke.id !== interaction.stroke.id);
  interaction = null; interacting = false; commit(); scheduleRender();
  if (tool === 'draw') renderPanel();
}
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) mat.addEventListener(type, finishInteraction);
function deleteSelected() {
  if (!selectedObject()) return;
  mutate(() => { state.texts = state.texts.filter(object => object.id !== selectedId); state.stickers = state.stickers.filter(object => object.id !== selectedId); selectedId = null; });
}

async function loadFile(file, preset = null) {
  if (!file || loading) return;
  const version = ++loadVersion;
  setBusy(true);
  try {
    const decoded = await decodeFile(file);
    if (version !== loadVersion) return;
    source = decoded; sourceName = file.name || 'clipboard-image.png';
    state = initialState();
    if (getPreset(preset)) { state.preset = preset; state.presetStrength = 85; }
    baseline = JSON.stringify(state); history = [baseline]; historyIndex = 0; selectedId = null; zoom = 1;
    $('#empty-state').hidden = true; $('#canvas-scroll').hidden = false;
    category = 'all'; search = '';
    setTool('presets'); fitCanvas();
    await document.fonts.ready;
    notify(`เปิด ${sourceName} แล้ว · รูปอยู่ในเครื่องคุณเท่านั้น`);
  } catch (error) { notify(error.message || 'เปิดรูปไม่สำเร็จ กรุณาลองไฟล์ JPG, PNG หรือ WebP', true); }
  finally { if (version === loadVersion) setBusy(false); fileInput.value = ''; }
}
async function loadDemo(preset = null) {
  if (loading) return;
  setBusy(true, 'กำลังเตรียมรูปตัวอย่าง…');
  try {
    const response = await fetch('assets/images/cosmic-lake.jpg');
    if (!response.ok) throw new Error('โหลดรูปตัวอย่างไม่สำเร็จ');
    const blob = await response.blob();
    setBusy(false);
    await loadFile(new File([blob], 'my-little-universe.jpg', { type: 'image/jpeg' }), preset);
  } catch (error) { setBusy(false); notify(error.message, true); }
}
async function requestOpen() { if (isDirty() && !await confirmAction('เปลี่ยนรูปใหม่ไหม?', 'งานปัจจุบันยังไม่ถูกดาวน์โหลด การเปลี่ยนรูปจะล้างงานนี้จากรอบใช้งาน', 'เปลี่ยนรูป')) return; fileInput.click(); }
$('#open-button').onclick = requestOpen;
$('#empty-open').onclick = () => fileInput.click();
$('#demo-button').onclick = () => loadDemo();
fileInput.onchange = () => { if (fileInput.files[0]) loadFile(fileInput.files[0]); };
let dragDepth = 0;
document.addEventListener('dragenter', event => { if (!event.dataTransfer?.types.includes('Files')) return; event.preventDefault(); dragDepth++; $('#drop-overlay').hidden = false; });
document.addEventListener('dragover', event => { if (event.dataTransfer?.types.includes('Files')) { event.preventDefault(); event.dataTransfer.dropEffect = 'copy'; } });
document.addEventListener('dragleave', event => { if (!event.dataTransfer?.types.includes('Files')) return; dragDepth = Math.max(0, dragDepth - 1); if (!dragDepth) $('#drop-overlay').hidden = true; });
document.addEventListener('drop', event => { event.preventDefault(); dragDepth = 0; $('#drop-overlay').hidden = true; const file = event.dataTransfer?.files[0]; if (file) loadFile(file); });
document.addEventListener('paste', event => {
  if ($$('dialog[open]').length) return;
  const file = [...(event.clipboardData?.items || [])].find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile();
  if (file) { event.preventDefault(); loadFile(file); }
});

function paintOriginal() {
  const original = $('#original-canvas'); original.width = canvas.width; original.height = canvas.height;
  const context = original.getContext('2d'); context.fillStyle = '#191320'; context.fillRect(0, 0, original.width, original.height);
  const scale = Math.min(original.width / source.width, original.height / source.height);
  context.drawImage(source, (original.width - source.width * scale) / 2, (original.height - source.height * scale) / 2, source.width * scale, source.height * scale);
}
function startCompare() { if (!source || loading || comparing) return; comparing = true; paintOriginal(); $('#original-canvas').hidden = false; $('#original-label').hidden = false; $('#compare-button').classList.add('active'); }
function stopCompare() { comparing = false; $('#original-canvas').hidden = true; $('#original-label').hidden = true; $('#compare-button').classList.remove('active'); }
$('#compare-button').addEventListener('pointerdown', event => { event.preventDefault(); startCompare(); event.currentTarget.setPointerCapture(event.pointerId); });
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) $('#compare-button').addEventListener(type, stopCompare);
$('#compare-button').addEventListener('keydown', event => { if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); startCompare(); } });
$('#compare-button').addEventListener('keyup', event => { if ([' ', 'Enter'].includes(event.key)) stopCompare(); });
window.addEventListener('blur', stopCompare);
document.addEventListener('visibilitychange', () => { if (document.hidden) stopCompare(); });

function confirmAction(title, description, action = 'ยืนยัน') {
  $('#confirm-title').textContent = title; $('#confirm-description').textContent = description; $('#confirm-action').textContent = action;
  openDialog($('#confirm-dialog'));
  return new Promise(resolve => { confirmResolver = resolve; });
}
$('#confirm-action').onclick = () => { const resolve = confirmResolver; confirmResolver = null; closeDialog($('#confirm-dialog')); resolve?.(true); };
$('#confirm-dialog').addEventListener('close', () => { if (confirmResolver) { confirmResolver(false); confirmResolver = null; } });
$$('[data-close-dialog]').forEach(button => button.onclick = () => closeDialog(button.closest('dialog')));
$$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
}));
$('#reset-button').onclick = async () => { if (await confirmAction('เริ่มแต่งรูปนี้ใหม่?', 'คืนค่าทุกเครื่องมือเป็นต้นฉบับ ทั้งสี ครอป ขนาด กรอบ ข้อความ และเส้นวาด การรีเซ็ตย้อนกลับได้', 'รีเซ็ตทั้งหมด')) { mutate(() => { state = initialState(); selectedId = null; }); fitCanvas(); notify('คืนค่ารูปต้นฉบับแล้ว'); } };
$('#reset-tool').onclick = () => {
  const defaults = initialState();
  mutate(() => {
    if (tool === 'presets') { state.preset = null; state.presetStrength = 80; }
    if (tool === 'adjust') state.adjustments = defaults.adjustments;
    if (tool === 'effects') state.effects = defaults.effects;
    if (tool === 'crop') { Object.assign(state, { crop: defaults.crop, rotation: 0, straighten: 0, flipX: false, flipY: false }); cropDraft = clone(state.crop); cropRatio = 'free'; }
    if (tool === 'resize') state.resize = null;
    if (tool === 'frame') state.frame = defaults.frame;
    if (tool === 'text') { state.texts = []; selectedId = null; }
    if (tool === 'stickers') { state.stickers = []; selectedId = null; }
    if (tool === 'draw') state.strokes = [];
    if (tool === 'looks') { Object.assign(state, clone({ preset: defaults.preset, presetStrength: defaults.presetStrength, adjustments: defaults.adjustments, effects: defaults.effects, frame: defaults.frame })); }
  });
  notify('รีเซ็ตเฉพาะเครื่องมือนี้แล้ว');
};
$('#home-link').onclick = async event => { if (isDirty()) { event.preventDefault(); if (await confirmAction('กลับหน้าแรกไหม?', 'งานที่ยังไม่ได้ดาวน์โหลดจะหายจากระบบ ดาวน์โหลดก่อนถ้าอยากเก็บภาพไว้', 'กลับหน้าแรก')) { baseline = JSON.stringify(state); location.href = 'index.html'; } } };
window.addEventListener('beforeunload', event => { if (isDirty()) { event.preventDefault(); event.returnValue = ''; } });
$$('.tool-button').forEach(button => button.onclick = () => setTool(button.dataset.tool));
$('#undo-button').onclick = () => travelHistory(-1);
$('#redo-button').onclick = () => travelHistory(1);
$('#zoom-in').onclick = () => changeZoom(0.25);
$('#zoom-out').onclick = () => changeZoom(-0.25);
$('#zoom-fit').onclick = fitCanvas;
$('#fit-button').onclick = fitCanvas;
viewport.addEventListener('wheel', event => { if (source && (event.ctrlKey || event.metaKey)) { event.preventDefault(); changeZoom(event.deltaY < 0 ? 0.1 : -0.1); } }, { passive: false });
$('#help-button').onclick = () => openDialog($('#help-dialog'));
initAccessibility();
$('#reduce-motion').checked = document.body.classList.contains('reduce-motion');
$('#reduce-motion').onchange = event => setMotionOverride(event.target.checked);

function setExportFormat(format) {
  exportFormat = format;
  $$('[data-format]').forEach(button => { const active = button.dataset.format === format; button.classList.toggle('selected', active); button.setAttribute('aria-pressed', String(active)); });
  $('#export-extension').textContent = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[format];
  $('#quality-control').hidden = format === 'image/png';
  $('#format-note').textContent = format === 'image/png' ? 'PNG เก็บพื้นหลังโปร่งใสและรายละเอียดครบ ไฟล์อาจมีขนาดใหญ่' : format === 'image/jpeg' ? 'JPG ไม่รองรับพื้นใส พื้นที่โปร่งใสจะถูกเติมด้วยสีขาว' : 'WebP รองรับพื้นใสและไฟล์ขนาดเล็กกว่า PNG ในภาพส่วนใหญ่';
}
function openExport() {
  if (!source || loading) return;
  stopCompare();
  const oldSelected = selectedId; selectedId = null;
  const result = paintPreview(canvas, source, state, { maxSide: LIMITS.preview });
  metadata = result; selectedId = oldSelected;
  $('#export-preview').src = canvas.toDataURL('image/png');
  exportNatural = outputSize(source, { ...state, resize: null });
  const size = state.resize || exportNatural;
  $('#export-name').textContent = sourceName;
  $('#export-dimensions').textContent = `${size.width.toLocaleString()} × ${size.height.toLocaleString()} px`;
  $('#export-filename').value = sourceName.replace(/\.[^.]+$/, '').slice(0, 90) + '-photoedit';
  $('#natural-size').textContent = `${exportNatural.width} × ${exportNatural.height}`;
  $('#export-width').value = size.width; $('#export-height').value = size.height;
  $('#export-resize-toggle').checked = !!state.resize; $('#export-resize-fields').hidden = !state.resize;
  $('#export-error').hidden = true;
  setExportFormat(exportFormat);
  openDialog(exportDialog);
  scheduleRender();
}
$('#export-button').onclick = openExport;
$$('[data-format]').forEach(button => button.onclick = () => setExportFormat(button.dataset.format));
$('#export-quality').oninput = event => { $('#quality-value').textContent = `${event.target.value}%`; event.target.style.setProperty('--range-progress', `${(Number(event.target.value) - 10) / 90 * 100}%`); };
$('#export-resize-toggle').onchange = event => { $('#export-resize-fields').hidden = !event.target.checked; updateExportDimensions(); };
$('#export-lock').onclick = event => { exportLocked = !exportLocked; event.currentTarget.setAttribute('aria-pressed', String(exportLocked)); event.currentTarget.innerHTML = icon(exportLocked ? 'link' : 'unlock'); };
for (const dimension of ['width', 'height']) $(`#export-${dimension}`).addEventListener('input', event => {
  if (exportLocked && Number(event.target.value) > 0) {
    const ratio = exportNatural.width / exportNatural.height;
    const other = dimension === 'width' ? 'height' : 'width';
    $(`#export-${other}`).value = Math.max(1, Math.round(dimension === 'width' ? Number(event.target.value) / ratio : Number(event.target.value) * ratio));
  }
  updateExportDimensions();
});
function exportState() {
  const next = clone(state);
  next.resize = $('#export-resize-toggle').checked ? validateResize(Number($('#export-width').value), Number($('#export-height').value)) : null;
  return next;
}
function updateExportDimensions() {
  try { const size = outputSize(source, exportState()); $('#export-dimensions').textContent = `${size.width.toLocaleString()} × ${size.height.toLocaleString()} px`; $('#export-error').hidden = true; }
  catch (error) { $('#export-error').textContent = error.message; $('#export-error').hidden = false; }
}
$('#download-button').onclick = async () => {
  if (!source || loading) return;
  const button = $('#download-button');
  let downloadState;
  try { downloadState = exportState(); validateResize(outputSize(source, downloadState).width, outputSize(source, downloadState).height); }
  catch (error) { $('#export-error').textContent = error.message; $('#export-error').hidden = false; return; }
  button.disabled = true; button.innerHTML = '<span class="spinner"></span><span>กำลังสร้างไฟล์ในเครื่อง…</span>';
  $('#export-error').hidden = true;
  await nextFrame();
  try {
    await Promise.all(downloadState.texts.map(object => loadFont(object.font)));
    const blob = await exportBlob(source, downloadState, exportFormat, Number($('#export-quality').value) / 100);
    const name = ($('#export-filename').value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/\.(png|jpe?g|webp)$/i, '') || 'photoedit-image') + $('#export-extension').textContent;
    if (lastExportUrl) URL.revokeObjectURL(lastExportUrl);
    lastExportUrl = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = lastExportUrl; link.download = name; document.body.append(link); link.click(); link.remove();
    const size = blob.size > 1024 * 1024 ? `${(blob.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(blob.size / 1024)} KB`;
    closeDialog(exportDialog); notify(`ดาวน์โหลด ${name} แล้ว · ${size} · ไม่มีลายน้ำ`);
    setTimeout(() => { if (lastExportUrl) { URL.revokeObjectURL(lastExportUrl); lastExportUrl = null; } }, 60000);
  } catch (error) { $('#export-error').textContent = error.message || 'สร้างไฟล์ไม่สำเร็จ ลองลดขนาดหรือเปลี่ยนชนิดไฟล์'; $('#export-error').hidden = false; }
  finally { button.disabled = false; button.innerHTML = `${icon('download')}<span>ดาวน์โหลดรูป</span>`; }
};

document.addEventListener('keydown', event => {
  const typing = event.target.matches('input,textarea,select,[contenteditable=true]');
  const openDialog = $('dialog[open]');
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') { event.preventDefault(); if (!openDialog) openExport(); return; }
  if (typing || openDialog) return;
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') { event.preventDefault(); travelHistory(event.shiftKey ? 1 : -1); }
  else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') { event.preventDefault(); travelHistory(1); }
  else if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'b') { event.preventDefault(); startCompare(); }
  else if (['Delete', 'Backspace'].includes(event.key) && selectedObject()) { event.preventDefault(); deleteSelected(); }
  else if (event.key === 'Escape') { selectedId = null; scheduleRender(); }
  else if (event.key === '?') openDialog($('#help-dialog'));
});
document.addEventListener('keyup', event => { if (event.key.toLowerCase() === 'b') stopCompare(); });
renderPanel(); updateControls();
const params = new URLSearchParams(location.search);
if (params.get('demo') === '1') loadDemo(params.get('preset'));
