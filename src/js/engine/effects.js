import { clamp, makeCanvas, randomGenerator } from './utils.js';
import { star } from './draw.js';

export function colorPass(canvas, values) {
  const keys = ['warmth', 'tint', 'fade', 'chromatic', 'exposure', 'highlights', 'shadows', 'whites', 'blacks', 'vibrance', 'clarity', 'sepia', 'grayscale'];
  if (!keys.some(key => values[key])) return canvas;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const data = image.data;
  const original = values.chromatic ? new Uint8ClampedArray(data) : data;
  const warm = values.warmth * 0.65, tint = values.tint * 0.4, fade = values.fade / 100;
  const shift = values.chromatic ? Math.max(1, Math.round(values.chromatic / 100 * canvas.width * 0.007)) : 0;
  const exposure = Math.pow(2, values.exposure / 100);
  for (let y = 0; y < canvas.height; y++) {
    for (let x = 0; x < canvas.width; x++) {
      const index = (y * canvas.width + x) * 4;
      if (!data[index + 3]) continue;
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
      let r = data[index], g = data[index + 1], b = data[index + 2];
      const luminance = (r * 0.299 + g * 0.587 + b * 0.114) / 255;
      const shadowMask = Math.pow(1 - luminance, 2), highlightMask = luminance * luminance;
      const whiteMask = Math.max(0, (luminance - 0.6) / 0.4), blackMask = Math.max(0, (0.4 - luminance) / 0.4);
      const tonal = values.shadows * shadowMask * 0.9 + values.highlights * highlightMask * 0.9 + values.whites * whiteMask * 0.7 + values.blacks * blackMask * 0.7;
      const midtone = 1 - Math.abs(luminance - 0.5) * 2;
      const gray = r * 0.299 + g * 0.587 + b * 0.114;
      const max = Math.max(r, g, b), min = Math.min(r, g, b);
      const vibrance = values.vibrance / 100 * (1 - (max - min) / 255) * 1.4;
      r = gray + (r - gray) * (1 + vibrance); g = gray + (g - gray) * (1 + vibrance); b = gray + (b - gray) * (1 + vibrance);
      const sepia = values.sepia / 100, mono = values.grayscale / 100;
      const sr = r * 0.393 + g * 0.769 + b * 0.189, sg = r * 0.349 + g * 0.686 + b * 0.168, sb = r * 0.272 + g * 0.534 + b * 0.131;
      r += (sr - r) * sepia; g += (sg - g) * sepia; b += (sb - b) * sepia;
      const neutral = r * 0.299 + g * 0.587 + b * 0.114;
      r += (neutral - r) * mono; g += (neutral - g) * mono; b += (neutral - b) * mono;
      for (let channel = 0; channel < 3; channel++) {
        let value = channel === 0 ? r : channel === 1 ? g : b;
        value *= exposure;
        value += tonal;
        value = (value - 128) * (1 + values.clarity / 100 * midtone * 0.8) + 128;
        data[index + channel] = clamp(value, 0, 255);
      }
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
}
export function sharpenPass(canvas, amount) {
  if (!amount) return canvas;
  const context = canvas.getContext('2d', { willReadFrequently: true });
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const original = new Uint8ClampedArray(image.data), data = image.data;
  const strength = amount / 100, width = canvas.width, height = canvas.height;
  for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
    const index = (y * width + x) * 4;
    if (!data[index + 3]) continue;
    for (let channel = 0; channel < 3; channel++) {
      const center = original[index + channel];
      const neighbors = original[index - 4 + channel] + original[index + 4 + channel] + original[index - width * 4 + channel] + original[index + width * 4 + channel];
      data[index + channel] = clamp(center + (center * 4 - neighbors) * strength * 0.5, 0, 255);
    }
  }
  context.putImageData(image, 0, 0);
  return canvas;
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
function blendLayer(canvas, layer, amount, mode = 'source-over') {
  const context = canvas.getContext('2d');
  context.save();
  context.globalAlpha = clamp(amount / 100, 0, 1);
  context.globalCompositeOperation = mode;
  context.drawImage(layer, 0, 0);
  context.restore();
}
function pixelLayer(canvas, transform, amount = 100) {
  const layer = makeCanvas(canvas.width, canvas.height);
  const context = layer.getContext('2d', { willReadFrequently: true });
  context.drawImage(canvas, 0, 0);
  const image = context.getImageData(0, 0, layer.width, layer.height);
  const original = amount < 100 ? new Uint8ClampedArray(image.data) : null;
  transform(image.data);
  if (original) {
    const mix = clamp(amount / 100, 0, 1);
    for (let index = 0; index < image.data.length; index += 4) {
      for (let channel = 0; channel < 3; channel++) image.data[index + channel] = original[index + channel] * (1 - mix) + image.data[index + channel] * mix;
    }
  }
  context.putImageData(image, 0, 0);
  return layer;
}
export function applyEffects(canvas, values) {
  const context = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height, unit = Math.min(width, height);
  const random = randomGenerator(721);
  context.save();
  const overlayKeys = ['glow', 'leak', 'vignette', 'grain', 'scanlines', 'dust', 'sparkle', 'fog', 'bokeh', 'rain', 'snow', 'scratches', 'glitch', 'motionBlur', 'radialBlur', 'tiltShift', 'bloom', 'lightRays', 'starburst', 'doubleExposure', 'tracking'];
  const alphaMask = overlayKeys.some(key => values[key] > 0) ? makeCanvas(width, height) : null;
  if (alphaMask) alphaMask.getContext('2d').drawImage(canvas, 0, 0);
  if (values.pixelate > 0) {
    const size = Math.max(2, Math.round(unit * values.pixelate / 1400));
    const small = makeCanvas(Math.max(1, Math.round(width / size)), Math.max(1, Math.round(height / size)));
    const smallContext = small.getContext('2d');
    smallContext.drawImage(canvas, 0, 0, small.width, small.height);
    context.imageSmoothingEnabled = false;
    context.clearRect(0, 0, width, height);
    context.drawImage(small, 0, 0, width, height);
    context.imageSmoothingEnabled = true;
  }
  if (values.posterize > 0) {
    const levels = Math.max(2, Math.round(10 - values.posterize / 14));
    const step = 255 / (levels - 1);
    blendLayer(canvas, pixelLayer(canvas, data => {
      for (let index = 0; index < data.length; index += 4) {
        if (!data[index + 3]) continue;
        for (let channel = 0; channel < 3; channel++) data[index + channel] = Math.round(data[index + channel] / step) * step;
      }
    }, values.posterize), 100, 'copy');
  }
  if (values.duotone > 0) {
    const shadow = [43, 25, 78], highlight = [158, 226, 196];
    blendLayer(canvas, pixelLayer(canvas, data => {
      for (let index = 0; index < data.length; index += 4) {
        if (!data[index + 3]) continue;
        const luminance = (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
        for (let channel = 0; channel < 3; channel++) data[index + channel] = shadow[channel] + (highlight[channel] - shadow[channel]) * luminance;
      }
    }, values.duotone), 100, 'copy');
  }
  if (values.invert > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    for (let index = 0; index < data.length; index += 4) {
      if (!data[index + 3]) continue;
      for (let channel = 0; channel < 3; channel++) data[index + channel] = 255 - data[index + channel];
    }
  }, values.invert), 100, 'copy');
  if (values.solarize > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    const threshold = 255 - values.solarize * 1.8;
    for (let index = 0; index < data.length; index += 4) {
      if (!data[index + 3]) continue;
      for (let channel = 0; channel < 3; channel++) if (data[index + channel] > threshold) data[index + channel] = 255 - data[index + channel];
    }
  }, values.solarize), 100, 'copy');
  if (values.threshold > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    for (let index = 0; index < data.length; index += 4) {
      if (!data[index + 3]) continue;
      const value = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114 > 128 ? 255 : 0;
      data[index] = data[index + 1] = data[index + 2] = value;
    }
  }, values.threshold), 100, 'copy');
  if (values.halftone > 0) {
    const layer = makeCanvas(width, height);
    const layerContext = layer.getContext('2d');
    const gap = Math.max(3, Math.round(unit / (30 + values.halftone)));
    const sample = makeCanvas(Math.max(1, Math.ceil(width / gap)), Math.max(1, Math.ceil(height / gap)));
    const sampleContext = sample.getContext('2d', { willReadFrequently: true });
    sampleContext.drawImage(canvas, 0, 0, sample.width, sample.height);
    const data = sampleContext.getImageData(0, 0, sample.width, sample.height).data;
    layerContext.fillStyle = '#171020';
    for (let y = 0; y < sample.height; y++) {
      for (let x = 0; x < sample.width; x++) {
        const index = (y * sample.width + x) * 4;
        if (!data[index + 3]) continue;
        const luminance = (data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114) / 255;
        const radius = (1 - luminance) * gap * 0.55;
        if (radius < 0.2) continue;
        layerContext.beginPath();
        layerContext.arc(x * gap + gap / 2, y * gap + gap / 2, radius, 0, Math.PI * 2);
        layerContext.fill();
      }
    }
    layerContext.globalCompositeOperation = 'destination-in';
    layerContext.drawImage(canvas, 0, 0);
    blendLayer(canvas, layer, values.halftone);
  }
  if (values.motionBlur > 0) {
    const layer = makeCanvas(width, height);
    const layerContext = layer.getContext('2d');
    const distance = unit * values.motionBlur / 1800;
    const steps = 9;
    for (let index = 0; index < steps; index++) {
      layerContext.globalAlpha = 1 / steps;
      layerContext.drawImage(canvas, (index - (steps - 1) / 2) * distance, 0);
    }
    blendLayer(canvas, layer, Math.min(100, values.motionBlur * 1.4));
  }
  if (values.radialBlur > 0) {
    const layer = makeCanvas(width, height);
    const layerContext = layer.getContext('2d');
    const steps = 8;
    for (let index = 1; index <= steps; index++) {
      const scale = 1 + index * values.radialBlur / 1600;
      layerContext.globalAlpha = 0.85 / steps;
      layerContext.drawImage(canvas, width * (1 - scale) / 2, height * (1 - scale) / 2, width * scale, height * scale);
    }
    blendLayer(canvas, layer, values.radialBlur);
  }
  if (values.tiltShift > 0) {
    const blurred = makeCanvas(width, height);
    const blurredContext = blurred.getContext('2d');
    blurredContext.filter = `blur(${unit * values.tiltShift / 2200}px)`;
    blurredContext.drawImage(canvas, 0, 0);
    blurredContext.filter = 'none';
    blurredContext.globalCompositeOperation = 'destination-in';
    const mask = blurredContext.createLinearGradient(0, 0, 0, height);
    mask.addColorStop(0, '#000');
    mask.addColorStop(0.32, '#0000');
    mask.addColorStop(0.68, '#0000');
    mask.addColorStop(1, '#000');
    blurredContext.fillStyle = mask;
    blurredContext.fillRect(0, 0, width, height);
    blendLayer(canvas, blurred, Math.min(100, values.tiltShift * 1.5));
  }
  if (values.glitch > 0) {
    const sourceCopy = makeCanvas(width, height);
    sourceCopy.getContext('2d').drawImage(canvas, 0, 0);
    const slices = Math.max(2, Math.round(values.glitch / 8));
    for (let index = 0; index < slices; index++) {
      const y = Math.floor(random() * height);
      const sliceHeight = Math.max(2, Math.floor(height * (0.01 + random() * 0.04)));
      const offset = (random() - 0.5) * width * values.glitch / 500;
      context.drawImage(sourceCopy, 0, y, width, sliceHeight, offset, y, width, sliceHeight);
    }
    context.globalCompositeOperation = 'screen';
    context.globalAlpha = values.glitch / 300;
    context.drawImage(sourceCopy, unit * values.glitch / 900, 0);
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'source-over';
  }
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
  if (values.fog > 0) {
    const gradient = context.createLinearGradient(0, height, 0, 0);
    gradient.addColorStop(0, `rgba(226,220,240,${values.fog / 150})`);
    gradient.addColorStop(0.55, `rgba(214,208,232,${values.fog / 320})`);
    gradient.addColorStop(1, 'rgba(214,208,232,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
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
  if (values.scratches > 0) {
    context.strokeStyle = `rgba(245,238,220,${values.scratches / 220})`;
    context.lineWidth = Math.max(0.5, width / 1600);
    for (let index = 0; index < values.scratches * 0.8; index++) {
      const x = random() * width;
      context.beginPath();
      context.moveTo(x, random() * height * 0.2);
      context.lineTo(x + (random() - 0.5) * width * 0.02, height * (0.5 + random() * 0.5));
      context.stroke();
    }
  }
  if (values.dust > 0) {
    for (let index = 0; index < values.dust * 3; index++) {
      context.fillStyle = `rgba(255,246,224,${0.15 + random() * 0.45})`;
      context.beginPath();
      context.arc(random() * width, random() * height, (0.3 + random()) * width / 1100, 0, Math.PI * 2);
      context.fill();
    }
  }
  if (values.rain > 0) {
    context.strokeStyle = `rgba(205,220,245,${values.rain / 240})`;
    context.lineWidth = Math.max(0.6, width / 1400);
    for (let index = 0; index < values.rain * 5; index++) {
      const x = random() * width, y = random() * height, length = unit * (0.02 + random() * 0.05);
      context.beginPath();
      context.moveTo(x, y);
      context.lineTo(x - length * 0.22, y + length);
      context.stroke();
    }
  }
  if (values.snow > 0) {
    for (let index = 0; index < values.snow * 3; index++) {
      context.fillStyle = `rgba(250,250,255,${0.25 + random() * 0.65})`;
      context.beginPath();
      context.arc(random() * width, random() * height, (0.4 + random() * 1.6) * width / 900, 0, Math.PI * 2);
      context.fill();
    }
  }
  if (values.bokeh > 0) {
    context.globalCompositeOperation = 'screen';
    for (let index = 0; index < values.bokeh * 0.45; index++) {
      const x = random() * width, y = random() * height, radius = unit * (0.015 + random() * 0.06);
      const hue = [ '183,148,246', '158,226,196', '241,172,208', '244,211,141' ][index % 4];
      const gradient = context.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(${hue},${values.bokeh / 420})`);
      gradient.addColorStop(0.72, `rgba(${hue},${values.bokeh / 700})`);
      gradient.addColorStop(1, `rgba(${hue},0)`);
      context.fillStyle = gradient;
      context.beginPath();
      context.arc(x, y, radius, 0, Math.PI * 2);
      context.fill();
    }
    context.globalCompositeOperation = 'source-over';
  }
  if (values.sparkle > 0) {
    context.shadowColor = '#d9c7ff';
    context.shadowBlur = unit * 0.008;
    for (let index = 0; index < values.sparkle * 0.65; index++) {
      const x = random() * width, y = random() * height;
      star(context, x, y, (0.002 + random() * 0.005) * unit, `rgba(245,239,255,${0.3 + random() * 0.65})`);
    }
  }
  if (values.bloom > 0) {
    const layer = makeCanvas(width, height), layerContext = layer.getContext('2d');
    layerContext.filter = `blur(${unit * 0.025}px) brightness(1.45)`; layerContext.drawImage(canvas, 0, 0);
    blendLayer(canvas, layer, values.bloom * 0.7, 'screen');
  }
  if (values.lightRays > 0) {
    context.save(); context.globalCompositeOperation = 'screen'; context.translate(width * 0.82, height * 0.12);
    for (let index = 0; index < 12; index++) {
      context.rotate(Math.PI / 6); const gradient = context.createLinearGradient(0, 0, unit, 0);
      gradient.addColorStop(0, `rgba(255,236,190,${values.lightRays / 180})`); gradient.addColorStop(1, 'rgba(255,236,190,0)');
      context.fillStyle = gradient; context.beginPath(); context.moveTo(0, 0); context.lineTo(unit, -unit * 0.035); context.lineTo(unit, unit * 0.035); context.fill();
    }
    context.restore();
  }
  if (values.starburst > 0) {
    context.save(); context.globalCompositeOperation = 'screen'; context.strokeStyle = `rgba(235,220,255,${values.starburst / 150})`; context.lineWidth = Math.max(1, unit / 500);
    for (let index = 0; index < 24; index++) { const angle = index * Math.PI / 12; context.beginPath(); context.moveTo(width / 2, height / 2); context.lineTo(width / 2 + Math.cos(angle) * unit, height / 2 + Math.sin(angle) * unit); context.stroke(); }
    context.restore();
  }
  if (values.prism > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    const copy = new Uint8ClampedArray(data), offset = Math.max(1, Math.round(unit * values.prism / 1200));
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const index = (y * width + x) * 4; data[index] = copy[(y * width + Math.min(width - 1, x + offset)) * 4]; data[index + 1] = copy[(Math.min(height - 1, y + offset) * width + x) * 4 + 1]; data[index + 2] = copy[(y * width + Math.max(0, x - offset)) * 4 + 2]; }
  }, values.prism), 100, 'copy');
  if (values.colorNoise > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    for (let index = 0; index < data.length; index += 4) for (let channel = 0; channel < 3; channel++) data[index + channel] = clamp(data[index + channel] + (random() - 0.5) * 180, 0, 255);
  }, values.colorNoise), 100, 'copy');
  if (values.dither > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    const bayer = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { const index = (y * width + x) * 4; const value = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114 > bayer[(y % 4) * 4 + x % 4] * 16 ? 255 : 0; data[index] = data[index + 1] = data[index + 2] = value; }
  }, values.dither), 100, 'copy');
  if (values.emboss > 0 || values.edges > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    const copy = new Uint8ClampedArray(data);
    for (let y = 1; y < height - 1; y++) for (let x = 1; x < width - 1; x++) {
      const index = (y * width + x) * 4;
      const sample = (dx, dy) => { const i = ((y + dy) * width + x + dx) * 4; return copy[i] * 0.299 + copy[i + 1] * 0.587 + copy[i + 2] * 0.114; };
      let value;
      if (values.emboss > 0) value = clamp(128 + sample(1, 1) - sample(-1, -1) + (sample(1, 0) - sample(-1, 0)) * 0.5, 0, 255);
      else { const gx = -sample(-1, -1) - 2 * sample(-1, 0) - sample(-1, 1) + sample(1, -1) + 2 * sample(1, 0) + sample(1, 1); const gy = -sample(-1, -1) - 2 * sample(0, -1) - sample(1, -1) + sample(-1, 1) + 2 * sample(0, 1) + sample(1, 1); value = clamp(Math.hypot(gx, gy), 0, 255); }
      data[index] = data[index + 1] = data[index + 2] = value;
    }
  }, Math.max(values.emboss, values.edges)), 100, 'copy');
  if (values.mirror > 0) {
    const layer = makeCanvas(width, height), layerContext = layer.getContext('2d'); layerContext.drawImage(canvas, 0, 0);
    layerContext.save(); layerContext.translate(width, 0); layerContext.scale(-1, 1); layerContext.drawImage(canvas, 0, 0, width / 2, height, 0, 0, width / 2, height); layerContext.restore();
    blendLayer(canvas, layer, values.mirror, 'copy');
  }
  if (values.kaleidoscope > 0) {
    const layer = makeCanvas(width, height), layerContext = layer.getContext('2d'); layerContext.drawImage(canvas, 0, 0);
    layerContext.save(); layerContext.translate(width / 2, height / 2);
    for (let index = 0; index < 8; index++) { layerContext.save(); layerContext.rotate(index * Math.PI / 4); layerContext.beginPath(); layerContext.moveTo(0, 0); layerContext.arc(0, 0, Math.hypot(width, height), 0, Math.PI / 4); layerContext.closePath(); layerContext.clip(); layerContext.rotate(-index * Math.PI / 8); layerContext.drawImage(canvas, -width / 2, -height / 2); layerContext.restore(); }
    layerContext.restore(); blendLayer(canvas, layer, values.kaleidoscope, 'copy');
  }
  if (values.fisheye > 0 || values.swirl > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    const copy = new Uint8ClampedArray(data), cx = width / 2, cy = height / 2, radius = Math.min(cx, cy);
    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
      const dx = (x - cx) / radius, dy = (y - cy) / radius, distance = Math.hypot(dx, dy);
      let sx = x, sy = y;
      if (distance < 1) {
        if (values.fisheye > 0) { const factor = 1 - values.fisheye / 100 * (1 - distance) * 0.65; sx = cx + dx * radius * factor; sy = cy + dy * radius * factor; }
        if (values.swirl > 0) { const angle = values.swirl / 100 * (1 - distance) * 3; sx = cx + (dx * Math.cos(angle) - dy * Math.sin(angle)) * radius; sy = cy + (dx * Math.sin(angle) + dy * Math.cos(angle)) * radius; }
      }
      const index = (y * width + x) * 4, sourceIndex = (clamp(Math.round(sy), 0, height - 1) * width + clamp(Math.round(sx), 0, width - 1)) * 4;
      for (let channel = 0; channel < 4; channel++) data[index + channel] = copy[sourceIndex + channel];
    }
  }, Math.max(values.fisheye, values.swirl)), 100, 'copy');
  if (values.doubleExposure > 0) {
    const layer = makeCanvas(width, height), layerContext = layer.getContext('2d'); layerContext.translate(width, height); layerContext.rotate(Math.PI); layerContext.drawImage(canvas, 0, 0);
    blendLayer(canvas, layer, values.doubleExposure * 0.65, 'screen');
  }
  if (values.tracking > 0) {
    const copy = makeCanvas(width, height); copy.getContext('2d').drawImage(canvas, 0, 0);
    for (let index = 0; index < 6; index++) { const y = Math.floor(height * (0.15 + index * 0.13)), h = Math.max(2, height * 0.025); context.drawImage(copy, 0, y, width, h, (random() - 0.5) * width * values.tracking / 300, y, width, h); }
    context.fillStyle = `rgba(255,255,255,${values.tracking / 500})`; context.fillRect(0, height * 0.72, width, Math.max(2, height * 0.02));
  }
  if (values.colorDodge > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    for (let index = 0; index < data.length; index += 4) for (let channel = 0; channel < 3; channel++) data[index + channel] = clamp(data[index + channel] * 1.35 + 25, 0, 255);
  }, values.colorDodge), 100, 'screen');
  if (values.bleach > 0) blendLayer(canvas, pixelLayer(canvas, data => {
    for (let index = 0; index < data.length; index += 4) { const gray = data[index] * 0.299 + data[index + 1] * 0.587 + data[index + 2] * 0.114; for (let channel = 0; channel < 3; channel++) data[index + channel] = clamp((data[index + channel] * 0.35 + gray * 0.65 - 128) * 1.35 + 128, 0, 255); }
  }, values.bleach), 100, 'copy');
  if (alphaMask) {
    context.globalCompositeOperation = 'destination-in';
    context.drawImage(alphaMask, 0, 0);
    context.globalCompositeOperation = 'source-over';
  }
  context.restore();
  return canvas;
}
