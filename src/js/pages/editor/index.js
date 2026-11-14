import { initAccessibility } from '../../core/ui.js';
import { hooks, updateControls } from './store.js';
import { bindCanvas, scheduleRender, stopCompare } from './canvas.js';
import { renderPanel, setTool } from './panels/index.js';
import { bindUpload, loadDemo } from './upload.js';
import { bindExport, openExport } from './export.js';
import { bindDialogs } from './dialogs.js';
import { bindActions } from './actions.js';
import { bindShortcuts } from './shortcuts.js';

hooks.renderPanel = renderPanel;
hooks.scheduleRender = scheduleRender;
hooks.stopCompare = stopCompare;
hooks.loadDemo = loadDemo;
hooks.setTool = setTool;
hooks.openExport = openExport;

bindCanvas();
bindDialogs();
bindUpload();
bindExport();
bindActions();
bindShortcuts();
initAccessibility();
renderPanel();
updateControls();

const params = new URLSearchParams(location.search);
if (params.get('demo') === '1') loadDemo(params.get('preset'));
