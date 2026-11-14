import { openDialog } from '../../core/ui.js';
import { $ } from './dom.js';
import { hooks, selectedObject, store, travelHistory } from './store.js';
import { deleteSelected, scheduleRender, startCompare, stopCompare } from './canvas.js';

export function bindShortcuts() {
  document.addEventListener('keydown', event => {
    const typing = event.target.matches('input,textarea,select,[contenteditable=true]');
    const dialogOpen = $('dialog[open]');
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
      event.preventDefault();
      if (!dialogOpen) hooks.openExport();
      return;
    }
    if (typing || dialogOpen) return;
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
      event.preventDefault();
      travelHistory(event.shiftKey ? 1 : -1);
    } else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'y') {
      event.preventDefault();
      travelHistory(1);
    } else if (!event.ctrlKey && !event.metaKey && event.key.toLowerCase() === 'b') {
      event.preventDefault();
      startCompare();
    } else if (['Delete', 'Backspace'].includes(event.key) && selectedObject()) {
      event.preventDefault();
      deleteSelected();
    } else if (event.key === 'Escape') {
      store.selectedId = null;
      scheduleRender();
    } else if (event.key === '?') openDialog($('#help-dialog'));
  });
  document.addEventListener('keyup', event => {
    if (event.key.toLowerCase() === 'b') stopCompare();
  });
}
