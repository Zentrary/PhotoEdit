import { decodeFile, initialState } from '../../engine/index.js';
import { getPreset } from '../../core/presets.js';
import { $, $$, elements } from './dom.js';
import { hooks, isDirty, notify, setBusy, store } from './store.js';
import { confirmAction } from './dialogs.js';
import { fitCanvas } from './canvas.js';
import { resetPresetFilters } from './panels/presets.js';

export async function loadFile(file, preset = null) {
  if (!file || store.loading) return;
  const version = ++store.loadVersion;
  setBusy(true);
  try {
    const decoded = await decodeFile(file);
    if (version !== store.loadVersion) return;
    store.source = decoded;
    store.sourceName = file.name || 'clipboard-image.png';
    store.state = initialState();
    if (getPreset(preset)) {
      store.state.preset = preset;
      store.state.presetStrength = 85;
    }
    store.baseline = JSON.stringify(store.state);
    store.history = [store.baseline];
    store.historyIndex = 0;
    store.selectedId = null;
    store.zoom = 1;
    $('#empty-state').hidden = true;
    $('#canvas-scroll').hidden = false;
    resetPresetFilters();
    hooks.setTool('presets');
    fitCanvas();
    await document.fonts.ready;
    notify(`เปิด ${store.sourceName} แล้ว · รูปอยู่ในเครื่องคุณเท่านั้น`);
  } catch (error) {
    notify(error.message || 'เปิดรูปไม่สำเร็จ กรุณาลองไฟล์ JPG, PNG หรือ WebP', true);
  } finally {
    if (version === store.loadVersion) setBusy(false);
    elements.fileInput.value = '';
  }
}

export async function loadDemo(preset = null) {
  if (store.loading) return;
  setBusy(true, 'กำลังเตรียมรูปตัวอย่าง…');
  try {
    const response = await fetch('assets/images/cosmic-lake.jpg');
    if (!response.ok) throw new Error('โหลดรูปตัวอย่างไม่สำเร็จ');
    const blob = await response.blob();
    setBusy(false);
    await loadFile(new File([blob], 'my-little-universe.jpg', { type: 'image/jpeg' }), preset);
  } catch (error) {
    setBusy(false);
    notify(error.message, true);
  }
}

async function requestOpen() {
  if (isDirty() && !await confirmAction('เปลี่ยนรูปใหม่ไหม?', 'งานปัจจุบันยังไม่ถูกดาวน์โหลด การเปลี่ยนรูปจะล้างงานนี้จากรอบใช้งาน', 'เปลี่ยนรูป')) return;
  elements.fileInput.click();
}

export function bindUpload() {
  $('#open-button').onclick = requestOpen;
  $('#empty-open').onclick = () => elements.fileInput.click();
  $('#demo-button').onclick = () => loadDemo();
  elements.fileInput.onchange = () => { if (elements.fileInput.files[0]) loadFile(elements.fileInput.files[0]); };
  let dragDepth = 0;
  document.addEventListener('dragenter', event => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    event.preventDefault();
    dragDepth++;
    $('#drop-overlay').hidden = false;
  });
  document.addEventListener('dragover', event => {
    if (event.dataTransfer?.types.includes('Files')) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  });
  document.addEventListener('dragleave', event => {
    if (!event.dataTransfer?.types.includes('Files')) return;
    dragDepth = Math.max(0, dragDepth - 1);
    if (!dragDepth) $('#drop-overlay').hidden = true;
  });
  document.addEventListener('drop', event => {
    event.preventDefault();
    dragDepth = 0;
    $('#drop-overlay').hidden = true;
    const file = event.dataTransfer?.files[0];
    if (file) loadFile(file);
  });
  document.addEventListener('paste', event => {
    if ($$('dialog[open]').length) return;
    const file = [...(event.clipboardData?.items || [])].find(item => item.kind === 'file' && item.type.startsWith('image/'))?.getAsFile();
    if (file) { event.preventDefault(); loadFile(file); }
  });
}
