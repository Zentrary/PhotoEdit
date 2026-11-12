import { getPreset } from './presets.js';
import { presetState, renderImage } from './engine.js';
import { initAccessibility, openDialog, closeDialog, prefersReducedMotion, setMotionOverride } from './ui.js';

const icon = name => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${name}"></use></svg>`;
initAccessibility();
const motionButton = document.querySelector('#motion-toggle');
let observer;
function applyReveals() {
  observer?.disconnect();
  if (!prefersReducedMotion() && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > innerHeight) element.classList.add('pending');
      observer.observe(element);
    });
  } else document.querySelectorAll('.pending').forEach(element => element.classList.remove('pending'));
}
motionButton.addEventListener('click', () => setMotionOverride(!prefersReducedMotion()));
document.addEventListener('photoedit:motion', applyReveals);
applyReveals();

const privacyDialog = document.querySelector('#privacy-dialog');
document.querySelectorAll('[data-open-privacy]').forEach(button => button.addEventListener('click', () => openDialog(privacyDialog)));

const comparison = document.querySelector('#hero-comparison');
const compareInput = document.querySelector('#hero-compare');
const afterCanvas = document.querySelector('#hero-after');
const demoOpen = document.querySelector('#demo-open');
const image = new Image();
let activePreset = 'nebula-tint';
let source;
let compareDrag = null;
function setSplit(value) {
  const split = Math.max(0, Math.min(100, Math.round(value)));
  compareInput.value = split;
  compareInput.setAttribute('aria-valuetext', `ก่อน ${split}% หลัง ${100 - split}%`);
  comparison.style.setProperty('--split', `${split}%`);
}
function splitFromPointer(event) {
  const rect = comparison.getBoundingClientRect();
  return (event.clientX - rect.left) / rect.width * 100;
}
compareInput.addEventListener('input', () => setSplit(Number(compareInput.value)));
setSplit(Number(compareInput.value));
comparison.addEventListener('pointerdown', event => {
  if (event.button !== 0 && event.pointerType === 'mouse') return;
  event.preventDefault();
  compareDrag = event.pointerId;
  comparison.setPointerCapture(event.pointerId);
  comparison.classList.add('dragging');
  setSplit(splitFromPointer(event));
  compareInput.focus({ preventScroll: true });
});
comparison.addEventListener('pointermove', event => {
  if (compareDrag !== event.pointerId) return;
  setSplit(splitFromPointer(event));
});
for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) comparison.addEventListener(type, event => {
  if (compareDrag !== event.pointerId) return;
  compareDrag = null;
  comparison.classList.remove('dragging');
});
function renderHero() {
  if (!source) return;
  const result = renderImage(source, presetState(activePreset, 80), { maxSide: 900 });
  afterCanvas.width = result.canvas.width;
  afterCanvas.height = result.canvas.height;
  afterCanvas.getContext('2d').drawImage(result.canvas, 0, 0);
  document.querySelector('.after-label').textContent = `หลัง · ${getPreset(activePreset).name}`;
  demoOpen.href = `editor.html?demo=1&preset=${activePreset}`;
}
document.querySelectorAll('.demo-preset').forEach(button => button.addEventListener('click', () => {
  activePreset = button.dataset.preset;
  document.querySelectorAll('.demo-preset').forEach(item => { item.classList.toggle('active', item === button); item.setAttribute('aria-pressed', String(item === button)); });
  renderHero();
}));
image.onload = async () => {
  source = document.createElement('canvas');
  source.width = image.naturalWidth; source.height = image.naturalHeight;
  source.getContext('2d').drawImage(image, 0, 0);
  renderHero();
  const selected = ['warm-disposable', 'chrome-flash', 'teal-orange', 'soft-glow', 'nebula-tint'];
  const showcase = document.querySelector('#style-showcase');
  for (const id of selected) {
    const preset = getPreset(id);
    const link = document.createElement('a');
    link.className = 'style-card';
    link.href = `editor.html?demo=1&preset=${id}`;
    link.setAttribute('aria-label', `ลองสไตล์ ${preset.name} กับรูปตัวอย่าง`);
    const canvas = document.createElement('canvas');
    const result = renderImage(source, presetState(id, 100), { maxSide: 300 });
    canvas.width = result.canvas.width; canvas.height = result.canvas.height;
    canvas.getContext('2d').drawImage(result.canvas, 0, 0);
    canvas.setAttribute('aria-hidden', 'true');
    const info = document.createElement('div'); info.className = 'style-card-info';
    const text = document.createElement('div');
    const name = document.createElement('strong'); name.textContent = preset.name;
    const category = document.createElement('small'); category.textContent = { film: 'ความทรงจำสีอุ่น', y2k: 'ย้อนยุคไปยุค 2000', cinematic: 'เล่าเรื่องเหมือนภาพยนตร์', dreamy: 'ละมุนเหมือนความฝัน', cosmic: 'หลุดไปในอวกาศ' }[preset.category];
    text.append(name, category); info.append(text); info.insertAdjacentHTML('beforeend', icon('arrow')); link.append(canvas, info); showcase.append(link);
    await new Promise(resolve => setTimeout(resolve, 0));
  }
};
image.src = 'assets/images/cosmic-lake.jpg';
