import { clone, outputSize, validateResize } from '../../../engine/index.js';
import { $, elements, icon } from '../dom.js';
import { hooks, mutate, notify, store } from '../store.js';
import { fitCanvas, setCropRatio, updateCropOverlay } from '../canvas.js';
import { panelControls, rangeHTML } from './controls.js';

export function cropPanel() {
  const state = store.state;
  const ratios = [['free', 'อิสระ', ''], ['original', 'ต้นฉบับ', ''], ['1:1', '1:1', 'square'], ['4:5', '4:5', 'portrait'], ['3:4', '3:4', 'portrait'], ['9:16', '9:16', 'story'], ['16:9', '16:9', 'wide'], ['3:2', '3:2', 'wide']];
  elements.inspector.innerHTML = `<p class="inspector-description">ลากกรอบบนรูปเพื่อเลือกส่วนที่ใช่ สัดส่วนคำนวณตามระนาบหลังหมุนและจัดแนว</p>${panelControls(`${rangeHTML('ปรับมุมเอียง', 'straighten', state.straighten, -45, 45, 'crop', 0.5, '°')}<div class="panel-actions"><button class="button button-outline button-small" id="cancel-crop">ยกเลิกครอป</button><button class="button button-primary button-small" id="apply-crop">${icon('check')} ใช้การครอป</button></div><p class="control-note">จัดแนวจะครอปขอบบางส่วนอัตโนมัติเพื่อไม่ให้มีพื้นที่ว่าง</p>`)}<div class="button-grid">${ratios.map(([id, name, shape]) => `<button class="option-button ${store.cropRatio === id ? 'active' : ''}" data-ratio="${id}" aria-pressed="${store.cropRatio === id}"><span class="ratio-symbol ${shape}"></span>${name}</button>`).join('')}</div><div class="field-row" style="margin-top:13px"><label>สัดส่วนกว้าง<input id="crop-ratio-w" type="number" min="1" max="100" value="4"></label><label>สัดส่วนสูง<input id="crop-ratio-h" type="number" min="1" max="100" value="5"></label></div><button class="button button-outline full-width" id="custom-ratio">ใช้สัดส่วนที่กำหนด</button><div class="panel-section"><div class="panel-title">หมุนและกลับด้าน</div><div class="button-grid"><button class="option-button" id="rotate-left">${icon('undo')} ซ้าย 90°</button><button class="option-button" id="rotate-right">${icon('redo')} ขวา 90°</button><button class="option-button ${state.flipX ? 'active' : ''}" id="flip-x">${icon('flip')} กลับซ้าย–ขวา</button><button class="option-button ${state.flipY ? 'active' : ''}" id="flip-y">${icon('flip')} กลับบน–ล่าง</button></div></div>`;
  elements.inspector.querySelectorAll('[data-ratio]').forEach(button => button.onclick = () => {
    setCropRatio(button.dataset.ratio);
    hooks.renderPanel();
  });
  $('#custom-ratio').onclick = () => {
    const width = Number($('#crop-ratio-w').value), height = Number($('#crop-ratio-h').value);
    if (!(width > 0 && height > 0 && width <= 100 && height <= 100)) return notify('ใส่สัดส่วนตั้งแต่ 1 ถึง 100 ทั้งสองช่อง', true);
    setCropRatio(width / height);
    elements.inspector.querySelectorAll('[data-ratio]').forEach(button => button.classList.remove('active'));
    notify(`ใช้สัดส่วน ${width}:${height} แล้ว`);
  };
  $('#rotate-left').onclick = () => mutate(() => {
    const crop = state.crop;
    store.state.crop = { x: crop.y, y: 1 - crop.x - crop.w, w: crop.h, h: crop.w };
    store.cropDraft = clone(store.state.crop);
    store.state.rotation = (store.state.rotation + 270) % 360;
  }, false);
  $('#rotate-right').onclick = () => mutate(() => {
    const crop = state.crop;
    store.state.crop = { x: 1 - crop.y - crop.h, y: crop.x, w: crop.h, h: crop.w };
    store.cropDraft = clone(store.state.crop);
    store.state.rotation = (store.state.rotation + 90) % 360;
  }, false);
  $('#flip-x').onclick = () => mutate(() => { store.state.flipX = !store.state.flipX; });
  $('#flip-y').onclick = () => mutate(() => { store.state.flipY = !store.state.flipY; });
  $('#cancel-crop').onclick = () => {
    store.cropDraft = clone(store.state.crop);
    store.cropRatio = 'free';
    updateCropOverlay();
    notify('ยกเลิกการครอปที่ยังไม่ได้ใช้แล้ว');
  };
  $('#apply-crop').onclick = () => {
    mutate(() => { store.state.crop = clone(store.cropDraft); }, false);
    fitCanvas();
    notify('ใช้การครอปแล้ว · ย้อนกลับได้เสมอ');
  };
}

