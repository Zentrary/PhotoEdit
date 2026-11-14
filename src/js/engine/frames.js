import { heart, star } from './draw.js';
import { makeCanvas, randomGenerator } from './utils.js';

export function addFrame(photo, frame) {
  if (frame.type === 'none') return photo;
  const padding = Math.round(photo.width * frame.width / 100);
  const bottom = frame.type === 'polaroid' ? Math.round(padding * 2.5) : padding;
  const canvas = makeCanvas(photo.width + padding * 2, photo.height + padding + bottom);
  const context = canvas.getContext('2d');
  const width = canvas.width, height = canvas.height;
  if (frame.type === 'rounded') {
    context.beginPath(); context.roundRect(0, 0, width, height, Math.min(width, height) * frame.width / 150); context.clip(); context.drawImage(photo, 0, 0); return canvas;
  }
  const fixedColors = { black: '#141218', film: '#141218', polaroid: '#f8f5ed', cream: '#f3ead8', mint: '#cde8dc', blush: '#f2d3da', lavender: '#d9cdf0', midnight: '#171426', gold: '#caa64b', silver: '#c9ccd4' };
  context.fillStyle = fixedColors[frame.type] || frame.color;
  const gradients = {
    sunset: ['#ff9a62', '#f2607c', '#7b4fa0'],
    ocean: ['#0f2c4c', '#2b7a9e', '#9ee2c4'],
    candy: ['#f1acd0', '#c4a0f5', '#a5d8e6'],
    aurora: ['#1b2a5e', '#3e7c8f', '#9ee2c4', '#b794f6'],
    rainbow: ['#ef8d79', '#f4d38d', '#a4d5a2', '#a5d8e6', '#c4a0f5', '#f1acd0']
  };
  if (gradients[frame.type]) {
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradients[frame.type].forEach((color, index, list) => gradient.addColorStop(index / (list.length - 1), color));
    context.fillStyle = gradient;
  }
  if (frame.type === 'gold' || frame.type === 'silver') {
    const gradient = context.createLinearGradient(0, 0, width, height);
    const stops = frame.type === 'gold' ? ['#8a6a24', '#f4df9a', '#caa64b', '#fff2c4', '#9a7a2e'] : ['#8f939c', '#f2f4f8', '#b9bec8', '#ffffff', '#90959e'];
    stops.forEach((color, index) => gradient.addColorStop(index / (stops.length - 1), color));
    context.fillStyle = gradient;
  }
  if (frame.type === 'checker') {
    const cell = Math.max(2, padding / 3);
    context.fillStyle = frame.color;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#171020';
    for (let y = 0; y < height; y += cell) {
      for (let x = 0; x < width; x += cell) {
        if ((Math.floor(x / cell) + Math.floor(y / cell)) % 2) context.fillRect(x, y, cell, cell);
      }
    }
  }
  if (frame.type === 'cosmic') {
    const gradient = context.createLinearGradient(0, 0, width, height); gradient.addColorStop(0, '#35205e'); gradient.addColorStop(0.5, '#101d3e'); gradient.addColorStop(1, '#743c78'); context.fillStyle = gradient;
  }
  context.fillRect(0, 0, width, height);
  if (frame.type === 'neon') {
    context.strokeStyle = '#c29aff'; context.shadowColor = '#b477ff'; context.shadowBlur = padding * 0.6; context.lineWidth = Math.max(2, padding * 0.12); context.strokeRect(padding * 0.65, padding * 0.65, width - padding * 1.3, height - padding - bottom + padding * 0.65); context.shadowBlur = 0;
  }
  if (frame.type === 'shadow') {
    context.save();
    context.shadowColor = '#00000088';
    context.shadowBlur = padding * 0.55;
    context.shadowOffsetY = padding * 0.18;
    context.fillStyle = '#000';
    context.fillRect(padding, padding, photo.width, photo.height);
    context.restore();
  }
  context.drawImage(photo, padding, padding);
  const innerWidth = width - padding * 2, innerHeight = height - padding - bottom;
  if (frame.type === 'double') {
    context.strokeStyle = frame.color === '#ffffff' ? '#171020' : '#ffffffaa';
    context.lineWidth = Math.max(1, padding * 0.07);
    context.strokeRect(padding * 0.45, padding * 0.45, width - padding * 0.9, height - padding * 0.45 - bottom);
    context.strokeRect(padding * 0.82, padding * 0.82, width - padding * 1.64, height - padding * 0.82 - bottom);
  }
  if (frame.type === 'dashed' || frame.type === 'dotted') {
    context.strokeStyle = frame.color === '#ffffff' ? '#171020' : '#ffffffcc';
    context.lineWidth = Math.max(1, padding * 0.09);
    context.setLineDash(frame.type === 'dashed' ? [padding * 0.45, padding * 0.3] : [padding * 0.08, padding * 0.32]);
    context.lineCap = 'round';
    context.strokeRect(padding * 0.55, padding * 0.55, width - padding * 1.1, height - padding * 0.55 - bottom);
    context.setLineDash([]);
  }
  if (frame.type === 'bevel') {
    context.strokeStyle = '#ffffff88';
    context.lineWidth = Math.max(1, padding * 0.12);
    context.beginPath();
    context.moveTo(0, height); context.lineTo(0, 0); context.lineTo(width, 0);
    context.stroke();
    context.strokeStyle = '#00000066';
    context.beginPath();
    context.moveTo(width, 0); context.lineTo(width, height); context.lineTo(0, height);
    context.stroke();
  }
  if (frame.type === 'corners') {
    context.strokeStyle = frame.color === '#ffffff' ? '#171020' : '#ffffff';
    context.lineWidth = Math.max(1.5, padding * 0.14);
    const length = padding * 1.4;
    for (const [x, y, dx, dy] of [[padding * 0.4, padding * 0.4, 1, 1], [width - padding * 0.4, padding * 0.4, -1, 1], [padding * 0.4, height - bottom + padding * 0.4, 1, -1], [width - padding * 0.4, height - bottom + padding * 0.4, -1, -1]]) {
      context.beginPath();
      context.moveTo(x + dx * length, y); context.lineTo(x, y); context.lineTo(x, y + dy * length);
      context.stroke();
    }
  }
  if (frame.type === 'ticket') {
    context.globalCompositeOperation = 'destination-out';
    const radius = padding * 0.42;
    for (const x of [padding, width - padding]) {
      context.beginPath(); context.arc(x, height / 2, radius, 0, Math.PI * 2); context.fill();
    }
    context.globalCompositeOperation = 'source-over';
    context.strokeStyle = '#ffffff88';
    context.setLineDash([padding * 0.25, padding * 0.25]);
    context.beginPath(); context.moveTo(padding * 1.2, height / 2); context.lineTo(width - padding * 1.2, height / 2); context.stroke();
    context.setLineDash([]);
  }
  if (frame.type === 'stamp') {
    context.globalCompositeOperation = 'destination-out';
    const radius = padding * 0.24;
    const step = radius * 2.6;
    for (let x = step / 2; x < width; x += step) {
      context.beginPath(); context.arc(x, 0, radius, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.arc(x, height, radius, 0, Math.PI * 2); context.fill();
    }
    for (let y = step / 2; y < height; y += step) {
      context.beginPath(); context.arc(0, y, radius, 0, Math.PI * 2); context.fill();
      context.beginPath(); context.arc(width, y, radius, 0, Math.PI * 2); context.fill();
    }
    context.globalCompositeOperation = 'source-over';
  }
  if (frame.type === 'tape') {
    context.save();
    context.fillStyle = '#f4d38d99';
    const tapeWidth = padding * 3.2, tapeHeight = padding * 0.9;
    for (const [x, y, angle] of [[padding, padding, -0.6], [width - padding, padding, 0.6], [padding, height - bottom, 0.6], [width - padding, height - bottom, -0.6]]) {
      context.save(); context.translate(x, y); context.rotate(angle); context.fillRect(-tapeWidth / 2, -tapeHeight / 2, tapeWidth, tapeHeight); context.restore();
    }
    context.restore();
  }
  if (frame.type === 'hearts' || frame.type === 'stars') {
    const random = randomGenerator(frame.type === 'hearts' ? 14 : 44);
    context.fillStyle = frame.type === 'hearts' ? '#f1acd0' : '#f4d38d';
    for (let index = 0; index < 28; index++) {
      const x = random() * width;
      const y = random() < 0.5 ? random() * padding : height - random() * bottom;
      context.save(); context.translate(x, y);
      if (frame.type === 'hearts') heart(context, Math.max(2, padding * 0.28));
      else star(context, 0, 0, Math.max(1.5, padding * 0.16), context.fillStyle, 5);
      context.restore();
    }
  }
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
