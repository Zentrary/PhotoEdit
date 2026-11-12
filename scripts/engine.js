import { neutral, resolveValues, getPreset } from './presets.js';

export const LIMITS = { fileBytes: 30 * 1024 * 1024, sourcePixels: 32000000, exportPixels: 24000000, side: 8192, preview: 1400 };
export const frameTypes = [
  { id: 'none', name: 'ไม่มีกรอบ' }, { id: 'white', name: 'ขอบขาว' }, { id: 'black', name: 'ขอบดำ' },
  { id: 'polaroid', name: 'โพลารอยด์' }, { id: 'film', name: 'ขอบฟิล์ม' }, { id: 'rounded', name: 'มุมมน' },
  { id: 'neon', name: 'นีออน' }, { id: 'cosmic', name: 'กาแล็กซี' }
];
export const stickerTypes = ['star', 'heart', 'moon', 'planet', 'sparkle', 'flower', 'bolt', 'butterfly', 'smile', 'cherry', 'diamond', 'music'];
export function initialState() {
  return {
    preset: null, presetStrength: 80,
    adjustments: Object.fromEntries(Object.keys(neutral).map(key => [key, ['brightness', 'contrast', 'saturation'].includes(key) ? 100 : 0])),
    effects: Object.fromEntries(Object.keys(neutral).map(key => [key, 0])),
    crop: { x: 0, y: 0, w: 1, h: 1 }, rotation: 0, straighten: 0, flipX: false, flipY: false,
    frame: { type: 'none', width: 5, color: '#ffffff' }, resize: null,
    texts: [], stickers: [], strokes: []
  };
}
export const clone = value => structuredClone(value);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const radians = degrees => degrees * Math.PI / 180;
const makeCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};
function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
function inscribedSize(width, height, angle) {
  const a = Math.abs(radians(angle));
  if (a < 0.0001) return { width, height };
  const sine = Math.sin(a), cosine = Math.cos(a);
  const long = Math.max(width, height), short = Math.min(width, height);
  if (short <= 2 * sine * cosine * long || Math.abs(sine - cosine) < 0.00001) {
    const half = short / 2;
    return width >= height ? { width: half / sine, height: half / cosine } : { width: half / cosine, height: half / sine };
  }
  const denominator = cosine * cosine - sine * sine;
  return { width: (width * cosine - height * sine) / denominator, height: (height * cosine - width * sine) / denominator };
}
export function geometrySize(source, state) {
  const turned = state.rotation % 180 !== 0;
  const width = turned ? source.height : source.width, height = turned ? source.width : source.height;
  const size = inscribedSize(width, height, state.straighten);
  return { width: Math.max(1, Math.round(size.width * state.crop.w)), height: Math.max(1, Math.round(size.height * state.crop.h)) };
}
export function outputSize(source, state) {
  const natural = geometrySize(source, state);
  const padding = ['none', 'rounded'].includes(state.frame.type) ? 0 : state.frame.width / 100;
  const bottom = state.frame.type === 'polaroid' ? padding * 2.5 : padding;
  const width = natural.width * (1 + padding * 2), height = natural.height * (1 + padding + bottom);
  return state.resize ? { ...state.resize } : { width: Math.round(width), height: Math.round(height) };
}
function drawGeometry(source, state, scale) {
  const turned = state.rotation % 180 !== 0;
  const width = (turned ? source.height : source.width) * scale, height = (turned ? source.width : source.height) * scale;
  const fitted = inscribedSize(width, height, state.straighten);
  const rotated = makeCanvas(fitted.width, fitted.height);
  const context = rotated.getContext('2d');
  context.imageSmoothingQuality = 'high';
  context.translate(rotated.width / 2, rotated.height / 2);
  context.rotate(radians(state.rotation + state.straighten));
  context.scale(state.flipX ? -1 : 1, state.flipY ? -1 : 1);
  context.drawImage(source, -width / 2, -height / 2, width, height);
  const crop = state.crop;
  const canvas = makeCanvas(rotated.width * crop.w, rotated.height * crop.h);
  const cropContext = canvas.getContext('2d');
  cropContext.imageSmoothingQuality = 'high';
  cropContext.drawImage(rotated, crop.x * rotated.width, crop.y * rotated.height, crop.w * rotated.width, crop.h * rotated.height, 0, 0, canvas.width, canvas.height);
  return canvas;
}
function colorPass(canvas, values) {
  if (!values.warmth && !values.tint && !values.fade && !values.chromatic) return canvas;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const original = values.chromatic ? new Uint8ClampedArray(data) : data;
  const warm = values.warmth * 0.65, tint = values.tint * 0.4, fade = values.fade / 100;
  const shift = Math.round(values.chromatic / 100 * canvas.width * 0.007);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (shift) {
        data[index] = original[(y * canvas.width + Math.min(canvas.width - 1, x + shift)) * 4];
        data[index + 2] = original[(y * canvas.width + Math.max(0, x - shift)) * 4 + 2];
      }
      for (let channel = 0; channel < 3; channel++) {
        let value = data[index + channel];
        value += channel === 0 ? warm : channel === 2 ? -warm : tint;
        value = value * (1 - fade * 0.28) + 245 * fade * 0.28;
        data[index + channel] = clamp(value, 0, 255);
      }
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
function star(context, x, y, radius, color, points = 4) {
  context.beginPath();
  for (let index = 0; index < points * 2; index++) {
    const angle = index * Math.PI / points - Math.PI / 2;
    const length = index % 2 ? radius * 0.28 : radius;
    const px = x + Math.cos(angle) * length, py = y + Math.sin(angle) * length;
    if (!index) context.moveTo(px, py); else context.lineTo(px, py);
  }
  context.closePath();
  context.fillStyle = color;
  context.fill();
}
let noiseTile;
function getNoise() {
  if (noiseTile) return noiseTile;
  noiseTile = makeCanvas(160, 160);
  const context = noiseTile.getContext('2d');
  const image = context.createImageData(160, 160);
  const random = randomGenerator(1994);
  for (let index = 0; index < image.data.length; index += 4) {
    const value = random() > 0.5 ? 255 : 0;
    image.data[index] = image.data[index + 1] = image.data[index + 2] = value;
    image.data[index + 3] = Math.round(random() * 150);
  }
  context.putImageData(image, 0, 0);
  return noiseTile;
}
function applyEffects(canvas, values) {
  const context = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height, unit = Math.min(width, height);
  const random = randomGenerator(721);
  context.save();
  if (values.glow > 0) {
    const glow = makeCanvas(width, height);
    const glowContext = glow.getContext('2d');
    glowContext.filter = `blur(${unit * 0.012}px) brightness(1.2)`;
    glowContext.drawImage(canvas, 0, 0);
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = values.glow / 180;
    context.drawImage(glow, 0, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }
  if (values.leak > 0) {
    const gradient = context.createRadialGradient(width * 1.03, height * 0.15, 0, width, height * 0.2, width * 0.85);
    gradient.addColorStop(0, `rgba(255,174,83,${values.leak / 110})`);
    gradient.addColorStop(0.4, `rgba(251,91,132,${values.leak / 230})`);
    gradient.addColorStop(1, 'rgba(251,91,132,0)');
    context.globalCompositeOperation = 'screen';
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.globalCompositeOperation = 'source-over';
  }
  if (values.vignette > 0) {
    const gradient = context.createRadialGradient(width / 2, height / 2, unit * 0.2, width / 2, height / 2, Math.hypot(width, height) / 2);
    gradient.addColorStop(0, 'rgba(0,0,0,0)');
    gradient.addColorStop(1, `rgba(0,0,0,${values.vignette / 115})`);
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
  }
  if (values.grain > 0) {
    context.globalAlpha = values.grain / 160;
    context.globalCompositeOperation = 'soft-light';
    const pattern = context.createPattern(getNoise(), 'repeat');
    pattern.setTransform(new DOMMatrix().scale(Math.max(0.5, width / 1000)));
    context.fillStyle = pattern;
    context.fillRect(0, 0, width, height);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }
  if (values.scanlines > 0) {
    const gap = Math.max(2, height / 230);
    context.fillStyle = `rgba(5,3,20,${values.scanlines / 180})`;
    for (let y = 0; y < height; y += gap * 2) context.fillRect(0, y, width, gap);
  }
  if (values.dust > 0) {
    for (let index = 0; index < values.dust * 3; index++) {
      context.fillStyle = `rgba(255,246,224,${0.15 + random() * 0.45})`;
      context.beginPath();
      context.arc(random() * width, random() * height, (0.3 + random()) * width / 1100, 0, Math.PI * 2);
      context.fill();
    }
  }
  if (values.sparkle > 0) {
    context.shadowColor = '#d9c7ff';
    context.shadowBlur = unit * 0.008;
    for (let index = 0; index < values.sparkle * 0.65; index++) {
      const x = random() * width, y = random() * height;
      star(context, x, y, (0.002 + random() * 0.005) * unit, `rgba(245,239,255,${0.3 + random() * 0.65})`);
    }
  }
  context.restore();
  return canvas;
}
function drawStrokes(context, strokes, width, height) {
  const layer = makeCanvas(width, height);
  const ink = layer.getContext('2d');
  ink.lineCap = 'round';
  ink.lineJoin = 'round';
  for (const stroke of strokes) {
    ink.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ink.globalAlpha = stroke.tool === 'highlighter' ? 0.35 : 1;
    ink.strokeStyle = stroke.color;
    ink.fillStyle = stroke.color;
    ink.lineWidth = stroke.size / 100 * width;
    const points = stroke.points;
    if (points.length === 1) {
      ink.beginPath();
      ink.arc(points[0].x * width, points[0].y * height, ink.lineWidth / 2, 0, Math.PI * 2);
      ink.fill();
    } else {
      ink.beginPath();
      ink.moveTo(points[0].x * width, points[0].y * height);
      for (let index = 1; index < points.length - 1; index++) {
        const point = points[index], next = points[index + 1];
        ink.quadraticCurveTo(point.x * width, point.y * height, (point.x + next.x) / 2 * width, (point.y + next.y) / 2 * height);
      }
      const last = points[points.length - 1];
      if (last) ink.lineTo(last.x * width, last.y * height);
      ink.stroke();
    }
  }
  context.drawImage(layer, 0, 0);
}
function heart(context, size) {
  context.beginPath();
  context.moveTo(0, size * 0.42);
  context.bezierCurveTo(-size * 0.7, 0, -size * 0.45, -size * 0.6, 0, -size * 0.22);
  context.bezierCurveTo(size * 0.45, -size * 0.6, size * 0.7, 0, 0, size * 0.42);
  context.fill();
}
export function drawSticker(context, type, size, color) {
  context.fillStyle = color;
  context.strokeStyle = color;
  context.lineWidth = size * 0.075;
  context.lineCap = 'round';
  context.lineJoin = 'round';
  if (type === 'star') star(context, 0, 0, size * 0.5, color, 5);
  else if (type === 'sparkle') star(context, 0, 0, size * 0.5, color);
  else if (type === 'heart') heart(context, size);
  else if (type === 'moon') {
    context.beginPath();
    context.arc(0, 0, size * 0.43, Math.PI * 0.2, Math.PI * 1.65);
    context.bezierCurveTo(-size * 0.1, -size * 0.2, -size * 0.12, size * 0.23, size * 0.35, size * 0.25);
    context.fill();
  } else if (type === 'planet') {
    context.beginPath(); context.arc(0, 0, size * 0.3, 0, Math.PI * 2); context.fill();
    context.save(); context.rotate(-0.4); context.beginPath(); context.ellipse(0, 0, size * 0.52, size * 0.15, 0, 0, Math.PI * 2); context.stroke(); context.restore();
  } else if (type === 'flower') {
    for (let index = 0; index < 6; index++) {
      const angle = index * Math.PI / 3;
      context.beginPath(); context.arc(Math.cos(angle) * size * 0.25, Math.sin(angle) * size * 0.25, size * 0.2, 0, Math.PI * 2); context.fill();
    }
    context.fillStyle = '#fff2b8'; context.beginPath(); context.arc(0, 0, size * 0.13, 0, Math.PI * 2); context.fill();
  } else if (type === 'bolt') {
    const points = [[0.08, -0.5], [-0.35, 0.08], [-0.03, 0.08], [-0.12, 0.5], [0.36, -0.12], [0.06, -0.12]];
    context.beginPath(); points.forEach(([x, y], index) => index ? context.lineTo(x * size, y * size) : context.moveTo(x * size, y * size)); context.closePath(); context.fill();
  } else if (type === 'butterfly') {
    for (const side of [-1, 1]) {
      context.beginPath(); context.ellipse(side * size * 0.22, -size * 0.18, size * 0.23, size * 0.28, side * 0.4, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.ellipse(side * size * 0.18, size * 0.2, size * 0.18, size * 0.22, -side * 0.4, 0, Math.PI * 2); context.fill();
    }
    context.strokeStyle = '#ffffff'; context.beginPath(); context.moveTo(0, -size * 0.3); context.lineTo(0, size * 0.35); context.stroke();
  } else if (type === 'smile') {
    context.beginPath(); context.arc(0, 0, size * 0.43, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#241b38';
    for (const side of [-1, 1]) { context.beginPath(); context.ellipse(side * size * 0.15, -size * 0.1, size * 0.035, size * 0.065, 0, 0, Math.PI * 2); context.fill(); }
    context.strokeStyle = '#241b38'; context.beginPath(); context.arc(0, 0, size * 0.24, 0.2, Math.PI - 0.2); context.stroke();
  } else if (type === 'cherry') {
    context.strokeStyle = '#a4d5a2'; context.beginPath(); context.moveTo(-size * 0.2, size * 0.2); context.quadraticCurveTo(0, -size * 0.5, size * 0.25, -size * 0.35); context.lineTo(size * 0.22, size * 0.2); context.stroke();
    for (const side of [-1, 1]) { context.beginPath(); context.arc(side * size * 0.22, size * 0.22, size * 0.2, 0, Math.PI * 2); context.fill(); }
  } else if (type === 'diamond') {
    context.beginPath(); context.moveTo(-size * 0.45, -size * 0.15); context.lineTo(-size * 0.23, -size * 0.4); context.lineTo(size * 0.23, -size * 0.4); context.lineTo(size * 0.45, -size * 0.15); context.lineTo(0, size * 0.45); context.closePath(); context.fill();
    context.strokeStyle = '#ffffff99'; context.beginPath(); context.moveTo(-size * 0.45, -size * 0.15); context.lineTo(size * 0.45, -size * 0.15); context.moveTo(-size * 0.15, -size * 0.15); context.lineTo(0, size * 0.45); context.lineTo(size * 0.15, -size * 0.15); context.stroke();
  } else if (type === 'music') {
    context.beginPath(); context.moveTo(-size * 0.2, size * 0.25); context.lineTo(-size * 0.2, -size * 0.35); context.lineTo(size * 0.3, -size * 0.45); context.lineTo(size * 0.3, size * 0.15); context.stroke();
    context.beginPath(); context.ellipse(-size * 0.3, size * 0.28, size * 0.14, size * 0.1, -0.3, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(size * 0.2, size * 0.18, size * 0.14, size * 0.1, -0.3, 0, Math.PI * 2); context.fill();
  }
}
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
function addFrame(photo, frame) {
  if (frame.type === 'none') return photo;
  const padding = Math.round(photo.width * frame.width / 100);
  const bottom = frame.type === 'polaroid' ? Math.round(padding * 2.5) : padding;
  const canvas = makeCanvas(photo.width + padding * 2, photo.height + padding + bottom);
  const context = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  if (frame.type === 'rounded') {
    context.beginPath(); context.roundRect(0, 0, width, height, Math.min(width, height) * frame.width / 150); context.clip(); context.drawImage(photo, 0, 0); return canvas;
  }
  context.fillStyle = ['black', 'film'].includes(frame.type) ? '#141218' : frame.type === 'polaroid' ? '#f8f5ed' : frame.color;
  if (frame.type === 'cosmic') {
    const gradient = context.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, '#35205e'); gradient.addColorStop(0.5, '#101d3e'); gradient.addColorStop(1, '#743c78'); context.fillStyle = gradient;
  }
  context.fillRect(0, 0, width, height);
  if (frame.type === 'neon') {
    context.strokeStyle = '#c29aff'; context.shadowColor = '#b477ff'; context.shadowBlur = padding * 0.6; context.lineWidth = Math.max(2, padding * 0.12); context.strokeRect(padding * 0.65, padding * 0.65, width - padding * 1.3, height - padding - bottom + padding * 0.65); context.shadowBlur = 0;
  }
  context.drawImage(photo, padding, padding);
  if (frame.type === 'film') {
    context.fillStyle = '#d5cdbf';
    const hole = padding * 0.38;
    for (let y = padding * 0.3; y < height - padding; y += padding * 0.85) {
      context.beginPath(); context.roundRect(padding * 0.25, y, hole, hole * 1.2, hole * 0.15); context.fill();
      context.beginPath(); context.roundRect(width - padding * 0.25 - hole, y, hole, hole * 1.2, hole * 0.15); context.fill();
    }
  }
  if (frame.type === 'cosmic') {
    const random = randomGenerator(44);
    for (let index = 0; index < 55; index++) {
      const x = random() * width, y = random() < 0.5 ? random() * padding : height - random() * bottom;
      star(context, x, y, Math.max(1, padding * 0.07), '#e9d9ff');
    }
  }
  return canvas;
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
  photo = colorPass(filtered, values);
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
export function presetState(id, strength = 80) {
  const state = initialState();
  state.preset = getPreset(id) ? id : null;
  state.presetStrength = strength;
  return state;
}
export async function decodeFile(file) {
  if (file.size > LIMITS.fileBytes) throw new Error('ไฟล์ใหญ่เกิน 30 MB ลองย่อไฟล์แล้วเปิดใหม่อีกครั้ง');
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) && !/\.(jpe?g|png|webp)$/i.test(file.name)) throw new Error('รองรับ JPG, PNG และ WebP ส่วน HEIC หรือ GIF กรุณาแปลงเป็น JPG หรือ PNG ก่อน');
  let bitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image(); image.src = url; await image.decode();
      bitmap = await createImageBitmap(image);
    } catch {
      throw new Error('เปิดรูปนี้ไม่สำเร็จ ไฟล์อาจเสียหายหรือไม่รองรับในเบราว์เซอร์นี้');
    } finally { URL.revokeObjectURL(url); }
  }
  if (bitmap.width * bitmap.height > LIMITS.sourcePixels || Math.max(bitmap.width, bitmap.height) > 16384) {
    bitmap.close(); throw new Error('รูปใหญ่เกิน 32 ล้านพิกเซล หรือด้านยาวเกิน 16,384 px ลองย่อรูปก่อนเพื่อป้องกันเครื่องค้าง');
  }
  const canvas = makeCanvas(bitmap.width, bitmap.height);
  canvas.getContext('2d').drawImage(bitmap, 0, 0);
  bitmap.close();
  return canvas;
}
export function validateResize(width, height) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 1 || height < 1) throw new Error('กรุณาใส่ความกว้างและความสูงเป็นจำนวนเต็มที่มากกว่า 0');
  if (width > LIMITS.side || height > LIMITS.side) throw new Error('ด้านยาวต้องไม่เกิน 8,192 px');
  if (width * height > LIMITS.exportPixels) throw new Error('ขนาดส่งออกต้องไม่เกิน 24 ล้านพิกเซล ลองลดความกว้างหรือความสูง');
  return { width, height };
}
export async function exportBlob(source, state, format = 'image/png', quality = 0.92) {
  const size = outputSize(source, state);
  validateResize(size.width, size.height);
  const { canvas } = renderImage(source, state, { maxSide: Math.max(size.width, size.height) });
  let result = canvas;
  if (format === 'image/jpeg') {
    result = makeCanvas(canvas.width, canvas.height);
    const context = result.getContext('2d'); context.fillStyle = '#ffffff'; context.fillRect(0, 0, result.width, result.height); context.drawImage(canvas, 0, 0);
  }
  const blob = await new Promise(resolve => result.toBlob(resolve, format, quality));
  if (!blob) throw new Error('สร้างไฟล์ไม่สำเร็จ ลองลดขนาดรูปหรือเปลี่ยนชนิดไฟล์');
  if (blob.type !== format) throw new Error('เบราว์เซอร์นี้ไม่รองรับชนิดไฟล์ที่เลือก กรุณาเลือก PNG หรือ JPG');
  return blob;
}
