import { drawSticker, stickerTypes } from '../../../engine/index.js';
import { $, elements, escapeHTML, uid } from '../dom.js';
import { stickerLabels } from '../labels.js';
import { hooks, mutate, notify, store } from '../store.js';
import { bindObjectControls, bindObjectList, objectControls, objectList } from './objects.js';
import { panelControls } from './controls.js';

let emojiData = null;
let emojiDataPromise = null;
let emojiSearch = '';
let emojiGroup = 'all';
let emojiTone = 'all';
let emojiFiltered = [];
let emojiRendered = 0;
let emojiObserver = null;
let emojiVersion = 0;
let stickerTab = 'drawn';
const emojiPageSize = 120;

const thaiEmojiKeywords = {
  'ยิ้ม': 'smile happy grin laugh', 'หัวเราะ': 'laugh laugh joy', 'ร้องไห้': 'cry tear sad', 'เศร้า': 'sad cry',
  'รัก': 'love heart kiss', 'หัวใจ': 'heart love', 'มือ': 'hand', 'คน': 'person people man woman',
  'ผู้หญิง': 'woman girl', 'ผู้ชาย': 'man boy', 'เด็ก': 'child baby', 'ครอบครัว': 'family', 'แมว': 'cat',
  'หมา': 'dog dog', 'สัตว์': 'animal', 'ดอกไม้': 'flower blossom', 'ธรรมชาติ': 'nature plant tree',
  'อาหาร': 'food', 'ผลไม้': 'fruit', 'กาแฟ': 'coffee', 'เค้ก': 'cake birthday', 'ท่องเที่ยว': 'travel place',
  'รถ': 'car vehicle', 'กีฬา': 'sport ball', 'ดนตรี': 'music note', 'ดาว': 'star', 'ดวงจันทร์': 'moon',
  'โลก': 'earth globe world', 'ไฟ': 'fire', 'น้ำ': 'water drop', 'ของขวัญ': 'gift present',
  'เงิน': 'money coin dollar', 'โทรศัพท์': 'phone telephone', 'คอมพิวเตอร์': 'computer laptop', 'ธง': 'flag',
  'ไทย': 'thailand thai', 'ญี่ปุ่น': 'japan japanese', 'เกาหลี': 'korea korean', 'อเมริกา': 'america usa'
};

