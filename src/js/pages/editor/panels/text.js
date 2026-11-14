import { $, elements, icon, uid } from '../dom.js';
import { hooks, mutate, notify, store } from '../store.js';
import { bindObjectControls, bindObjectList, objectControls, objectList } from './objects.js';

export function textPanel() {
  const object = store.state.texts.find(item => item.id === store.selectedId);
  elements.inspector.innerHTML = `<p class="inspector-description">ใส่คำที่เป็นคุณ ลากวาง หมุน และเลือกสีได้อย่างอิสระ</p><button class="button button-primary full-width" id="add-text">${icon('plus')} เพิ่มข้อความ</button>${object ? objectControls(object, true) : '<div class="object-empty">เพิ่มข้อความใหม่ หรือเลือกข้อความบนรูปเพื่อแก้ไข</div>'}${objectList(store.state.texts, 'text')}`;
  $('#add-text').onclick = () => {
    if (store.state.texts.length >= 30) return notify('ใส่ข้อความได้สูงสุด 30 รายการต่อภาพ', true);
    mutate(() => {
      const next = { id: uid(), text: 'ความเป็นคุณ', x: 0.5, y: 0.5, size: 8, color: '#ffffff', font: 'Noto Sans Thai', weight: 600, rotation: 0, shadow: true };
      store.state.texts.push(next);
      store.selectedId = next.id;
    }, false);
    hooks.renderPanel({ resetScroll: true });
  };
  bindObjectList();
  bindObjectControls(true);
}
