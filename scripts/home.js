import { presets, getPreset } from './presets.js';
import { presetState, renderImage } from './engine.js';

const icon = name => `<svg class="icon" aria-hidden="true"><use href="assets/icons.svg#${name}"></use></svg>`;
const motionButton = document.querySelector('#motion-toggle');
const mediaMotion = matchMedia('(prefers-reduced-motion: reduce)');
let reduceMotion = mediaMotion.matches;
let observer;
function applyMotion() {
  document.body.classList.toggle('reduce-motion', reduceMotion);
  document.body.classList.toggle('motion-enabled', !reduceMotion);
  motionButton.setAttribute('aria-pressed', String(reduceMotion));
  motionButton.textContent = reduceMotion ? 'เปิดการเคลื่อนไหว' : 'ลดการเคลื่อนไหว';
  observer?.disconnect();
  if (!reduceMotion && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) { entry.target.classList.remove('pending'); observer.unobserve(entry.target); }
    }, { threshold: 0.08 });
    document.querySelectorAll('.reveal').forEach(element => {
      if (element.getBoundingClientRect().top > innerHeight) element.classList.add('pending');
      observer.observe(element);
    });
  } else document.querySelectorAll('.pending').forEach(element => element.classList.remove('pending'));
}
motionButton.addEventListener('click', () => { reduceMotion = !reduceMotion; applyMotion(); });
mediaMotion.addEventListener('change', event => { reduceMotion = event.matches; applyMotion(); });
applyMotion();

const privacyDialog = document.querySelector('#privacy-dialog');
document.querySelectorAll('[data-open-privacy]').forEach(button => button.addEventListener('click', () => privacyDialog.showModal()));
document.querySelectorAll('[data-close-dialog]').forEach(button => button.addEventListener('click', () => button.closest('dialog').close()));
document.querySelectorAll('dialog').forEach(dialog => dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
}));

const comparison = document.querySelector('#hero-comparison');
const compareInput = document.querySelector('#hero-compare');
const afterCanvas = document.querySelector('#hero-after');
const demoOpen = document.querySelector('#demo-open');
const image = new Image();
let activePreset = 'nebula-tint';
let source;
function renderHero() {
  if (!source) return;
  const result = renderImage(source, presetState(activePreset, 80), { maxSide: 900 });
  afterCanvas.width = result.canvas.width;
  afterCanvas.height = result.canvas.height;
  afterCanvas.getContext('2d').drawImage(result.canvas, 0, 0);
  document.querySelector('.after-label').textContent = `หลัง · ${getPreset(activePreset).name}`;
  demoOpen.href = `editor.html?demo=1&preset=${activePreset}`;
}
compareInput.addEventListener('input', () => comparison.style.setProperty('--split', `${compareInput.value}%`));
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