export function stickerPanel() {
  const state = store.state;
  const object = state.stickers.find(item => item.id === store.selectedId);
  const drawn = stickerTypes.map(type => `<button class="sticker-option" data-sticker="${type}" aria-label="เพิ่ม${stickerLabels[type]}" title="${stickerLabels[type]}"><canvas width="84" height="84" data-sticker-preview="${type}" aria-hidden="true"></canvas></button>`).join('');
  const tabs = `<div class="segmented-control" role="tablist" aria-label="ชนิดสติ๊กเกอร์"><button role="tab" id="sticker-tab-drawn" data-sticker-tab="drawn" aria-selected="${stickerTab === 'drawn'}" aria-controls="sticker-library">สติ๊กเกอร์วาด</button><button role="tab" id="sticker-tab-emoji" data-sticker-tab="emoji" aria-selected="${stickerTab === 'emoji'}" aria-controls="sticker-library">อีโมจิ</button></div>`;
  let library;
  if (stickerTab === 'drawn') library = `<p class="library-count">${stickerTypes.length} แบบ · เปลี่ยนสีได้</p><div class="sticker-grid" id="sticker-library" role="tabpanel" aria-labelledby="sticker-tab-drawn">${drawn}</div>`;
  else if (!emojiData) library = '<div class="library-loading" id="emoji-loading"><span class="spinner"></span> กำลังเปิดคลังอีโมจิในเครื่อง…</div>';
  else library = `${panelControls(`<div class="search-field"><input id="emoji-search" type="search" placeholder="ค้นหา เช่น ยิ้ม, หัวใจ, cat…" aria-label="ค้นหาอีโมจิ" value="${escapeHTML(emojiSearch)}"></div><div class="category-chips emoji-groups" id="emoji-groups">${emojiData.emojiGroups.map(group => `<button class="category-chip ${emojiGroup === group.id ? 'active' : ''}" data-emoji-group="${group.id}" aria-pressed="${emojiGroup === group.id}" title="${group.name}"><span aria-hidden="true">${group.symbol}</span> ${group.name}</button>`).join('')}</div><label class="tone-field">สีผิว<select id="emoji-tone">${emojiData.emojiTones.map(tone => `<option value="${tone.id}" ${emojiTone === tone.id ? 'selected' : ''}>${tone.name}</option>`).join('')}</select></label><p class="library-count" id="emoji-result-count" role="status"></p>`, 'emoji-controls')}<div class="sticker-grid emoji-grid" id="sticker-library" role="tabpanel" aria-labelledby="sticker-tab-emoji"></div><button class="button button-outline full-width" id="emoji-more">แสดงอีโมจิเพิ่ม</button><p class="field-note">คลังข้อมูล Unicode พร้อมรุ่นสีผิว · ใช้ฟอนต์อีโมจิที่โหลดจากเว็บนี้โดยตรง ไม่พึ่งรูปจากเว็บภายนอก</p>`;
  elements.inspector.innerHTML = `<p class="inspector-description">เลือกแล้วปรับขนาดและมุมได้ทันทีด้านบน คลังอีโมจิอยู่ในเครื่อง ไม่เรียกเว็บภายนอก</p>${object ? objectControls(object, false) : '<div class="object-empty">เลือกสติ๊กเกอร์หรืออีโมจิเพื่อเพิ่มลงบนภาพ</div>'}${tabs}${library}${objectList(state.stickers, 'sticker')}<p class="field-note">วางสติ๊กเกอร์และอีโมจิรวมกันได้สูงสุด 60 ชิ้นต่อภาพ</p>`;
  elements.inspector.querySelectorAll('[data-sticker-tab]').forEach(button => button.onclick = () => {
    stickerTab = button.dataset.stickerTab;
    hooks.renderPanel({ resetScroll: true });
  });
  elements.inspector.querySelectorAll('[data-sticker-preview]').forEach(target => {
    const context = target.getContext('2d');
    context.translate(42, 42);
    drawSticker(context, target.dataset.stickerPreview, 62, '#c4a0f5');
  });
  bindStickerButtons();
  if (stickerTab === 'emoji') {
    if (!emojiData) {
      ensureEmojiData()
        .then(() => { if (store.tool === 'stickers' && stickerTab === 'emoji') hooks.renderPanel({ resetScroll: true }); })
        .catch(() => { const loading = $('#emoji-loading'); if (loading) loading.textContent = 'เปิดคลังอีโมจิไม่สำเร็จ ลองกดแท็บอีโมจิอีกครั้ง'; });
    } else {
      $('#emoji-search').addEventListener('input', event => { emojiSearch = event.target.value; renderEmojiGrid(); });
      $('#emoji-tone').onchange = event => { emojiTone = event.target.value; renderEmojiGrid(); };
      elements.inspector.querySelectorAll('[data-emoji-group]').forEach(button => button.onclick = () => {
        emojiGroup = button.dataset.emojiGroup;
        elements.inspector.querySelectorAll('[data-emoji-group]').forEach(chip => {
          const active = chip === button;
          chip.classList.toggle('active', active);
          chip.setAttribute('aria-pressed', String(active));
        });
        renderEmojiGrid();
      });
      $('#emoji-more').onclick = () => appendEmojiChunk();
      renderEmojiGrid();
    }
  }
  bindObjectList();
  bindObjectControls(false);
}

