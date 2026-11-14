

export function star(context, x, y, radius, color, points = 4) {
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

export function heart(context, size) {
  context.beginPath();
  context.moveTo(0, size * 0.42);
  context.bezierCurveTo(-size * 0.7, 0, -size * 0.45, -size * 0.6, 0, -size * 0.22);
  context.bezierCurveTo(size * 0.45, -size * 0.6, size * 0.7, 0, 0, size * 0.42);
  context.fill();
}
