import { LIMITS, clamp, clone, geometrySize, paintPreview } from '../../engine/index.js';
import { $, elements, uid } from './dom.js';
import { commit, hooks, mutate, notify, selectedObject, store, updateControls } from './store.js';

export function scheduleRender() {
  if (store.renderPending || !store.source) return;
  store.renderPending = true;
  requestAnimationFrame(() => {
    store.renderPending = false;
    try { renderPreview(); } catch (error) { notify(error.message || 'แสดงรูปไม่สำเร็จ ลองลดขนาดรูป', true); }
  });
}

export function previewState() {
  const { tool, cropDraft, state } = store;
  if (tool !== 'crop' || !cropDraft) return state;
  return { ...state, crop: { x: 0, y: 0, w: 1, h: 1 }, frame: { ...state.frame, type: 'none' }, resize: null, texts: [], stickers: [], strokes: [] };
}

export function renderPreview() {
  if (!store.source) return;
  const previousWidth = parseFloat(elements.mat.style.width) || 0;
  store.metadata = paintPreview(elements.canvas, store.source, previewState(), {
    maxSide: store.interacting ? 850 : LIMITS.preview,
    selectedId: store.selectedId,
    interactive: !store.comparing && ['text', 'stickers'].includes(store.tool)
  });
  sizeCanvas(!previousWidth);
  updateCropOverlay();
  elements.mat.classList.toggle('drawing', store.tool === 'draw');
  elements.mat.classList.toggle('moving', ['text', 'stickers'].includes(store.tool));
  elements.mat.style.touchAction = ['draw', 'crop', 'text', 'stickers'].includes(store.tool) ? 'none' : 'pan-x pan-y';
  if (store.comparing) paintOriginal();
  updateControls();
}

export function sizeCanvas(resetScroll = false) {
  if (!store.source || !elements.canvas.width) return;
  const mobile = innerWidth <= 700;
  const padding = mobile ? 44 : 76;
  store.fitScale = Math.min((elements.viewport.clientWidth - padding) / elements.canvas.width, (elements.viewport.clientHeight - padding) / elements.canvas.height, 1.5);
  store.fitScale = Math.max(0.02, store.fitScale);
  elements.mat.style.width = `${elements.canvas.width * store.fitScale * store.zoom}px`;
  elements.mat.style.height = `${elements.canvas.height * store.fitScale * store.zoom}px`;
  $('#zoom-fit').textContent = store.zoom === 1 ? 'พอดี' : `${Math.round(store.fitScale * store.zoom * 100)}%`;
  $('#zoom-out').disabled = store.zoom <= 0.25;
  $('#zoom-in').disabled = store.zoom >= 5;
  if (resetScroll) { $('#canvas-scroll').scrollLeft = 0; $('#canvas-scroll').scrollTop = 0; }
}

export function changeZoom(amount) {
  store.zoom = clamp(Math.round((store.zoom + amount) * 100) / 100, 0.25, 5);
  sizeCanvas();
  if (store.tool === 'crop') updateCropOverlay();
}

export function fitCanvas() {
  store.zoom = 1;
  sizeCanvas(true);
}

export function fullGeometrySize() {
  return geometrySize(store.source, { ...store.state, crop: { x: 0, y: 0, w: 1, h: 1 } });
}

export function setCropRatio(ratio) {
  store.cropRatio = ratio;
  const full = fullGeometrySize();
  let numeric = ratio;
  if (ratio === 'free') { updateCropOverlay(); return; }
  if (ratio === 'original') numeric = store.source.width / store.source.height;
  if (typeof ratio === 'string' && ratio.includes(':')) {
    const [width, height] = ratio.split(':').map(Number);
    numeric = width / height;
  }
  const normalized = numeric / (full.width / full.height);
  const center = { x: store.cropDraft.x + store.cropDraft.w / 2, y: store.cropDraft.y + store.cropDraft.h / 2 };
  let width = 1, height = 1;
  if (normalized > 1) height = 1 / normalized; else width = normalized;
  store.cropDraft = {
    x: clamp(center.x - width / 2, 0, 1 - width),
    y: clamp(center.y - height / 2, 0, 1 - height),
    w: width,
    h: height
  };
  updateCropOverlay();
}

