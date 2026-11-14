import { LIMITS } from './constants.js';
import { outputSize } from './geometry.js';
import { renderImage } from './render.js';
import { makeCanvas } from './utils.js';

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
