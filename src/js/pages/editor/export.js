import { LIMITS, clone, exportBlob, outputSize, paintPreview, validateResize } from '../../engine/index.js';
import { loadFont } from '../../core/fonts.js';
import { closeDialog, openDialog } from '../../core/ui.js';
import { $, $$, elements, icon, nextFrame } from './dom.js';
import { notify, store } from './store.js';
import { scheduleRender, stopCompare } from './canvas.js';

let exportFormat = 'image/png';
let exportLocked = true;
let exportNatural = { width: 1, height: 1 };
let lastExportUrl = null;

function setExportFormat(format) {
  exportFormat = format;
  $$('[data-format]').forEach(button => {
    const active = button.dataset.format === format;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-pressed', String(active));
  });
  $('#export-extension').textContent = { 'image/png': '.png', 'image/jpeg': '.jpg', 'image/webp': '.webp' }[format];
  $('#quality-control').hidden = format === 'image/png';
  $('#format-note').textContent = format === 'image/png'
    ? 'PNG เก็บพื้นหลังโปร่งใสและรายละเอียดครบ ไฟล์อาจมีขนาดใหญ่'
    : format === 'image/jpeg'
      ? 'JPG ไม่รองรับพื้นใส พื้นที่โปร่งใสจะถูกเติมด้วยสีขาว'
      : 'WebP รองรับพื้นใสและไฟล์ขนาดเล็กกว่า PNG ในภาพส่วนใหญ่';
}

export function openExport() {
  if (!store.source || store.loading) return;
  stopCompare();
  const oldSelected = store.selectedId;
  store.selectedId = null;
  const result = paintPreview(elements.canvas, store.source, store.state, { maxSide: LIMITS.preview });
  store.metadata = result;
  store.selectedId = oldSelected;
  $('#export-preview').src = elements.canvas.toDataURL('image/png');
  exportNatural = outputSize(store.source, { ...store.state, resize: null });
  const size = store.state.resize || exportNatural;
  $('#export-name').textContent = store.sourceName;
  $('#export-dimensions').textContent = `${size.width.toLocaleString()} × ${size.height.toLocaleString()} px`;
  $('#export-filename').value = store.sourceName.replace(/\.[^.]+$/, '').slice(0, 90) + '-photoedit';
  $('#natural-size').textContent = `${exportNatural.width} × ${exportNatural.height}`;
  $('#export-width').value = size.width;
  $('#export-height').value = size.height;
  $('#export-resize-toggle').checked = !!store.state.resize;
  $('#export-resize-fields').hidden = !store.state.resize;
  $('#export-error').hidden = true;
  setExportFormat(exportFormat);
  openDialog(elements.exportDialog);
  scheduleRender();
}

function exportState() {
  const next = clone(store.state);
  next.resize = $('#export-resize-toggle').checked ? validateResize(Number($('#export-width').value), Number($('#export-height').value)) : null;
  return next;
}

function updateExportDimensions() {
  try {
    const size = outputSize(store.source, exportState());
    $('#export-dimensions').textContent = `${size.width.toLocaleString()} × ${size.height.toLocaleString()} px`;
    $('#export-error').hidden = true;
  } catch (error) {
    $('#export-error').textContent = error.message;
    $('#export-error').hidden = false;
  }
}

async function download() {
  if (!store.source || store.loading) return;
  const button = $('#download-button');
  let downloadState;
  try {
    downloadState = exportState();
    validateResize(outputSize(store.source, downloadState).width, outputSize(store.source, downloadState).height);
  } catch (error) {
    $('#export-error').textContent = error.message;
    $('#export-error').hidden = false;
    return;
  }
  button.disabled = true;
  button.innerHTML = '<span class="spinner"></span><span>กำลังสร้างไฟล์ในเครื่อง…</span>';
  $('#export-error').hidden = true;
  await nextFrame();
  try {
    await Promise.all([
      ...downloadState.texts.map(object => loadFont(object.font)),
      ...downloadState.stickers.filter(object => object.type.startsWith('emoji:')).map(object => document.fonts.load('16px "Noto Color Emoji"', object.type.slice(6)))
    ]);
    const blob = await exportBlob(store.source, downloadState, exportFormat, Number($('#export-quality').value) / 100);
    const name = ($('#export-filename').value.trim().replace(/[\\/:*?"<>|\u0000-\u001f]/g, '-').replace(/\.(png|jpe?g|webp)$/i, '') || 'photoedit-image') + $('#export-extension').textContent;
    if (lastExportUrl) URL.revokeObjectURL(lastExportUrl);
    lastExportUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = lastExportUrl;
    link.download = name;
    document.body.append(link);
    link.click();
    link.remove();
    const size = blob.size > 1024 * 1024 ? `${(blob.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(blob.size / 1024)} KB`;
    closeDialog(elements.exportDialog);
    notify(`ดาวน์โหลด ${name} แล้ว · ${size} · ไม่มีลายน้ำ`);
    setTimeout(() => {
      if (lastExportUrl) { URL.revokeObjectURL(lastExportUrl); lastExportUrl = null; }
    }, 60000);
  } catch (error) {
    $('#export-error').textContent = error.message || 'สร้างไฟล์ไม่สำเร็จ ลองลดขนาดหรือเปลี่ยนชนิดไฟล์';
    $('#export-error').hidden = false;
  } finally {
    button.disabled = false;
    button.innerHTML = `${icon('download')}<span>ดาวน์โหลดรูป</span>`;
  }
}

export function bindExport() {
  $('#export-button').onclick = openExport;
  $$('[data-format]').forEach(button => button.onclick = () => setExportFormat(button.dataset.format));
  $('#export-quality').oninput = event => {
    $('#quality-value').textContent = `${event.target.value}%`;
    event.target.style.setProperty('--range-progress', `${(Number(event.target.value) - 10) / 90 * 100}%`);
  };
  $('#export-resize-toggle').onchange = event => {
    $('#export-resize-fields').hidden = !event.target.checked;
    updateExportDimensions();
  };
  $('#export-lock').onclick = event => {
    exportLocked = !exportLocked;
    event.currentTarget.setAttribute('aria-pressed', String(exportLocked));
    event.currentTarget.innerHTML = icon(exportLocked ? 'link' : 'unlock');
  };
  for (const dimension of ['width', 'height']) $(`#export-${dimension}`).addEventListener('input', event => {
    if (exportLocked && Number(event.target.value) > 0) {
      const ratio = exportNatural.width / exportNatural.height;
      const other = dimension === 'width' ? 'height' : 'width';
      $(`#export-${other}`).value = Math.max(1, Math.round(dimension === 'width' ? Number(event.target.value) / ratio : Number(event.target.value) * ratio));
    }
    updateExportDimensions();
  });
  $('#download-button').onclick = download;
}
