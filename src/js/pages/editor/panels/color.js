import { adjustmentKeys, effectKeys } from '../../../core/presets.js';
import { elements } from '../dom.js';
import { adjustmentLabels, effectGroups, effectLabels } from '../labels.js';
import { store } from '../store.js';
import { rangeHTML } from './controls.js';

export function adjustPanel() {
  const state = store.state;
  const groups = [
    ['แสงและเงา', ['brightness', 'exposure', 'contrast', 'highlights', 'shadows', 'whites', 'blacks', 'clarity']],
    ['สีและโทน', ['saturation', 'vibrance', 'warmth', 'tint', 'hue', 'sepia', 'grayscale', 'fade']],
    ['รายละเอียด', ['sharpness', 'blur']]
  ];
  elements.inspector.innerHTML = `<p class="inspector-description">${adjustmentKeys.length} ตัวปรับแสงและสี ทำงานร่วมกับสไตล์ที่เลือกได้</p>${groups.map(([title, keys], index) => `<details class="effect-group" data-group="adjust-${index}" ${index === 0 ? 'open' : ''}><summary>${title}<span>${keys.length}</span></summary><div class="effect-group-body">${keys.map(key => {
    const base = ['brightness', 'contrast', 'saturation'].includes(key);
    const positive = ['sepia', 'grayscale', 'fade', 'sharpness', 'blur'].includes(key);
    return rangeHTML(adjustmentLabels[key], key, state.adjustments[key], base ? 0 : positive ? 0 : key === 'hue' ? -180 : -100, base ? 200 : key === 'hue' ? 180 : key === 'blur' ? 20 : 100, 'adjustments', key === 'blur' ? 0.1 : 1);
  }).join('')}</div></details>`).join('')}<p class="field-note">ค่าปรับสีเป็นค่าเพิ่มเติมจากพรีเซ็ต กดรีเซ็ตด้านบนเพื่อคืนค่าเฉพาะเครื่องมือนี้</p>`;
}

export function effectsPanel() {
  const state = store.state;
  elements.inspector.innerHTML = `<p class="inspector-description">${effectKeys.length} เอฟเฟกต์ ปรับผสมได้อิสระจากพรีเซ็ต ค่า 0 คือปิดเอฟเฟกต์นั้น</p>${effectGroups.map(([title, keys], index) => `<details class="effect-group" data-group="${index}" ${index === 0 ? 'open' : ''}><summary>${title}<span>${keys.length}</span></summary><div class="effect-group-body">${keys.map(key => rangeHTML(effectLabels[key], key, state.effects[key], 0, 100, 'effects')).join('')}</div></details>`).join('')}<p class="field-note">เอฟเฟกต์หนักหลายตัวพร้อมกันอาจทำให้เครื่องช้าลงเล็กน้อยขณะส่งออกความละเอียดสูง</p>`;
}
