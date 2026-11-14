import { adjustmentKeys, effectKeys, getPreset } from '../core/presets.js';

export function initialState() {
  return {
    preset: null, presetStrength: 80,
    adjustments: Object.fromEntries(adjustmentKeys.map(key => [key, ['brightness', 'contrast', 'saturation'].includes(key) ? 100 : 0])),
    effects: Object.fromEntries(effectKeys.map(key => [key, 0])),
    crop: { x: 0, y: 0, w: 1, h: 1 }, rotation: 0, straighten: 0, flipX: false, flipY: false,
    frame: { type: 'none', width: 5, color: '#ffffff' }, resize: null,
    texts: [], stickers: [], strokes: []
  };
}

export function presetState(id, strength = 80) {
  const state = initialState();
  state.preset = getPreset(id) ? id : null;
  state.presetStrength = strength;
  return state;
}
