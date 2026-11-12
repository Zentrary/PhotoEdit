const reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
let motionOverride = null;
let uiScale = 100;
let initialized = false;
const closing = new WeakSet();

export function prefersReducedMotion() {
  return motionOverride ?? reducedMotionQuery.matches;
}
export function refreshMotion() {
  const reduced = prefersReducedMotion();
  document.body.classList.toggle('reduce-motion', reduced);
  document.body.classList.toggle('motion-enabled', !reduced);
  document.documentElement.style.scrollBehavior = reduced ? 'auto' : '';
  document.dispatchEvent(new CustomEvent('photoedit:motion', { detail: { reduced } }));
  document.querySelectorAll('#reduce-motion, #accessibility-motion').forEach(input => { input.checked = reduced; });
  const toggle = document.querySelector('#motion-toggle');
  if (toggle) {
    toggle.setAttribute('aria-pressed', String(reduced));
    toggle.textContent = reduced ? 'เปิดการเคลื่อนไหว' : 'ลดการเคลื่อนไหว';
  }
}
export function setMotionOverride(value) {
  motionOverride = value;
  refreshMotion();
}
export function getUiScale() { return uiScale; }
function updateScaleClasses() {
  const effectiveWidth = innerWidth / (uiScale / 100);
  document.body.classList.toggle('ui-compact', effectiveWidth <= 900);
  document.body.classList.toggle('ui-narrow', effectiveWidth <= 700);
  document.body.classList.toggle('ui-tiny', effectiveWidth <= 420);
}
export function setUiScale(value) {
  uiScale = Math.max(100, Math.min(160, Math.round(Number(value) / 5) * 5));
  document.documentElement.style.setProperty('--ui-scale', uiScale / 100);
  document.documentElement.style.setProperty('--ui-percent', `${uiScale}%`);
  document.body.classList.toggle('large-ui', uiScale > 115);
  updateScaleClasses();
  document.querySelectorAll('[data-ui-scale-value]').forEach(output => { output.textContent = `${uiScale}%`; });
  const input = document.querySelector('#ui-scale');
  if (input && Number(input.value) !== uiScale) input.value = uiScale;
  document.querySelectorAll('[data-ui-scale]').forEach(button => {
    button.setAttribute('aria-pressed', String(Number(button.dataset.uiScale) === uiScale));
  });
  document.dispatchEvent(new CustomEvent('photoedit:scale', { detail: { scale: uiScale } }));
}
export function openDialog(dialog) {
  if (!dialog || dialog.open) return;
  closing.delete(dialog);
  dialog.classList.remove('closing');
  dialog.showModal();
}
export function closeDialog(dialog) {
  if (!dialog?.open || closing.has(dialog)) return;
  if (prefersReducedMotion()) { dialog.close(); return; }
  closing.add(dialog);
  dialog.classList.add('closing');
  setTimeout(() => {
    if (dialog.open) dialog.close();
    dialog.classList.remove('closing');
    closing.delete(dialog);
  }, 160);
}
function scrollBehavior() { return prefersReducedMotion() ? 'auto' : 'smooth'; }
function navigateToSection(link) {
  const hash = link.getAttribute('href');
  if (!hash?.startsWith('#')) return false;
  const target = document.getElementById(hash.slice(1));
  if (!target) return false;
  target.scrollIntoView({ behavior: scrollBehavior(), block: 'start' });
  history.replaceState(null, '', hash);
  target.setAttribute('tabindex', '-1');
  target.focus({ preventScroll: true });
  return true;
}
function initDialogs() {
  document.querySelectorAll('dialog').forEach(dialog => {
    dialog.addEventListener('cancel', event => { event.preventDefault(); closeDialog(dialog); });
    dialog.addEventListener('click', event => {
      if (event.target !== dialog) return;
      const rect = dialog.getBoundingClientRect();
      if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
    });
  });
  document.querySelectorAll('[data-close-dialog]').forEach(button => {
    button.addEventListener('click', () => closeDialog(button.closest('dialog')));
  });
}
function initAccessibilityDialog() {
  const dialog = document.querySelector('#accessibility-dialog');
  if (!dialog) return;
  document.querySelectorAll('[data-open-accessibility]').forEach(button => button.addEventListener('click', () => openDialog(dialog)));
  const input = dialog.querySelector('#ui-scale');
  input?.addEventListener('input', event => setUiScale(event.target.value));
  dialog.querySelectorAll('[data-ui-scale]').forEach(button => button.addEventListener('click', () => setUiScale(button.dataset.uiScale)));
  dialog.querySelector('#accessibility-motion')?.addEventListener('change', event => setMotionOverride(event.target.checked));
  dialog.querySelector('#accessibility-reset')?.addEventListener('click', () => { setUiScale(100); setMotionOverride(null); });
}
function initSmoothLinks() {
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      if (navigateToSection(link)) event.preventDefault();
    });
  });
  if (location.hash) requestAnimationFrame(() => document.getElementById(location.hash.slice(1))?.scrollIntoView({ behavior: 'auto', block: 'start' }));
}
function initFaq() {
  document.querySelectorAll('.faq-list details').forEach(details => {
    const summary = details.querySelector('summary');
    if (!summary) return;
    summary.addEventListener('click', event => {
      if (prefersReducedMotion()) return;
      event.preventDefault();
      if (details.dataset.animating) return;
      details.dataset.animating = 'true';
      const wasOpen = details.open;
      const startHeight = details.getBoundingClientRect().height;
      if (!wasOpen) details.open = true;
      const endHeight = wasOpen ? summary.getBoundingClientRect().height : details.scrollHeight;
      details.style.overflow = 'hidden';
      const animation = details.animate({ height: [`${startHeight}px`, `${endHeight}px`] }, { duration: 220, easing: 'cubic-bezier(.2,.7,.2,1)' });
      animation.onfinish = () => {
        if (wasOpen) details.open = false;
        details.style.height = '';
        details.style.overflow = '';
        delete details.dataset.animating;
      };
    });
  });
}
function initPageTransitions() {
  document.body.classList.add('page-ready');
  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest('a[href]');
    if (!link || link.target || link.hasAttribute('download') || link.hasAttribute('data-no-transition')) return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin) return;
    if (url.pathname === location.pathname && url.hash) return;
    if (!/\.html$/.test(url.pathname) && url.pathname !== '/') return;
    if (prefersReducedMotion()) return;
    event.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { location.href = url.href; }, 140);
  });
  window.addEventListener('pageshow', () => document.body.classList.remove('page-leaving'));
}
export function initAccessibility() {
  if (initialized) return;
  initialized = true;
  refreshMotion();
  setUiScale(100);
  initDialogs();
  initAccessibilityDialog();
  initSmoothLinks();
  initFaq();
  initPageTransitions();
  reducedMotionQuery.addEventListener('change', () => { if (motionOverride === null) refreshMotion(); });
  window.addEventListener('resize', updateScaleClasses);
}
