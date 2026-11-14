import { categories, getPreset, presets } from '../../../core/presets.js';
import { presetState, renderImage } from '../../../engine/index.js';
import { $, elements, escapeHTML, icon, nextFrame } from '../dom.js';
import { hooks, mutate, notify, store, updateControls } from '../store.js';
import { panelControls, rangeHTML } from './controls.js';

let category = 'all';
let search = '';
let thumbnailSource = null;
let thumbnailSourcePromise;
let thumbnailObserver;
let thumbnailQueue = [];
let thumbnailWorking = false;
let thumbnailVersion = 0;
const thumbnailCache = new Map();

export function presetPanel() {
  const state = store.state;
  elements.inspector.innerHTML = `${panelControls(`<div class="control-heading"><span>ความแรงของสไตล์</span><strong id="selected-preset-name">${state.preset ? escapeHTML(getPreset(state.preset)?.name || '') : 'Original'}</strong></div>${rangeHTML('ปรับได้ทันที ไม่ต้องเลื่อนหา', 'presetStrength', state.presetStrength, 0, 100, 'preset', 1, '%')}<p class="control-note" id="preset-description">${state.preset ? escapeHTML(getPreset(state.preset)?.description || '') : 'เลือกสไตล์ด้านล่าง แล้วปรับความแรงตรงนี้ได้เลย'}</p>`, 'preset-controls')}<p class="inspector-description">200 สไตล์ 8 บรรยากาศ ค้นหาโทนสีที่ใช่สำหรับภาพของคุณ</p><div class="search-field"><input id="preset-search" type="search" placeholder="ค้นหากลิ่นอายที่คุณชอบ…" aria-label="ค้นหาสไตล์รูป" value="${escapeHTML(search)}"></div><div class="category-chips" id="category-chips"></div><button class="preset-original ${!state.preset ? 'active' : ''}" id="original-preset">${icon('image')} Original · ไม่ใช้สไตล์</button><div class="preset-result-count" id="preset-result-count" role="status"></div><div class="preset-grid" id="preset-grid"></div>`;
  const chipContainer = $('#category-chips');
  for (const item of [...categories, { id: 'favorites', name: '♥ ที่ชอบ' }]) {
    const button = document.createElement('button');
    button.className = `category-chip ${category === item.id ? 'active' : ''}`;
    button.textContent = item.name;
    button.setAttribute('aria-pressed', String(category === item.id));
    button.onclick = () => { category = item.id; hooks.renderPanel(); };
    chipContainer.append(button);
  }
  $('#preset-search').addEventListener('input', event => { search = event.target.value; renderPresetGrid(); });
  $('#original-preset').onclick = () => mutate(() => { store.state.preset = null; });
  renderPresetGrid();
}

