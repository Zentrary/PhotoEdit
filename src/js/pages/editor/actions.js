import { clone, initialState } from '../../engine/index.js';
import { openDialog, setMotionOverride } from '../../core/ui.js';
import { $, $$, elements } from './dom.js';
import { isDirty, mutate, notify, store, travelHistory } from './store.js';
import { changeZoom, fitCanvas } from './canvas.js';
import { setTool } from './panels/index.js';
import { confirmAction } from './dialogs.js';

function resetAll() {
  confirmAction('เริ่มแต่งรูปนี้ใหม่?', 'คืนค่าทุกเครื่องมือเป็นต้นฉบับ ทั้งสี ครอป ขนาด กรอบ ข้อความ และเส้นวาด การรีเซ็ตย้อนกลับได้', 'รีเซ็ตทั้งหมด')
    .then(ok => {
      if (!ok) return;
      mutate(() => {
        store.state = initialState();
        store.selectedId = null;
      });
      fitCanvas();
      notify('คืนค่ารูปต้นฉบับแล้ว');
    });
}

function resetTool() {
  const defaults = initialState();
  mutate(() => {
    const state = store.state;
    const tool = store.tool;
    if (tool === 'presets') { state.preset = null; state.presetStrength = 80; }
    if (tool === 'adjust') state.adjustments = defaults.adjustments;
    if (tool === 'effects') state.effects = defaults.effects;
    if (tool === 'crop') {
      Object.assign(state, { crop: defaults.crop, rotation: 0, straighten: 0, flipX: false, flipY: false });
      store.cropDraft = clone(state.crop);
      store.cropRatio = 'free';
    }
    if (tool === 'resize') state.resize = null;
    if (tool === 'frame') state.frame = defaults.frame;
    if (tool === 'text') { state.texts = []; store.selectedId = null; }
    if (tool === 'stickers') { state.stickers = []; store.selectedId = null; }
    if (tool === 'draw') state.strokes = [];
    if (tool === 'looks') Object.assign(state, clone({ preset: defaults.preset, presetStrength: defaults.presetStrength, adjustments: defaults.adjustments, effects: defaults.effects, frame: defaults.frame }));
  });
  notify('รีเซ็ตเฉพาะเครื่องมือนี้แล้ว');
}

export function bindActions() {
  $('#reset-button').onclick = resetAll;
  $('#reset-tool').onclick = resetTool;
  $('#home-link').onclick = async event => {
    if (!isDirty()) return;
    event.preventDefault();
    if (await confirmAction('กลับหน้าแรกไหม?', 'งานที่ยังไม่ได้ดาวน์โหลดจะหายจากระบบ ดาวน์โหลดก่อนถ้าอยากเก็บภาพไว้', 'กลับหน้าแรก')) {
      store.baseline = JSON.stringify(store.state);
      location.href = 'index.html';
    }
  };
  window.addEventListener('beforeunload', event => {
    if (isDirty()) {
      event.preventDefault();
      event.returnValue = '';
    }
  });
  $$('.tool-button').forEach(button => button.onclick = () => setTool(button.dataset.tool));
  $('#undo-button').onclick = () => travelHistory(-1);
  $('#redo-button').onclick = () => travelHistory(1);
  $('#zoom-in').onclick = () => changeZoom(0.25);
  $('#zoom-out').onclick = () => changeZoom(-0.25);
  $('#zoom-fit').onclick = fitCanvas;
  $('#fit-button').onclick = fitCanvas;
  elements.viewport.addEventListener('wheel', event => {
    if (store.source && (event.ctrlKey || event.metaKey)) {
      event.preventDefault();
      changeZoom(event.deltaY < 0 ? 0.1 : -0.1);
    }
  }, { passive: false });
  $('#help-button').onclick = () => openDialog($('#help-dialog'));
  $('#reduce-motion').checked = document.body.classList.contains('reduce-motion');
  $('#reduce-motion').onchange = event => setMotionOverride(event.target.checked);
}
