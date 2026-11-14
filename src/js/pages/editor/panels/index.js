import { clone } from '../../../engine/index.js';
import { $, $$, elements } from '../dom.js';
import { toolHints, toolInfo } from '../labels.js';
import { store, updateControls } from '../store.js';
import { scheduleRender, stopCompare } from '../canvas.js';
import { bindRanges, emptyInspector } from './controls.js';
import { adjustPanel, effectsPanel } from './color.js';
import { cropPanel, resizePanel } from './geometry.js';
import { framePanel } from './frame.js';
import { presetPanel, resetPresetThumbnails } from './presets.js';
import { stickerPanel, resetEmojiGrid } from './stickers.js';
import { drawPanel } from './draw.js';
import { looksPanel } from './looks.js';
import { textPanel } from './text.js';

const builders = {
  presets: presetPanel,
  adjust: adjustPanel,
  crop: cropPanel,
  resize: resizePanel,
  effects: effectsPanel,
  frame: framePanel,
  text: textPanel,
  stickers: stickerPanel,
  draw: drawPanel,
  looks: looksPanel
};

let panelTool = null;

export function renderPanel({ resetScroll = false } = {}) {
  const inspector = elements.inspector;
  const active = document.activeElement;
  const focusId = inspector.contains(active) && active.id ? active.id : null;
  const selection = focusId && typeof active.selectionStart === 'number' ? [active.selectionStart, active.selectionEnd] : null;
  const openGroups = [...inspector.querySelectorAll('.effect-group[open]')].map(element => element.dataset.group);
  const scrollTop = resetScroll || panelTool !== store.tool ? 0 : inspector.scrollTop;
  panelTool = store.tool;
  resetEmojiGrid();
  resetPresetThumbnails();
  $('#inspector-kicker').textContent = toolInfo[store.tool][0];
  $('#inspector-title').textContent = toolInfo[store.tool][1];
  if (!store.source) { emptyInspector(); updateControls(); return; }
  builders[store.tool]();
  bindRanges();
  if (store.tool === 'effects' && openGroups.length) {
    inspector.querySelectorAll('.effect-group').forEach(element => { element.open = openGroups.includes(element.dataset.group); });
  }
  inspector.scrollTop = scrollTop;
  if (focusId && !resetScroll) {
    const next = document.getElementById(focusId);
    if (next && inspector.contains(next)) {
      next.focus({ preventScroll: true });
      if (selection && next.setSelectionRange) next.setSelectionRange(...selection);
    }
  }
  inspector.classList.remove('panel-enter');
  void inspector.offsetWidth;
  inspector.classList.add('panel-enter');
  updateControls();
}

export function setTool(next) {
  if (!toolInfo[next]) return;
  stopCompare();
  store.selectedId = null;
  store.tool = next;
  store.cropDraft = next === 'crop' && store.source ? clone(store.state.crop) : null;
  $$('.tool-button').forEach(button => {
    const active = button.dataset.tool === next;
    button.classList.toggle('active', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#workspace-hint').textContent = toolHints[next];
  renderPanel({ resetScroll: true });
  scheduleRender();
  if (innerWidth <= 700) $(`.tool-button[data-tool="${next}"]`).scrollIntoView({ behavior: document.body.classList.contains('reduce-motion') ? 'auto' : 'smooth', block: 'nearest', inline: 'center' });
}
