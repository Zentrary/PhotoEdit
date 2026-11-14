import { makeCanvas, radians } from './utils.js';

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
export function drawGeometry(source, state, scale) {
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
