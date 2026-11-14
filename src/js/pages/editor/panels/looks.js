import { clone } from '../../../engine/index.js';
import { $, elements, icon, uid } from '../dom.js';
import { hooks, mutate, notify, store } from '../store.js';

export function looksPanel() {
  const state = store.state;
  elements.inspector.innerHTML = `<p class="inspector-description">เก็บสี เอฟเฟกต์ และกรอบที่ปรับไว้ ใช้กับรูปอื่นในรอบนี้ได้ ไม่บันทึกลงเครื่องหรือเซิร์ฟเวอร์</p><label class="field-label" for="look-name">ตั้งชื่อสไตล์ของคุณ</label><input id="look-name" type="text" maxlength="36" placeholder="เช่น My Sunday Film"><button class="button button-primary full-width" id="save-look">${icon('save')} บันทึกรอบใช้งานนี้</button><div class="panel-section"><div class="panel-title">สไตล์ที่บันทึกไว้ <span>${store.savedLooks.length}/12</span></div><div id="look-list"></div>${store.savedLooks.length ? '' : '<div class="object-empty">ยังไม่มีสไตล์ที่บันทึก ลองปรับสีแล้วตั้งชื่อเลย</div>'}</div><p class="field-note">เมื่อปิดหรือรีเฟรชหน้า สไตล์เหล่านี้จะหายไปตามนโยบายไม่เก็บข้อมูล</p>`;
  $('#save-look').onclick = () => {
    const name = $('#look-name').value.trim();
    if (!name) { $('#look-name').focus(); return notify('ตั้งชื่อสไตล์ก่อนบันทึกนะ', true); }
    if (store.savedLooks.length >= 12) return notify('บันทึกได้สูงสุด 12 สไตล์ ลบอันเก่าก่อนเพิ่มใหม่', true);
    store.savedLooks.push({ id: uid(), name, settings: clone({ preset: state.preset, presetStrength: state.presetStrength, adjustments: state.adjustments, effects: state.effects, frame: state.frame }) });
    hooks.renderPanel();
    notify(`บันทึก “${name}” ในรอบใช้งานแล้ว`);
  };
  const list = $('#look-list');
  for (const look of store.savedLooks) {
    const row = document.createElement('div');
    row.className = 'look-card';
    const apply = document.createElement('button');
    apply.textContent = look.name;
    apply.onclick = () => mutate(() => { Object.assign(store.state, clone(look.settings)); store.selectedId = null; });
    const remove = document.createElement('button');
    remove.className = 'icon-button';
    remove.innerHTML = icon('trash');
    remove.setAttribute('aria-label', `ลบสไตล์ ${look.name}`);
    remove.onclick = () => {
      store.savedLooks = store.savedLooks.filter(item => item.id !== look.id);
      hooks.renderPanel();
    };
    row.append(apply, remove);
    list.append(row);
  }
}
