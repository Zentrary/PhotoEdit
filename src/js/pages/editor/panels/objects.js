import { clamp, clone } from '../../../engine/index.js';
import { fontFamilies, loadFont } from '../../../core/fonts.js';
import { $, elements, escapeHTML, icon, uid } from '../dom.js';
import { stickerLabel } from '../labels.js';
import { commit, hooks, mutate, notify, selectedObject, store } from '../store.js';
import { bindSwatches, panelControls, rangeHTML, swatchHTML } from './controls.js';
import { deleteSelected } from '../canvas.js';

let fontSearch = '';

export function objectList(objects, kind) {
  return objects.length
    ? `<div class="object-list">${objects.map((object, index) => `<button data-object="${object.id}" class="${store.selectedId === object.id ? 'active' : ''}">${icon(kind === 'text' ? 'type' : 'sticker')}<span>${escapeHTML(kind === 'text' ? object.text.slice(0, 28) || 'ข้อความว่าง' : stickerLabel(object.type))} ${index + 1}</span></button>`).join('')}</div>`
    : '';
}

export function bindObjectList() {
  elements.inspector.querySelectorAll('[data-object]').forEach(button => button.onclick = () => {
    store.selectedId = button.dataset.object;
    hooks.renderPanel({ resetScroll: true });
    hooks.scheduleRender();
  });
}

export function objectControls(object, isText) {
  const isEmoji = !isText && object.type.startsWith('emoji:');
  const font = fontFamilies.find(item => item.family === object.font);
  return panelControls(`<div class="control-heading"><span>${isText ? 'ข้อความที่เลือก' : 'สติ๊กเกอร์ที่เลือก'}</span><strong>${escapeHTML(isText ? object.text.slice(0, 18) || 'ข้อความว่าง' : stickerLabel(object.type))}</strong></div>${isText ? `<label class="sr-only" for="object-text">ข้อความ</label><textarea id="object-text" maxlength="160" rows="2">${escapeHTML(object.text)}</textarea><details class="font-picker"><summary>ฟอนต์ · ${escapeHTML(font?.label || object.font)} · ${fontFamilies.length} แบบ</summary><div class="search-field"><input id="font-search" type="search" placeholder="ค้นหาฟอนต์…" value="${escapeHTML(fontSearch)}" aria-label="ค้นหาฟอนต์"></div><div class="font-grid" id="font-grid" role="listbox" aria-label="เลือกฟอนต์"></div></details><label class="checkbox-label"><input id="object-shadow" type="checkbox" ${object.shadow ? 'checked' : ''}> เงาให้อ่านง่าย</label>` : ''}${isEmoji ? '<p class="control-note">อีโมจิสีคมชัดจากฟอนต์ในเครื่อง ย่อ ขยาย และหมุนได้</p>' : `<label class="color-field">สี<input id="object-color" type="color" value="${object.color}"></label>${swatchHTML('object')}`}<div class="compact-ranges">${rangeHTML('ขนาด', 'size', object.size, isText ? 2 : 3, isText ? 25 : 45, 'object', 0.5, '%')}${rangeHTML('หมุน', 'rotation', object.rotation, -180, 180, 'object', 1, '°')}</div><div class="panel-actions"><button class="button button-outline button-small" id="duplicate-object">ทำสำเนา</button><button class="button button-outline button-small danger-button" id="delete-object">${icon('trash')} ลบ</button></div><details class="nudge-picker"><summary>เลื่อนทีละนิด</summary><div class="button-grid nudge-grid"><button class="option-button" data-nudge="left" aria-label="เลื่อนซ้าย">←</button><button class="option-button" data-nudge="up" aria-label="เลื่อนขึ้น">↑</button><button class="option-button" data-nudge="down" aria-label="เลื่อนลง">↓</button><button class="option-button" data-nudge="right" aria-label="เลื่อนขวา">→</button></div></details><p class="control-note">หรือลากบนรูปเพื่อจัดตำแหน่งได้เลย</p>`, 'object-controls');
}

export function bindObjectControls(isText) {
  const object = selectedObject();
  if (!object) return;
  if (isText) {
    $('#object-text').oninput = event => { object.text = event.target.value; hooks.scheduleRender(); };
    $('#object-text').onchange = () => commit();
    $('#object-shadow').onchange = event => mutate(() => { object.shadow = event.target.checked; }, false);
    $('#font-search').oninput = event => { fontSearch = event.target.value; renderFontGrid(object); };
    renderFontGrid(object);
  }
  if ($('#object-color')) {
    $('#object-color').oninput = event => { object.color = event.target.value; hooks.scheduleRender(); };
    $('#object-color').onchange = () => commit();
  }
  $('#delete-object').onclick = () => deleteSelected();
  $('#duplicate-object').onclick = () => {
    mutate(() => {
      const copy = { ...clone(object), id: uid(), x: clamp(object.x + 0.04, 0, 1), y: clamp(object.y + 0.04, 0, 1) };
      (isText ? store.state.texts : store.state.stickers).push(copy);
      store.selectedId = copy.id;
    }, false);
    hooks.renderPanel({ resetScroll: true });
  };
  elements.inspector.querySelectorAll('[data-nudge]').forEach(button => button.onclick = () => mutate(() => {
    const direction = button.dataset.nudge;
    if (direction === 'left') object.x = clamp(object.x - 0.01, 0, 1);
    if (direction === 'right') object.x = clamp(object.x + 0.01, 0, 1);
    if (direction === 'up') object.y = clamp(object.y - 0.01, 0, 1);
    if (direction === 'down') object.y = clamp(object.y + 0.01, 0, 1);
  }, false));
  bindSwatches();
}

export function renderFontGrid(object) {
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
    const sample = document.createElement('span');
    sample.className = 'font-sample';
    sample.style.fontFamily = `"${font.family}", "Noto Sans Thai", sans-serif`;
    sample.textContent = font.group === 'display' ? 'Aa 123' : 'กข Aa';
    const name = document.createElement('small');
    name.textContent = font.label;
    button.append(sample, name);
    button.onclick = async () => {
      button.disabled = true;
      try { await loadFont(font.family); }
      catch { notify('โหลดฟอนต์ไม่สำเร็จ ใช้ฟอนต์สำรองแทน', true); }
      mutate(() => { object.font = font.family; }, false);
      const summary = elements.inspector.querySelector('.font-picker summary');
      if (summary) summary.textContent = `ฟอนต์ · ${font.label} · ${fontFamilies.length} แบบ`;
      renderFontGrid(object);
    };
    container.append(button);
    loadFont(font.family).catch(() => {});
  }
}
