import { makeCanvas } from './utils.js';
import { heart, star } from './draw.js';

export function drawStrokes(context, strokes, width, height) {
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

export function drawSticker(context, type, size, color) {
  if (type.startsWith('emoji:')) {
    context.save();
    context.font = `${size * 0.9}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillText(type.slice(6), 0, size * 0.04);
    context.restore();
    return;
  }
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
  } else if (type === 'sun') {
    context.beginPath(); context.arc(0, 0, size * 0.28, 0, Math.PI * 2); context.fill();
    for (let index = 0; index < 8; index++) { const angle = index * Math.PI / 4; context.beginPath(); context.moveTo(Math.cos(angle) * size * 0.36, Math.sin(angle) * size * 0.36); context.lineTo(Math.cos(angle) * size * 0.5, Math.sin(angle) * size * 0.5); context.stroke(); }
  } else if (type === 'cloud') {
    context.beginPath(); context.arc(-size * 0.2, 0, size * 0.2, 0, Math.PI * 2); context.arc(0, -size * 0.12, size * 0.26, 0, Math.PI * 2); context.arc(size * 0.22, 0, size * 0.18, 0, Math.PI * 2); context.fill();
  } else if (type === 'rainbow') {
    const palette = ['#ef8d79', '#f4d38d', '#a4d5a2', '#a5d8e6', '#c4a0f5'];
    palette.forEach((shade, index) => { context.strokeStyle = shade; context.beginPath(); context.arc(0, size * 0.2, size * (0.46 - index * 0.08), Math.PI, 0); context.stroke(); });
  } else if (type === 'rocket') {
    context.beginPath(); context.moveTo(0, -size * 0.5); context.quadraticCurveTo(size * 0.28, -size * 0.1, size * 0.16, size * 0.3); context.lineTo(-size * 0.16, size * 0.3); context.quadraticCurveTo(-size * 0.28, -size * 0.1, 0, -size * 0.5); context.fill();
    context.fillStyle = '#ffffffaa'; context.beginPath(); context.arc(0, -size * 0.1, size * 0.09, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#f4d38d'; context.beginPath(); context.moveTo(-size * 0.1, size * 0.32); context.lineTo(0, size * 0.52); context.lineTo(size * 0.1, size * 0.32); context.fill();
  } else if (type === 'ufo') {
    context.beginPath(); context.ellipse(0, size * 0.08, size * 0.48, size * 0.16, 0, 0, Math.PI * 2); context.fill();
    context.fillStyle = '#ffffff99'; context.beginPath(); context.arc(0, -size * 0.06, size * 0.22, Math.PI, 0); context.fill();
  } else if (type === 'comet') {
    context.beginPath(); context.arc(size * 0.2, -size * 0.2, size * 0.16, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.moveTo(size * 0.08, -size * 0.08); context.lineTo(-size * 0.5, size * 0.5); context.lineTo(-size * 0.1, size * 0.12); context.fill();
  } else if (type === 'crown') {
    context.beginPath(); context.moveTo(-size * 0.42, size * 0.28); context.lineTo(-size * 0.34, -size * 0.24); context.lineTo(-size * 0.12, 0); context.lineTo(0, -size * 0.34); context.lineTo(size * 0.12, 0); context.lineTo(size * 0.34, -size * 0.24); context.lineTo(size * 0.42, size * 0.28); context.closePath(); context.fill();
  } else if (type === 'camera') {
    context.beginPath(); context.roundRect(-size * 0.44, -size * 0.24, size * 0.88, size * 0.56, size * 0.08); context.fill();
    context.fillStyle = '#241b38'; context.beginPath(); context.arc(0, size * 0.04, size * 0.18, 0, Math.PI * 2); context.fill();
    context.fillStyle = color; context.fillRect(-size * 0.18, -size * 0.36, size * 0.3, size * 0.12);
  } else if (type === 'cassette') {
    context.beginPath(); context.roundRect(-size * 0.46, -size * 0.3, size * 0.92, size * 0.6, size * 0.06); context.fill();
    context.fillStyle = '#241b38'; for (const side of [-1, 1]) { context.beginPath(); context.arc(side * size * 0.2, 0, size * 0.11, 0, Math.PI * 2); context.fill(); }
  } else if (type === 'floppy') {
    context.beginPath(); context.roundRect(-size * 0.4, -size * 0.42, size * 0.8, size * 0.84, size * 0.05); context.fill();
    context.fillStyle = '#241b38'; context.fillRect(-size * 0.22, -size * 0.42, size * 0.44, size * 0.24); context.fillRect(-size * 0.26, size * 0.06, size * 0.52, size * 0.3);
  } else if (type === 'gamepad') {
    context.beginPath(); context.roundRect(-size * 0.46, -size * 0.22, size * 0.92, size * 0.46, size * 0.2); context.fill();
    context.fillStyle = '#241b38'; context.fillRect(-size * 0.3, -size * 0.04, size * 0.2, size * 0.06); context.fillRect(-size * 0.23, -size * 0.11, size * 0.06, size * 0.2);
    for (const side of [1, 1.6]) { context.beginPath(); context.arc(size * 0.16 * side, size * 0.02, size * 0.045, 0, Math.PI * 2); context.fill(); }
  } else if (type === 'gift') {
    context.fillRect(-size * 0.36, -size * 0.1, size * 0.72, size * 0.5); context.fillRect(-size * 0.42, -size * 0.24, size * 0.84, size * 0.14);
    context.fillStyle = '#ffffffaa'; context.fillRect(-size * 0.05, -size * 0.24, size * 0.1, size * 0.64);
    context.strokeStyle = color; context.beginPath(); context.arc(-size * 0.12, -size * 0.32, size * 0.12, 0, Math.PI * 2); context.arc(size * 0.12, -size * 0.32, size * 0.12, 0, Math.PI * 2); context.stroke();
  } else if (type === 'balloon') {
    context.beginPath(); context.ellipse(0, -size * 0.12, size * 0.28, size * 0.34, 0, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.moveTo(0, size * 0.22); context.quadraticCurveTo(size * 0.12, size * 0.36, 0, size * 0.5); context.stroke();
  } else if (type === 'cake') {
    context.fillRect(-size * 0.36, -size * 0.05, size * 0.72, size * 0.42);
    context.beginPath(); context.moveTo(-size * 0.36, -size * 0.05); context.quadraticCurveTo(0, -size * 0.3, size * 0.36, -size * 0.05); context.fill();
    context.fillStyle = '#f4d38d'; context.fillRect(-size * 0.03, -size * 0.42, size * 0.06, size * 0.2);
  } else if (type === 'icecream') {
    context.beginPath(); context.moveTo(-size * 0.22, 0); context.lineTo(0, size * 0.5); context.lineTo(size * 0.22, 0); context.fill();
    context.fillStyle = '#f1acd0'; context.beginPath(); context.arc(0, -size * 0.12, size * 0.26, 0, Math.PI * 2); context.fill();
  } else if (type === 'coffee') {
    context.beginPath(); context.roundRect(-size * 0.3, -size * 0.2, size * 0.56, size * 0.56, size * 0.06); context.fill();
    context.beginPath(); context.arc(size * 0.3, size * 0.02, size * 0.16, -Math.PI / 2, Math.PI / 2); context.stroke();
    context.beginPath(); context.moveTo(-size * 0.14, -size * 0.34); context.quadraticCurveTo(-size * 0.04, -size * 0.44, -size * 0.14, -size * 0.52); context.stroke();
  } else if (type === 'pizza') {
    context.beginPath(); context.moveTo(0, size * 0.48); context.lineTo(-size * 0.4, -size * 0.32); context.quadraticCurveTo(0, -size * 0.5, size * 0.4, -size * 0.32); context.closePath(); context.fill();
    context.fillStyle = '#ef8d79'; for (const [x, y] of [[-0.12, -0.12], [0.14, -0.06], [0, 0.16]]) { context.beginPath(); context.arc(x * size, y * size, size * 0.06, 0, Math.PI * 2); context.fill(); }
  } else if (type === 'strawberry') {
    context.beginPath(); context.moveTo(0, size * 0.46); context.bezierCurveTo(-size * 0.44, size * 0.1, -size * 0.3, -size * 0.3, 0, -size * 0.22); context.bezierCurveTo(size * 0.3, -size * 0.3, size * 0.44, size * 0.1, 0, size * 0.46); context.fill();
    context.fillStyle = '#a4d5a2'; context.beginPath(); context.moveTo(-size * 0.18, -size * 0.28); context.lineTo(0, -size * 0.46); context.lineTo(size * 0.18, -size * 0.28); context.fill();
  } else if (type === 'leaf') {
    context.beginPath(); context.moveTo(-size * 0.4, size * 0.4); context.quadraticCurveTo(-size * 0.4, -size * 0.4, size * 0.4, -size * 0.4); context.quadraticCurveTo(size * 0.4, size * 0.4, -size * 0.4, size * 0.4); context.fill();
    context.strokeStyle = '#ffffff99'; context.beginPath(); context.moveTo(-size * 0.32, size * 0.32); context.lineTo(size * 0.3, -size * 0.3); context.stroke();
  } else if (type === 'cactus') {
    context.beginPath(); context.roundRect(-size * 0.12, -size * 0.44, size * 0.24, size * 0.88, size * 0.12); context.fill();
    context.beginPath(); context.roundRect(-size * 0.36, -size * 0.1, size * 0.16, size * 0.34, size * 0.08); context.fill();
    context.beginPath(); context.roundRect(size * 0.2, -size * 0.24, size * 0.16, size * 0.34, size * 0.08); context.fill();
  } else if (type === 'paw') {
    context.beginPath(); context.ellipse(0, size * 0.14, size * 0.24, size * 0.2, 0, 0, Math.PI * 2); context.fill();
    for (const [x, y] of [[-0.26, -0.12], [-0.09, -0.28], [0.09, -0.28], [0.26, -0.12]]) { context.beginPath(); context.arc(x * size, y * size, size * 0.09, 0, Math.PI * 2); context.fill(); }
  } else if (type === 'peace') {
    context.beginPath(); context.arc(0, 0, size * 0.44, 0, Math.PI * 2); context.stroke();
    context.beginPath(); context.moveTo(0, -size * 0.44); context.lineTo(0, size * 0.44); context.moveTo(0, 0); context.lineTo(-size * 0.3, size * 0.3); context.moveTo(0, 0); context.lineTo(size * 0.3, size * 0.3); context.stroke();
  } else if (type === 'fire') {
    context.beginPath(); context.moveTo(0, size * 0.48); context.bezierCurveTo(-size * 0.44, size * 0.2, -size * 0.2, -size * 0.16, 0, -size * 0.5); context.bezierCurveTo(size * 0.08, -size * 0.18, size * 0.44, -size * 0.02, size * 0.3, size * 0.24); context.quadraticCurveTo(size * 0.2, size * 0.48, 0, size * 0.48); context.fill();
  } else if (type === 'drop') {
    context.beginPath(); context.moveTo(0, -size * 0.48); context.bezierCurveTo(size * 0.4, 0, size * 0.3, size * 0.44, 0, size * 0.44); context.bezierCurveTo(-size * 0.3, size * 0.44, -size * 0.4, 0, 0, -size * 0.48); context.fill();
  } else if (type === 'snowflake') {
    for (let index = 0; index < 6; index++) { const angle = index * Math.PI / 3; context.save(); context.rotate(angle); context.beginPath(); context.moveTo(0, 0); context.lineTo(0, -size * 0.46); context.moveTo(0, -size * 0.28); context.lineTo(-size * 0.12, -size * 0.38); context.moveTo(0, -size * 0.28); context.lineTo(size * 0.12, -size * 0.38); context.stroke(); context.restore(); }
  } else if (type === 'mountain') {
    context.beginPath(); context.moveTo(-size * 0.5, size * 0.34); context.lineTo(-size * 0.12, -size * 0.34); context.lineTo(size * 0.1, 0); context.lineTo(size * 0.26, -size * 0.2); context.lineTo(size * 0.5, size * 0.34); context.closePath(); context.fill();
    context.fillStyle = '#ffffffaa'; context.beginPath(); context.moveTo(-size * 0.12, -size * 0.34); context.lineTo(-size * 0.02, -size * 0.16); context.lineTo(-size * 0.2, -size * 0.16); context.fill();
  } else if (type === 'wave') {
    context.beginPath(); context.moveTo(-size * 0.5, size * 0.1); context.quadraticCurveTo(-size * 0.25, -size * 0.3, 0, size * 0.1); context.quadraticCurveTo(size * 0.25, size * 0.5, size * 0.5, size * 0.1); context.stroke();
    context.beginPath(); context.moveTo(-size * 0.5, size * 0.32); context.quadraticCurveTo(-size * 0.25, -size * 0.08, 0, size * 0.32); context.quadraticCurveTo(size * 0.25, size * 0.72, size * 0.5, size * 0.32); context.stroke();
  } else if (type === 'shell') {
    context.beginPath(); context.arc(0, size * 0.1, size * 0.42, Math.PI, 0); context.lineTo(0, size * 0.42); context.closePath(); context.fill();
    context.strokeStyle = '#ffffff99'; for (const x of [-0.24, -0.08, 0.08, 0.24]) { context.beginPath(); context.moveTo(0, size * 0.4); context.lineTo(x * size, -size * 0.22); context.stroke(); }
  } else if (type === 'clover') {
    for (const [x, y] of [[-0.18,-0.18],[0.18,-0.18],[-0.18,0.18],[0.18,0.18]]) { context.beginPath(); context.arc(x*size,y*size,size*0.2,0,Math.PI*2); context.fill(); }
  } else if (type === 'mushroom') {
    context.beginPath(); context.arc(0,0,size*0.44,Math.PI,0); context.fill(); context.fillRect(-size*0.12,0,size*0.24,size*0.42);
  } else if (type === 'ghost') {
    context.beginPath(); context.arc(0,-size*0.1,size*0.34,Math.PI,0); context.lineTo(size*0.34,size*0.4); context.quadraticCurveTo(0,size*0.2,-size*0.34,size*0.4); context.fill(); context.fillStyle='#241b38'; for(const x of [-0.12,0.12]){context.beginPath();context.arc(x*size,-size*0.1,size*0.045,0,Math.PI*2);context.fill();}
  } else if (type === 'alien') {
    context.beginPath(); context.ellipse(0,0,size*0.32,size*0.44,0,0,Math.PI*2); context.fill(); context.fillStyle='#241b38'; for(const x of [-0.13,0.13]){context.beginPath();context.ellipse(x*size,-size*0.05,size*0.07,size*0.12,x*2,0,Math.PI*2);context.fill();}
  } else if (type === 'eyes') {
    for(const x of [-0.22,0.22]){context.beginPath();context.ellipse(x*size,0,size*0.18,size*0.26,0,0,Math.PI*2);context.stroke();context.beginPath();context.arc(x*size,size*0.04,size*0.08,0,Math.PI*2);context.fill();}
  } else if (type === 'lips') {
    context.beginPath();context.moveTo(-size*0.45,0);context.quadraticCurveTo(-size*0.2,-size*0.3,0,-size*0.1);context.quadraticCurveTo(size*0.2,-size*0.3,size*0.45,0);context.quadraticCurveTo(0,size*0.45,-size*0.45,0);context.fill();
  } else if (type === 'speech') {
    context.beginPath();context.roundRect(-size*0.44,-size*0.32,size*0.88,size*0.56,size*0.12);context.fill();context.beginPath();context.moveTo(-size*0.1,size*0.22);context.lineTo(-size*0.2,size*0.46);context.lineTo(size*0.12,size*0.22);context.fill();
  } else if (type === 'umbrella') {
    context.beginPath();context.arc(0,0,size*0.44,Math.PI,0);context.fill();context.beginPath();context.moveTo(0,0);context.lineTo(0,size*0.36);context.arc(-size*0.1,size*0.36,size*0.1,0,Math.PI);context.stroke();
  } else if (type === 'palm') {
    context.beginPath();context.moveTo(0,size*0.46);context.quadraticCurveTo(size*0.08,0,0,-size*0.2);context.stroke();for(let i=0;i<5;i++){const a=Math.PI+i*Math.PI/4;context.beginPath();context.moveTo(0,-size*0.2);context.quadraticCurveTo(Math.cos(a)*size*0.3,-size*0.45,Math.cos(a)*size*0.46,-size*0.2+Math.sin(a)*size*0.2);context.stroke();}
  } else if (type === 'airplane') {
    context.beginPath();context.moveTo(0,-size*0.5);context.lineTo(size*0.1,-size*0.1);context.lineTo(size*0.48,size*0.12);context.lineTo(size*0.1,size*0.16);context.lineTo(size*0.08,size*0.42);context.lineTo(0,size*0.34);context.lineTo(-size*0.08,size*0.42);context.lineTo(-size*0.1,size*0.16);context.lineTo(-size*0.48,size*0.12);context.lineTo(-size*0.1,-size*0.1);context.closePath();context.fill();
  } else if (type === 'car') {
    context.beginPath();context.roundRect(-size*0.44,-size*0.05,size*0.88,size*0.3,size*0.08);context.fill();context.beginPath();context.moveTo(-size*0.28,-size*0.05);context.lineTo(-size*0.16,-size*0.28);context.lineTo(size*0.18,-size*0.28);context.lineTo(size*0.3,-size*0.05);context.fill();context.fillStyle='#241b38';for(const x of [-0.26,0.26]){context.beginPath();context.arc(x*size,size*0.26,size*0.1,0,Math.PI*2);context.fill();}
  } else if (type === 'bicycle') {
    for(const x of [-0.26,0.26]){context.beginPath();context.arc(x*size,size*0.18,size*0.2,0,Math.PI*2);context.stroke();}context.beginPath();context.moveTo(-size*0.26,size*0.18);context.lineTo(-size*0.06,-size*0.16);context.lineTo(size*0.14,size*0.18);context.lineTo(-size*0.26,size*0.18);context.moveTo(-size*0.06,-size*0.16);context.lineTo(size*0.2,-size*0.16);context.lineTo(size*0.26,size*0.18);context.stroke();
  } else if (type === 'sailboat') {
    context.beginPath();context.moveTo(-size*0.42,size*0.18);context.lineTo(size*0.42,size*0.18);context.lineTo(size*0.24,size*0.4);context.lineTo(-size*0.24,size*0.4);context.closePath();context.fill();context.beginPath();context.moveTo(0,-size*0.46);context.lineTo(0,size*0.12);context.lineTo(size*0.36,size*0.12);context.closePath();context.fill();
  } else if (type === 'anchor') {
    context.beginPath();context.arc(0,-size*0.32,size*0.1,0,Math.PI*2);context.stroke();context.beginPath();context.moveTo(0,-size*0.22);context.lineTo(0,size*0.4);context.moveTo(-size*0.2,-size*0.05);context.lineTo(size*0.2,-size*0.05);context.moveTo(-size*0.36,size*0.16);context.quadraticCurveTo(0,size*0.56,size*0.36,size*0.16);context.stroke();
  } else if (type === 'telescope') {
    context.save();context.rotate(-0.5);context.fillRect(-size*0.36,-size*0.12,size*0.72,size*0.22);context.restore();context.beginPath();context.moveTo(0,size*0.05);context.lineTo(-size*0.24,size*0.46);context.moveTo(0,size*0.05);context.lineTo(size*0.24,size*0.46);context.stroke();
  } else if (type === 'ring') {
    context.beginPath();context.arc(0,size*0.1,size*0.3,0,Math.PI*2);context.stroke();context.beginPath();context.moveTo(0,-size*0.46);context.lineTo(size*0.14,-size*0.28);context.lineTo(0,-size*0.14);context.lineTo(-size*0.14,-size*0.28);context.closePath();context.fill();
  } else if (type === 'lipstick') {
    context.fillRect(-size*0.16,0,size*0.32,size*0.42);context.beginPath();context.moveTo(-size*0.12,0);context.lineTo(-size*0.12,-size*0.34);context.lineTo(size*0.12,-size*0.46);context.lineTo(size*0.12,0);context.fill();
  } else if (type === 'palette') {
    context.beginPath();context.ellipse(0,0,size*0.44,size*0.36,0,0,Math.PI*2);context.fill();context.fillStyle='#241b38';for(const [x,y] of [[-0.2,-0.1],[0,-0.18],[0.2,-0.08],[0.16,0.14]]){context.beginPath();context.arc(x*size,y*size,size*0.055,0,Math.PI*2);context.fill();}
  } else if (type === 'book') {
    context.beginPath();context.roundRect(-size*0.36,-size*0.44,size*0.72,size*0.88,size*0.05);context.fill();context.strokeStyle='#ffffff99';context.beginPath();context.moveTo(-size*0.2,-size*0.44);context.lineTo(-size*0.2,size*0.44);context.stroke();
  } else if (type === 'letter') {
    context.beginPath();context.roundRect(-size*0.44,-size*0.3,size*0.88,size*0.6,size*0.05);context.fill();context.strokeStyle='#241b38';context.beginPath();context.moveTo(-size*0.42,-size*0.26);context.lineTo(0,size*0.06);context.lineTo(size*0.42,-size*0.26);context.stroke();
  } else if (type === 'phone') {
    context.beginPath();context.roundRect(-size*0.24,-size*0.46,size*0.48,size*0.92,size*0.08);context.fill();context.fillStyle='#241b38';context.fillRect(-size*0.17,-size*0.32,size*0.34,size*0.56);
  } else if (type === 'headphones') {
    context.beginPath();context.arc(0,0,size*0.36,Math.PI,0);context.stroke();context.fillRect(-size*0.44,0,size*0.18,size*0.32);context.fillRect(size*0.26,0,size*0.18,size*0.32);
  } else if (type === 'guitar') {
    context.beginPath();context.ellipse(0,size*0.2,size*0.26,size*0.3,0,0,Math.PI*2);context.fill();context.fillRect(-size*0.05,-size*0.46,size*0.1,size*0.5);context.fillStyle='#241b38';context.beginPath();context.arc(0,size*0.16,size*0.08,0,Math.PI*2);context.fill();
  } else if (type === 'dice') {
    context.beginPath();context.roundRect(-size*0.38,-size*0.38,size*0.76,size*0.76,size*0.1);context.fill();context.fillStyle='#241b38';for(const [x,y] of [[-0.18,-0.18],[0.18,-0.18],[0,0],[-0.18,0.18],[0.18,0.18]]){context.beginPath();context.arc(x*size,y*size,size*0.055,0,Math.PI*2);context.fill();}
  } else if (type === 'trophy') {
    context.beginPath();context.moveTo(-size*0.28,-size*0.4);context.lineTo(size*0.28,-size*0.4);context.lineTo(size*0.18,size*0.1);context.quadraticCurveTo(0,size*0.26,-size*0.18,size*0.1);context.closePath();context.fill();context.fillRect(-size*0.05,size*0.16,size*0.1,size*0.18);context.fillRect(-size*0.24,size*0.34,size*0.48,size*0.1);
  } else if (type === 'medal') {
    context.beginPath();context.moveTo(-size*0.24,-size*0.46);context.lineTo(0,-size*0.1);context.lineTo(size*0.24,-size*0.46);context.stroke();context.beginPath();context.arc(0,size*0.14,size*0.28,0,Math.PI*2);context.fill();
  } else if (type === 'soccer' || type === 'basketball') {
    context.beginPath();context.arc(0,0,size*0.43,0,Math.PI*2);context.stroke();context.beginPath();
    if(type==='soccer'){for(let i=0;i<5;i++){const a=i*Math.PI*2/5-Math.PI/2;const x=Math.cos(a)*size*0.16,y=Math.sin(a)*size*0.16;i?context.lineTo(x,y):context.moveTo(x,y);}context.closePath();context.stroke();}
    else {context.moveTo(-size*0.43,0);context.lineTo(size*0.43,0);context.moveTo(0,-size*0.43);context.lineTo(0,size*0.43);context.stroke();context.beginPath();context.arc(-size*0.5,0,size*0.35,-Math.PI/2,Math.PI/2);context.stroke();}
  } else if (type === 'dumbbell') {
    context.fillRect(-size*0.24,-size*0.06,size*0.48,size*0.12);for(const x of [-0.34,0.22]){context.fillRect(x*size,-size*0.28,size*0.12,size*0.56);}
  } else if (type === 'wand') {
    context.beginPath();context.moveTo(-size*0.36,size*0.42);context.lineTo(size*0.18,-size*0.12);context.stroke();star(context,size*0.24,-size*0.24,size*0.22,color,5);
  } else if (type === 'potion') {
    context.beginPath();context.moveTo(-size*0.1,-size*0.42);context.lineTo(size*0.1,-size*0.42);context.lineTo(size*0.1,-size*0.16);context.quadraticCurveTo(size*0.4,size*0.05,size*0.28,size*0.36);context.quadraticCurveTo(0,size*0.5,-size*0.28,size*0.36);context.quadraticCurveTo(-size*0.4,size*0.05,-size*0.1,-size*0.16);context.closePath();context.fill();
  } else if (type === 'key') {
    context.beginPath();context.arc(-size*0.2,-size*0.16,size*0.2,0,Math.PI*2);context.stroke();context.beginPath();context.moveTo(-size*0.06,0);context.lineTo(size*0.36,size*0.4);context.moveTo(size*0.2,size*0.24);context.lineTo(size*0.3,size*0.14);context.stroke();
  } else if (type === 'bulb') {
    context.beginPath();context.arc(0,-size*0.12,size*0.28,0,Math.PI*2);context.fill();context.fillRect(-size*0.12,size*0.12,size*0.24,size*0.26);
  } else if (type === 'candle') {
    context.fillRect(-size*0.14,-size*0.12,size*0.28,size*0.56);context.beginPath();context.ellipse(0,-size*0.3,size*0.09,size*0.16,0,0,Math.PI*2);context.fill();
  } else if (type === 'teddy') {
    for(const [x,y,r] of [[-0.24,-0.28,0.14],[0.24,-0.28,0.14],[0,-0.08,0.3],[0,0.28,0.24]]){context.beginPath();context.arc(x*size,y*size,size*r,0,Math.PI*2);context.fill();}context.fillStyle='#241b38';for(const x of [-0.1,0.1]){context.beginPath();context.arc(x*size,-size*0.12,size*0.035,0,Math.PI*2);context.fill();}
  } else if (type === 'bow') {
    context.beginPath();context.ellipse(-size*0.22,0,size*0.22,size*0.16,-0.3,0,Math.PI*2);context.ellipse(size*0.22,0,size*0.22,size*0.16,0.3,0,Math.PI*2);context.fill();context.beginPath();context.arc(0,0,size*0.09,0,Math.PI*2);context.fill();
  } else if (type === 'confetti') {
    for(let i=0;i<12;i++){const a=i*2.4,r=size*(0.15+(i%4)*0.1);context.save();context.translate(Math.cos(a)*r,Math.sin(a)*r);context.rotate(a);context.fillRect(-size*0.04,-size*0.02,size*0.08,size*0.04);context.restore();}
  } else if (type === 'firework') {
    for(let i=0;i<12;i++){const a=i*Math.PI/6;context.beginPath();context.moveTo(Math.cos(a)*size*0.14,Math.sin(a)*size*0.14);context.lineTo(Math.cos(a)*size*0.46,Math.sin(a)*size*0.46);context.stroke();}
  } else if (type === 'partyhat') {
    context.beginPath();context.moveTo(0,-size*0.46);context.lineTo(size*0.32,size*0.36);context.lineTo(-size*0.32,size*0.36);context.closePath();context.fill();context.fillStyle='#ffffffaa';context.beginPath();context.arc(0,-size*0.46,size*0.08,0,Math.PI*2);context.fill();
  } else if (type === 'crescent') {
    context.beginPath();context.arc(-size*0.1,0,size*0.36,Math.PI*0.25,Math.PI*1.75);context.quadraticCurveTo(-size*0.2,0,size*0.16,-size*0.25);context.fill();star(context,size*0.28,-size*0.22,size*0.12,color,5);
  } else if (type === 'music') {
    context.beginPath(); context.moveTo(-size * 0.2, size * 0.25); context.lineTo(-size * 0.2, -size * 0.35); context.lineTo(size * 0.3, -size * 0.45); context.lineTo(size * 0.3, size * 0.15); context.stroke();
    context.beginPath(); context.ellipse(-size * 0.3, size * 0.28, size * 0.14, size * 0.1, -0.3, 0, Math.PI * 2); context.fill();
    context.beginPath(); context.ellipse(size * 0.2, size * 0.18, size * 0.14, size * 0.1, -0.3, 0, Math.PI * 2); context.fill();
  }
}
