import { clone } from '../../../engine/index.js';
import { $, elements, icon } from '../dom.js';
import { colors } from '../labels.js';
import { commit, hooks, mutate, selectedObject, store } from '../store.js';

export function panelControls(content, className = '') {
  return `<section class="panel-controls ${className}">${content}</section>`;
}

export function rangeHTML(label, key, value, min, max, group = '', step = 1, unit = '') {
  const progress = (value - min) / (max - min) * 100;
  return `<div class="range-group"><div class="range-label"><label for="range-${group}-${key}">${label}</label><output for="range-${group}-${key}" data-output="${group}-${key}">${value}${unit}</output></div><input id="range-${group}-${key}" type="range" min="${min}" max="${max}" step="${step}" value="${value}" data-key="${key}" data-group="${group}" data-unit="${unit}" style="--range-progress:${progress}%"></div>`;
}

export function bindRanges() {
  elements.inspector.querySelectorAll('input[type=range]').forEach(input => {
    input.addEventListener('input', () => {
      const value = Number(input.value), key = input.dataset.key, group = input.dataset.group;
      if (group === 'object') { const object = selectedObject(); if (!object) return; object[key] = value; }
      else if (group === 'frame') store.state.frame[key] = value;
      else if (group === 'crop') { store.state[key] = value; store.cropDraft = clone(store.state.crop); }
      else if (group === 'draw') store.drawOptions[key] = value;
      else if (group === 'preset') store.state.presetStrength = value;
      else store.state[group][key] = value;
      input.style.setProperty('--range-progress', `${(value - Number(input.min)) / (Number(input.max) - Number(input.min)) * 100}%`);
      const output = elements.inspector.querySelector(`[data-output="${group}-${key}"]`);
      if (output) output.textContent = `${value}${input.dataset.unit}`;
      if (group !== 'draw') { hooks.stopCompare(); hooks.scheduleRender(); }
    });
    input.addEventListener('change', () => { if (input.dataset.group !== 'draw') commit(); });
  });
}

export function emptyInspector() {
  elements.inspector.innerHTML = `<div class="inspector-empty">${icon('image')}<h3>เริ่มจากภาพของคุณ</h3><p>เลือกรูปก่อน แล้วเครื่องมือทั้งหมด<br>จะพร้อมให้ปล่อยไอเดียเต็มที่</p><button class="button button-outline" id="panel-open">${icon('upload')} เลือกรูปจากเครื่อง</button><button class="text-button" id="panel-demo">ลองรูปตัวอย่าง ${icon('arrow')}</button></div>`;
  $('#panel-open').onclick = () => elements.fileInput.click();
  $('#panel-demo').onclick = () => hooks.loadDemo();
}

export function swatchHTML(target) {
  return `<div class="swatches">${colors.map(color => `<button class="swatch" style="background:${color}" data-color="${color}" data-target="${target}" aria-label="เลือกสี ${color}"></button>`).join('')}</div>`;
}

export function bindSwatches() {
  elements.inspector.querySelectorAll('[data-color]').forEach(button => button.onclick = () => mutate(() => {
    const target = button.dataset.target;
    if (target === 'draw') store.drawOptions.color = button.dataset.color;
    else if (target === 'object') {
      const object = selectedObject();
      if (object) object.color = button.dataset.color;
    }
  }));
}
