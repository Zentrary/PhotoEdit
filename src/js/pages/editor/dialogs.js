import { closeDialog, openDialog } from '../../core/ui.js';
import { $, $$ } from './dom.js';
import { store } from './store.js';

export function confirmAction(title, description, action = 'ยืนยัน') {
  $('#confirm-title').textContent = title;
  $('#confirm-description').textContent = description;
  $('#confirm-action').textContent = action;
  openDialog($('#confirm-dialog'));
  return new Promise(resolve => { store.confirmResolver = resolve; });
}

export function bindDialogs() {
  $('#confirm-action').onclick = () => {
    const resolve = store.confirmResolver;
    store.confirmResolver = null;
    closeDialog($('#confirm-dialog'));
    resolve?.(true);
  };
  $('#confirm-dialog').addEventListener('close', () => {
    if (store.confirmResolver) {
      store.confirmResolver(false);
      store.confirmResolver = null;
    }
  });
  $$('[data-close-dialog]').forEach(button => button.onclick = () => closeDialog(button.closest('dialog')));
  $$('dialog').forEach(dialog => dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeDialog(dialog);
  }));
}
