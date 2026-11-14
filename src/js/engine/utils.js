export const clone = value => structuredClone(value);
export const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
export const radians = degrees => degrees * Math.PI / 180;
export const makeCanvas = (width, height) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
};
export function randomGenerator(seed) {
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
    return (seed >>> 0) / 4294967296;
  };
}
