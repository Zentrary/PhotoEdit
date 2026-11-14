import { frameTypes } from '../../../engine/index.js';
import { $, elements } from '../dom.js';
import { commit, hooks, mutate, store } from '../store.js';
import { panelControls, rangeHTML } from './controls.js';

export function framePanel() {
  const state = store.state;
  elements.inspector.innerHTML = `${panelControls(`<div id="frame-options" ${state.frame.type === 'none' ? 'hidden' : ''}>${rangeHTML('ความหนาของกรอบ', 'width', state.frame.width, 1, 15, 'frame', 0.5, '%')}<label class="color-field">สีกรอบ<input id="frame-color" type="color" value="${state.frame.color}"></label></div><p class="control-note">${state.frame.type === 'none' ? 'เลือกกรอบด้านล่าง แล้วปรับความหนาและสีตรงนี้' : 'ปรับความหนาและสีได้ทันที บางกรอบใช้สีประจำแบบ'}</p>`, 'frame-controls')}<p class="inspector-description">32 กรอบ เลือกขอบที่เข้ากับภาพของคุณ</p><div class="button-grid two frame-grid">${frameTypes.map(frame => `<button class="option-button ${state.frame.type === frame.id ? 'active' : ''}" data-frame="${frame.id}" aria-pressed="${state.frame.type === frame.id}"><span class="frame-preview frame-${frame.id}"><span></span></span><span class="frame-name">${frame.name}</span></button>`).join('')}</div><p class="field-note">กรอบมุมมนคงพื้นหลังโปร่งใส · กรอบลวดลายและสีสำเร็จรูปใช้สีประจำแบบ</p>`;
  elements.inspector.querySelectorAll('[data-frame]').forEach(button => button.onclick = () => mutate(() => { store.state.frame.type = button.dataset.frame; }));
  $('#frame-color').oninput = event => { store.state.frame.color = event.target.value; hooks.scheduleRender(); };
  $('#frame-color').onchange = () => commit();
}