export function renderPresetGrid() {
  const state = store.state;
  const container = $('#preset-grid');
  if (!container) return;
  const version = ++thumbnailVersion;
  container.replaceChildren();
  const filtered = presets.filter(preset => (category === 'all' || category === preset.category || category === 'favorites' && store.favorites.has(preset.id)) && `${preset.name} ${preset.description} ${categories.find(item => item.id === preset.category)?.name}`.toLowerCase().includes(search.toLowerCase().trim()));
  $('#preset-result-count').textContent = `พบ ${filtered.length} สไตล์`;
  thumbnailObserver?.disconnect();
  thumbnailQueue = [];
  if (!filtered.length) { container.innerHTML = '<p class="empty-results">ยังไม่พบสไตล์นี้ ลองคำอื่นหรือกด ♡ ที่สไตล์ที่ชอบ</p>'; return; }
  thumbnailObserver = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      thumbnailObserver.unobserve(entry.target);
      thumbnailQueue.push({ target: entry.target, id: entry.target.dataset.presetThumb, version });
    }
    pumpThumbnails();
  }, { root: elements.inspector, rootMargin: '220px' });
  for (const preset of filtered) {
    const wrapper = document.createElement('div');
    wrapper.className = 'preset-wrapper';
    const button = document.createElement('button');
    button.className = `preset-card ${state.preset === preset.id ? 'active' : ''}`;
    button.setAttribute('aria-pressed', String(state.preset === preset.id));
    button.setAttribute('aria-label', preset.name);
    const thumb = document.createElement('canvas');
    thumb.width = 150;
    thumb.height = 112;
    thumb.setAttribute('aria-hidden', 'true');
    thumb.dataset.presetThumb = preset.id;
    const name = document.createElement('span');
    name.className = 'preset-card-name';
    name.textContent = preset.name;
    button.append(thumb, name);
    button.onclick = () => {
      mutate(() => { store.state.preset = preset.id; }, false);
      elements.inspector.querySelectorAll('.preset-card').forEach(card => {
        card.classList.toggle('active', card === button);
        card.setAttribute('aria-pressed', String(card === button));
      });
      $('#original-preset').classList.remove('active');
      $('#preset-description').textContent = preset.description;
      $('#selected-preset-name').textContent = preset.name;
    };
    const favorite = document.createElement('button');
    favorite.className = `favorite-toggle ${store.favorites.has(preset.id) ? 'active' : ''}`;
    favorite.innerHTML = icon('heart');
    favorite.setAttribute('aria-label', `ชื่นชอบ ${preset.name}`);
    favorite.setAttribute('aria-pressed', String(store.favorites.has(preset.id)));
    favorite.onclick = () => {
      if (store.favorites.has(preset.id)) store.favorites.delete(preset.id); else store.favorites.add(preset.id);
      if (category === 'favorites') renderPresetGrid();
      else {
        favorite.classList.toggle('active', store.favorites.has(preset.id));
        favorite.setAttribute('aria-pressed', String(store.favorites.has(preset.id)));
      }
    };
    wrapper.append(button, favorite);
    container.append(wrapper);
    const cached = thumbnailCache.get(preset.id);
    if (cached) thumb.getContext('2d').drawImage(cached, 0, 0);
    else thumbnailObserver.observe(thumb);
  }
  updateControls();
}

async function prepareThumbnailSource() {
  if (thumbnailSource) return thumbnailSource;
  if (!thumbnailSourcePromise) thumbnailSourcePromise = (async () => {
    const image = new Image();
    image.src = 'assets/images/cosmic-lake.jpg';
    await image.decode();
    const canvas = document.createElement('canvas');
    canvas.width = 180;
    canvas.height = 120;
    const context = canvas.getContext('2d');
    const scale = Math.max(180 / image.width, 120 / image.height);
    context.drawImage(image, (180 - image.width * scale) / 2, (120 - image.height * scale) / 2, image.width * scale, image.height * scale);
    thumbnailSource = canvas;
    return canvas;
  })().catch(error => { thumbnailSourcePromise = null; throw error; });
  return thumbnailSourcePromise;
}

async function pumpThumbnails() {
  if (thumbnailWorking) return;
  thumbnailWorking = true;
  try {
    const source = await prepareThumbnailSource();
    while (thumbnailQueue.length) {
      const job = thumbnailQueue.shift();
      if (job.version !== thumbnailVersion || !job.target.isConnected) continue;
      await nextFrame();
      if (job.version !== thumbnailVersion || !job.target.isConnected) continue;
      let cached = thumbnailCache.get(job.id);
      if (!cached) {
        const result = renderImage(source, presetState(job.id, 95), { maxSide: 150 });
        cached = document.createElement('canvas');
        cached.width = 150;
        cached.height = 112;
        const context = cached.getContext('2d');
        const scale = Math.max(150 / result.canvas.width, 112 / result.canvas.height);
        context.drawImage(result.canvas, (150 - result.canvas.width * scale) / 2, (112 - result.canvas.height * scale) / 2, result.canvas.width * scale, result.canvas.height * scale);
        thumbnailCache.set(job.id, cached);
      }
      job.target.getContext('2d').drawImage(cached, 0, 0);
    }
  } catch { notify('โหลดภาพตัวอย่างสไตล์ไม่สำเร็จ ลองเปิดเครื่องมือสไตล์อีกครั้ง', true); }
  finally { thumbnailWorking = false; }
}

export function resetPresetThumbnails() {
  thumbnailObserver?.disconnect();
  thumbnailVersion++;
}

export function resetPresetFilters() {
  category = 'all';
  search = '';
}