export function resizePanel() {
  const state = store.state;
  const natural = outputSize(store.source, { ...state, resize: null });
  const current = state.resize || natural;
  elements.inspector.innerHTML = `<p class="inspector-description">กำหนดขนาดไฟล์ส่งออกโดยอิสระจากการครอป ล็อกสัดส่วนเพื่อไม่ให้ภาพยืดผิดรูป</p><div class="export-size-row"><span>ขนาดปัจจุบันรวมกรอบ</span><span>${natural.width} × ${natural.height} px</span></div><div class="resize-fields"><label>กว้าง (px)<input id="resize-width" type="number" min="1" max="8192" value="${current.width}"></label><button class="icon-button" id="resize-lock" aria-label="ล็อกสัดส่วน" aria-pressed="true">${icon('link')}</button><label>สูง (px)<input id="resize-height" type="number" min="1" max="8192" value="${current.height}"></label></div><label class="checkbox-label" style="margin-top:15px"><input id="resize-percent-mode" type="checkbox"> กำหนดเป็นเปอร์เซ็นต์</label><div class="field-row" id="resize-percent-field" hidden><label>ขนาด (%)<input id="resize-percent" type="number" min="1" max="500" value="100"></label></div><div class="panel-section"><div class="panel-title">ขนาดที่ใช้บ่อย</div><div class="button-grid two">${[25, 50, 100, 200].map(percent => `<button class="option-button" data-percent="${percent}">${percent}%</button>`).join('')}</div></div><button class="button button-primary full-width" id="apply-resize">${icon('check')} ใช้ขนาดนี้</button><button class="button button-outline full-width" id="original-size">คืนขนาดธรรมชาติ</button><p class="field-note">ขยายรูปเพิ่มจำนวนพิกเซล แต่ไม่ได้เพิ่มรายละเอียดต้นฉบับ ส่งออกสูงสุด 24 ล้านพิกเซลและด้านยาว 8,192 px</p>`;
  let locked = true;
  let ratio = current.width / current.height;
  $('#resize-lock').onclick = event => {
    locked = !locked;
    ratio = Number($('#resize-width').value) / Math.max(1, Number($('#resize-height').value));
    const button = event.currentTarget;
    button.setAttribute('aria-pressed', String(locked));
    button.innerHTML = icon(locked ? 'link' : 'unlock');
  };
  for (const dimension of ['width', 'height']) $(`#resize-${dimension}`).addEventListener('input', event => {
    if (!locked) return;
    const value = Number(event.target.value);
    if (value > 0) $(`#resize-${dimension === 'width' ? 'height' : 'width'}`).value = Math.max(1, Math.round(dimension === 'width' ? value / ratio : value * ratio));
  });
  $('#resize-percent-mode').onchange = event => { $('#resize-percent-field').hidden = !event.target.checked; };
  $('#resize-percent').oninput = event => {
    const percent = Number(event.target.value) / 100;
    if (percent > 0) {
      $('#resize-width').value = Math.max(1, Math.round(natural.width * percent));
      $('#resize-height').value = Math.max(1, Math.round(natural.height * percent));
      ratio = natural.width / natural.height;
    }
  };
  elements.inspector.querySelectorAll('[data-percent]').forEach(button => button.onclick = () => {
    $('#resize-percent-mode').checked = true;
    $('#resize-percent-field').hidden = false;
    $('#resize-percent').value = button.dataset.percent;
    $('#resize-percent').dispatchEvent(new Event('input'));
  });
  $('#apply-resize').onclick = () => {
    try {
      const size = validateResize(Number($('#resize-width').value), Number($('#resize-height').value));
      mutate(() => { store.state.resize = size; }, false);
      fitCanvas();
      notify(`ตั้งขนาด ${size.width} × ${size.height} px แล้ว`);
    } catch (error) { notify(error.message, true); }
  };
  $('#original-size').onclick = () => mutate(() => { store.state.resize = null; });
}