export function updateCropOverlay() {
  const overlay = $('#crop-overlay');
  overlay.hidden = store.tool !== 'crop' || !store.source || !store.cropDraft;
  if (overlay.hidden) return;
  overlay.style.left = `${store.cropDraft.x * 100}%`;
  overlay.style.top = `${store.cropDraft.y * 100}%`;
  overlay.style.width = `${store.cropDraft.w * 100}%`;
  overlay.style.height = `${store.cropDraft.h * 100}%`;
  const full = fullGeometrySize();
  $('#crop-size').textContent = `${Math.round(full.width * store.cropDraft.w)} × ${Math.round(full.height * store.cropDraft.h)}`;
}

export function canvasPoint(event) {
  const rect = elements.canvas.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
  const content = store.metadata.content;
  return { x: (x - content.x) / content.w, y: (y - content.y) / content.h };
}

function paintOriginal() {
  const original = $('#original-canvas');
  original.width = elements.canvas.width;
  original.height = elements.canvas.height;
  const context = original.getContext('2d');
  context.fillStyle = '#191320';
  context.fillRect(0, 0, original.width, original.height);
  const scale = Math.min(original.width / store.source.width, original.height / store.source.height);
  context.drawImage(store.source, (original.width - store.source.width * scale) / 2, (original.height - store.source.height * scale) / 2, store.source.width * scale, store.source.height * scale);
}

export function startCompare() {
  if (!store.source || store.loading || store.comparing) return;
  store.comparing = true;
  paintOriginal();
  $('#original-canvas').hidden = false;
  $('#original-label').hidden = false;
  $('#compare-button').classList.add('active');
}

export function stopCompare() {
  store.comparing = false;
  $('#original-canvas').hidden = true;
  $('#original-label').hidden = true;
  $('#compare-button').classList.remove('active');
}

export function deleteSelected() {
  if (!selectedObject()) return;
  const id = store.selectedId;
  mutate(() => {
    store.state.texts = store.state.texts.filter(object => object.id !== id);
    store.state.stickers = store.state.stickers.filter(object => object.id !== id);
    store.selectedId = null;
  });
}

function finishInteraction(event) {
  const interaction = store.interaction;
  if (!interaction || event.pointerId !== interaction.pointerId) return;
  if (interaction.type === 'draw' && event.type === 'pointercancel') store.state.strokes = store.state.strokes.filter(stroke => stroke.id !== interaction.stroke.id);
  store.interaction = null;
  store.interacting = false;
  commit();
  scheduleRender();
  if (store.tool === 'draw') hooks.renderPanel();
}

