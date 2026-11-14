import { clone, initialState, outputSize } from '../../engine/index.js';
import { $ } from './dom.js';

export const store = {
  source: null,
  state: initialState(),
  sourceName: '',
  history: [],
  historyIndex: -1,
  tool: 'presets',
  selectedId: null,
  favorites: new Set(),
  savedLooks: [],
  cropDraft: null,
  cropRatio: 'free',
  cropDrag: null,
  drawOptions: { tool: 'pen', color: '#c4a0f5', size: 0.8 },
  zoom: 1,
  fitScale: 1,
  metadata: { bounds: [], content: { x: 0, y: 0, w: 1, h: 1 } },
  renderPending: false,
  interacting: false,
  loading: false,
  comparing: false,
  toastTimer: null,
  confirmResolver: null,
  baseline: JSON.stringify(initialState()),
  loadVersion: 0
};

export const hooks = {
  renderPanel() {},
  scheduleRender() {},
  stopCompare() {},
  loadDemo() {},
  setTool() {},
  openExport() {}
};

export const selectedObject = () => [...store.state.texts, ...store.state.stickers].find(object => object.id === store.selectedId);

export function isDirty() {
  return !!store.source && JSON.stringify(store.state) !== store.baseline;
}

export function notify(message, error = false) {
  const toast = $('#toast');
  toast.querySelector('span').textContent = message;
  toast.classList.toggle('error', error);
  toast.hidden = false;
  clearTimeout(store.toastTimer);
  store.toastTimer = setTimeout(() => { toast.hidden = true; }, error ? 6500 : 3500);
}

export function setBusy(value, text = 'กำลังเตรียมรูปของคุณ…') {
  store.loading = value;
  $('#loading-text').textContent = text;
  $('#loading-overlay').hidden = !value;
  updateControls();
}

export function updateControls() {
  const ready = !!store.source && !store.loading;
  for (const selector of ['#export-button', '#reset-button', '#compare-button', '#zoom-out', '#zoom-in', '#zoom-fit', '#fit-button']) $(selector).disabled = !ready;
  $('#undo-button').disabled = !ready || store.historyIndex <= 0;
  $('#redo-button').disabled = !ready || store.historyIndex >= store.history.length - 1;
  $('#reset-tool').disabled = !ready;
  $('#canvas-dimensions').textContent = store.source ? `${outputSize(store.source, store.state).width.toLocaleString()} × ${outputSize(store.source, store.state).height.toLocaleString()} px` : 'ยังไม่มีรูปในพื้นที่ทำงาน';
  $('#file-name').textContent = store.sourceName || 'ยังไม่ได้เลือกรูป';
  $('#file-meta').textContent = store.source ? `${store.source.width.toLocaleString()} × ${store.source.height.toLocaleString()} px · ต้นฉบับ` : 'พื้นที่สร้างสรรค์ของคุณ';
}

export function commit() {
  const snapshot = JSON.stringify(store.state);
  if (store.history[store.historyIndex] === snapshot) { updateControls(); return; }
  store.history = store.history.slice(0, store.historyIndex + 1);
  store.history.push(snapshot);
  if (store.history.length > 50) store.history.shift();
  store.historyIndex = store.history.length - 1;
  updateControls();
}

export function mutate(action, refresh = true) {
  if (!store.source || store.loading) return;
  action();
  commit();
  if (refresh) hooks.renderPanel();
  hooks.scheduleRender();
}

export function travelHistory(direction) {
  if (!store.source || store.loading) return;
  const next = store.historyIndex + direction;
  if (next < 0 || next >= store.history.length) return;
  store.historyIndex = next;
  store.state = JSON.parse(store.history[store.historyIndex]);
  store.selectedId = null;
  store.cropDraft = store.tool === 'crop' ? clone(store.state.crop) : null;
  hooks.stopCompare();
  hooks.renderPanel();
  hooks.scheduleRender();
  updateControls();
}
