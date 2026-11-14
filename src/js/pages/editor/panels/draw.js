import { $, elements, icon } from '../dom.js';
import { hooks, mutate, store } from '../store.js';
import { bindSwatches, panelControls, rangeHTML, swatchHTML } from './controls.js';
import { confirmAction } from '../dialogs.js';

export function drawPanel() {
  const state = store.state;
  const options = store.drawOptions;
  elements.inspector.innerHTML = `<p class="inspector-description">วาดเส้นของคุณลงบนภาพ ยางลบจะลบเฉพาะเส้นที่วาด ไม่ลบเนื้อภาพ</p><div class="button-grid">${[['pen', 'ปากกา', 'pen'], ['highlighter', 'ไฮไลต์', 'highlighter'], ['eraser', 'ยางลบ', 'eraser']].map(([id, name, symbol]) => `<button class="option-button ${options.tool === id ? 'active' : ''}" data-draw-tool="${id}" aria-pressed="${options.tool === id}">${icon(symbol)}${name}</button>`).join('')}</div>${panelControls(`<label class="color-field">สีปากกา<input id="draw-color" type="color" value="${options.color}"></label>${swatchHTML('draw')}${rangeHTML('ความหนาเส้น', 'size', options.size, 0.2, 8, 'draw', 0.1, '%')}`)}<div class="panel-section button-stack"><button class="button button-outline full-width" id="undo-stroke" ${state.strokes.length ? '' : 'disabled'}>${icon('undo')} ลบเส้นล่าสุด</button><button class="button button-outline danger-button full-width" id="clear-strokes" ${state.strokes.length ? '' : 'disabled'}>${icon('trash')} ล้างเส้นวาดทั้งหมด</button></div><p class="field-note">ทุกเส้นย้อนกลับได้ จำนวนเส้นปัจจุบัน: ${state.strokes.length}</p>`;
  elements.inspector.querySelectorAll('[data-draw-tool]').forEach(button => button.onclick = () => {
    store.drawOptions.tool = button.dataset.drawTool;
    hooks.renderPanel();
  });
  $('#draw-color').onchange = event => { store.drawOptions.color = event.target.value; };
  $('#undo-stroke').onclick = () => mutate(() => { store.state.strokes.pop(); });
  $('#clear-strokes').onclick = () => confirmAction('ล้างเส้นวาดทั้งหมด?', 'ลบเฉพาะเส้นที่วาด สี สไตล์ และข้อความอื่นยังอยู่ และย้อนกลับได้', 'ล้างเส้นวาด')
    .then(ok => { if (ok) mutate(() => { store.state.strokes = []; }); });
  bindSwatches();
}