function bindCropOverlay() {
  const overlay = $('#crop-overlay');
  overlay.addEventListener('pointerdown', event => {
    if (store.tool !== 'crop' || !store.cropDraft) return;
    event.preventDefault();
    event.stopPropagation();
    const rect = elements.canvas.getBoundingClientRect();
    store.cropDrag = { handle: event.target.dataset.handle || 'move', x: event.clientX, y: event.clientY, crop: clone(store.cropDraft), width: rect.width, height: rect.height };
    event.currentTarget.setPointerCapture(event.pointerId);
  });
  overlay.addEventListener('pointermove', event => {
    const drag = store.cropDrag;
    if (!drag) return;
    const dx = (event.clientX - drag.x) / drag.width, dy = (event.clientY - drag.y) / drag.height;
    const initial = drag.crop;
    if (drag.handle === 'move') {
      store.cropDraft = { ...initial, x: clamp(initial.x + dx, 0, 1 - initial.w), y: clamp(initial.y + dy, 0, 1 - initial.h) };
    } else {
      const handle = drag.handle;
      let x = handle.includes('w') ? clamp(initial.x + dx, 0, initial.x + initial.w - 0.04) : initial.x;
      let y = handle.includes('n') ? clamp(initial.y + dy, 0, initial.y + initial.h - 0.04) : initial.y;
      let width = handle.includes('w') ? initial.x + initial.w - x : clamp(initial.w + dx, 0.04, 1 - x);
      let height = handle.includes('n') ? initial.y + initial.h - y : clamp(initial.h + dy, 0.04, 1 - y);
      if (store.cropRatio !== 'free') {
        const full = fullGeometrySize();
        const ratio = store.cropRatio === 'original'
          ? store.source.width / store.source.height
          : typeof store.cropRatio === 'number'
            ? store.cropRatio
            : Number(store.cropRatio.split(':')[0]) / Number(store.cropRatio.split(':')[1]);
        const normalized = ratio / (full.width / full.height);
        height = width / normalized;
        if (height > (handle.includes('n') ? initial.y + initial.h : 1 - y)) {
          height = handle.includes('n') ? initial.y + initial.h : 1 - y;
          width = height * normalized;
        }
        if (handle.includes('w')) x = initial.x + initial.w - width;
        if (handle.includes('n')) y = initial.y + initial.h - height;
      }
      store.cropDraft = { x, y, w: width, h: height };
    }
    updateCropOverlay();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) overlay.addEventListener(type, () => { store.cropDrag = null; });
}

function bindCanvasPointers() {
  elements.mat.addEventListener('pointerdown', event => {
    if (!store.source || store.loading || store.tool === 'crop' || event.target.closest('#crop-overlay') || store.comparing) return;
    const point = canvasPoint(event);
    if (store.tool === 'draw') {
      if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
      event.preventDefault();
      const stroke = { id: uid(), ...clone(store.drawOptions), points: [point] };
      store.state.strokes.push(stroke);
      store.interaction = { type: 'draw', stroke, pointerId: event.pointerId };
      store.interacting = true;
      elements.mat.setPointerCapture(event.pointerId);
      scheduleRender();
    } else if (['text', 'stickers'].includes(store.tool)) {
      const photoX = point.x * elements.canvas.width * store.metadata.content.w;
      const photoY = point.y * elements.canvas.height * store.metadata.content.h;
      const hit = [...store.metadata.bounds].reverse().find(box => photoX >= box.x - 6 && photoX <= box.x + box.w + 6 && photoY >= box.y - 6 && photoY <= box.y + box.h + 6);
      store.selectedId = hit?.id || null;
      if (hit) {
        const object = selectedObject();
        store.interaction = { type: 'object', object, x: point.x, y: point.y, initialX: object.x, initialY: object.y, pointerId: event.pointerId };
        store.interacting = true;
        elements.mat.setPointerCapture(event.pointerId);
        event.preventDefault();
      }
      hooks.renderPanel();
      scheduleRender();
    }
  });
  elements.mat.addEventListener('pointermove', event => {
    const interaction = store.interaction;
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    const point = canvasPoint(event);
    if (interaction.type === 'draw') {
      const last = interaction.stroke.points.at(-1);
      const next = { x: clamp(point.x, 0, 1), y: clamp(point.y, 0, 1) };
      if (Math.hypot(next.x - last.x, next.y - last.y) > 0.002 && interaction.stroke.points.length < 4000) interaction.stroke.points.push(next);
    } else {
      interaction.object.x = clamp(interaction.initialX + point.x - interaction.x, 0, 1);
      interaction.object.y = clamp(interaction.initialY + point.y - interaction.y, 0, 1);
    }
    scheduleRender();
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) elements.mat.addEventListener(type, finishInteraction);
}

function bindCompare() {
  $('#compare-button').addEventListener('pointerdown', event => {
    event.preventDefault();
    startCompare();
    event.currentTarget.setPointerCapture(event.pointerId);
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture', 'blur']) $('#compare-button').addEventListener(type, stopCompare);
  $('#compare-button').addEventListener('keydown', event => {
    if ([' ', 'Enter'].includes(event.key)) { event.preventDefault(); startCompare(); }
  });
  $('#compare-button').addEventListener('keyup', event => {
    if ([' ', 'Enter'].includes(event.key)) stopCompare();
  });
  window.addEventListener('blur', stopCompare);
  document.addEventListener('visibilitychange', () => { if (document.hidden) stopCompare(); });
}

export function bindCanvas() {
  new ResizeObserver(() => {
    sizeCanvas();
    if (store.tool === 'crop') updateCropOverlay();
  }).observe(elements.viewport);
  bindCropOverlay();
  bindCanvasPointers();
  bindCompare();
}