function bindStickerButtons() {
  elements.inspector.querySelectorAll('[data-sticker]').forEach(button => button.onclick = () => {
    if (store.state.stickers.length >= 60) return notify('ใส่สติ๊กเกอร์และอีโมจิได้สูงสุด 60 รายการต่อภาพ', true);
    mutate(() => {
      const object = { id: uid(), type: button.dataset.sticker, x: 0.5, y: 0.5, size: 16, color: '#c4a0f5', rotation: 0 };
      store.state.stickers.push(object);
      store.selectedId = object.id;
    }, false);
    hooks.renderPanel({ resetScroll: true });
    if (button.dataset.sticker.startsWith('emoji:')) document.fonts.load('16px "Noto Color Emoji"', button.dataset.sticker.slice(6)).then(() => hooks.scheduleRender()).catch(() => {});
  });
}

function ensureEmojiData() {
  if (!emojiDataPromise) {
    emojiDataPromise = import('../../../core/data/emoji.js')
      .then(module => { emojiData = module; return module; })
      .catch(error => { emojiDataPromise = null; throw error; });
  }
  return emojiDataPromise;
}

function emojiToneLabel(mask) {
  return emojiData.emojiTones.filter(tone => tone.bit && mask & tone.bit).map(tone => tone.name).join(' + ');
}

function renderEmojiGrid() {
  const container = $('#sticker-library');
  if (!container || !emojiData) return;
  emojiObserver?.disconnect();
  emojiVersion++;
  const terms = emojiSearch.toLowerCase().trim().split(/\s+/).filter(Boolean).flatMap(term => (thaiEmojiKeywords[term] || term).split(' '));
  const tone = emojiData.emojiTones.find(item => item.id === emojiTone);
  emojiFiltered = emojiData.emojiEntries.filter(entry => (emojiGroup === 'all' || entry.group === emojiGroup) && (!tone.bit || entry.toneMask & tone.bit) && terms.every(term => `${entry.value} ${entry.name} ${entry.keywords} ${emojiToneLabel(entry.toneMask)}`.toLowerCase().includes(term)));
  $('#emoji-result-count').textContent = `พบ ${emojiFiltered.length.toLocaleString()} จาก ${emojiData.emojiEntries.length.toLocaleString()} แบบ`;
  container.replaceChildren();
  emojiRendered = 0;
  if (!emojiFiltered.length) container.innerHTML = '<p class="empty-results">ไม่พบอีโมจิ ลองคำอื่น เปลี่ยนหมวด หรือเลือกทุกสีผิว</p>';
  appendEmojiChunk();
}

function appendEmojiChunk() {
  const container = $('#sticker-library');
  if (!container || !emojiData) return;
  const fragment = document.createDocumentFragment();
  const end = Math.min(emojiFiltered.length, emojiRendered + emojiPageSize);
  for (let index = emojiRendered; index < end; index++) {
    const entry = emojiFiltered[index];
    const button = document.createElement('button');
    button.className = 'sticker-option emoji-option';
    button.dataset.sticker = `emoji:${entry.value}`;
    const tone = entry.toneMask === 1 ? '' : ` · ${emojiToneLabel(entry.toneMask)}`;
    button.setAttribute('aria-label', `เพิ่มอีโมจิ ${entry.value} · ${entry.name}${tone}`);
    button.title = `${entry.name}${tone}`;
    const span = document.createElement('span');
    span.setAttribute('aria-hidden', 'true');
    span.textContent = entry.value;
    button.append(span);
    fragment.append(button);
  }
  container.append(fragment);
  emojiRendered = end;
  bindStickerButtons();
  const more = $('#emoji-more');
  more.hidden = emojiRendered >= emojiFiltered.length;
  more.textContent = `แสดงเพิ่ม · เหลือ ${(emojiFiltered.length - emojiRendered).toLocaleString()} แบบ`;
  if (!more.hidden) {
    emojiObserver?.disconnect();
    emojiObserver = new IntersectionObserver(entries => { if (entries.some(entry => entry.isIntersecting)) appendEmojiChunk(); }, { root: elements.inspector, rootMargin: '180px' });
    emojiObserver.observe(more);
  }
}

export function resetEmojiGrid() {
  emojiObserver?.disconnect();
  emojiVersion++;
}
