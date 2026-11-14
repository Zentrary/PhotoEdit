import { resolveValues } from '../core/presets.js';
import { LIMITS } from './constants.js';
import { makeCanvas, radians } from './utils.js';
import { applyEffects, colorPass, sharpenPass } from './effects.js';
import { addFrame } from './frames.js';
import { drawSticker, drawStrokes } from './stickers.js';
import { drawGeometry, geometrySize, outputSize } from './geometry.js';

function drawObjects(canvas, state, selectedId, interactive) {
  const context = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  const bounds = [];
  drawStrokes(context, state.strokes, width, height);
  for (const object of [...state.stickers, ...state.texts]) {
    const isText = Object.hasOwn(object, 'text');
    const size = object.size / 100 * width;
    const x = object.x * width, y = object.y * height;
    context.save(); context.translate(x, y); context.rotate(radians(object.rotation));
    let boxWidth = size, boxHeight = size;
    if (isText) {
      context.font = `${object.weight || 600} ${size}px "${object.font}", "Noto Sans Thai", sans-serif`;
      context.textAlign = 'center'; context.textBaseline = 'middle'; context.fillStyle = object.color;
      const lines = object.text.split('\n');
      boxWidth = Math.max(...lines.map(line => context.measureText(line).width), 1);
      boxHeight = lines.length * size * 1.3;
      if (object.shadow) { context.shadowColor = '#00000070'; context.shadowBlur = size * 0.08; context.shadowOffsetY = size * 0.035; }
      lines.forEach((line, index) => context.fillText(line, 0, (index - (lines.length - 1) / 2) * size * 1.3));
    } else drawSticker(context, object.type, size, object.color);
    context.restore();
    const angle = radians(object.rotation);
    const halfWidth = (Math.abs(Math.cos(angle)) * boxWidth + Math.abs(Math.sin(angle)) * boxHeight) / 2;
    const halfHeight = (Math.abs(Math.sin(angle)) * boxWidth + Math.abs(Math.cos(angle)) * boxHeight) / 2;
    const box = { id: object.id, x: x - halfWidth, y: y - halfHeight, w: halfWidth * 2, h: halfHeight * 2 };
    bounds.push(box);
    if (interactive && object.id === selectedId) {
      context.save(); context.strokeStyle = '#d4b5ff'; context.lineWidth = Math.max(1, width / 650); context.setLineDash([width / 100, width / 160]); context.strokeRect(box.x - 4, box.y - 4, box.w + 8, box.h + 8); context.restore();
    }
  }
  return bounds;
}

export function renderImage(source, state, options = {}) {
  const target = outputSize(source, state);
  const maxSide = options.maxSide || LIMITS.preview;
  const scale = Math.min(1, maxSide / Math.max(target.width, target.height));
  const photoScale = Math.min(1, maxSide / Math.max(geometrySize(source, state).width, geometrySize(source, state).height));
  let photo = drawGeometry(source, state, photoScale);
  const context = photo.getContext('2d');
  const values = resolveValues(state);
  const filtered = makeCanvas(photo.width, photo.height);
  const filterContext = filtered.getContext('2d');
  filterContext.filter = `brightness(${values.brightness}%) contrast(${values.contrast}%) saturate(${values.saturation}%) hue-rotate(${values.hue}deg) sepia(${values.sepia}%) grayscale(${values.grayscale}%) blur(${values.blur * photo.width / 700}px)`;
  filterContext.drawImage(photo, 0, 0);
  photo = sharpenPass(colorPass(filtered, values), values.sharpness);
  applyEffects(photo, values);
  const bounds = drawObjects(photo, state, options.selectedId, options.interactive);
  let canvas = addFrame(photo, state.frame);
  const topPadding = ['none', 'rounded'].includes(state.frame.type) ? 0 : Math.round(photo.width * state.frame.width / 100);
  const content = { x: (canvas.width - photo.width) / 2 / canvas.width, y: topPadding / canvas.height, w: photo.width / canvas.width, h: photo.height / canvas.height };
  if (state.resize) {
    const resized = makeCanvas(target.width * scale, target.height * scale);
    const resizeContext = resized.getContext('2d'); resizeContext.imageSmoothingQuality = 'high'; resizeContext.drawImage(canvas, 0, 0, resized.width, resized.height); canvas = resized;
  }
  return { canvas, bounds, content };
}
export function paintPreview(target, source, state, options = {}) {
  const result = renderImage(source, state, options);
  target.width = result.canvas.width; target.height = result.canvas.height;
  target.getContext('2d').drawImage(result.canvas, 0, 0);
  return result;
}
