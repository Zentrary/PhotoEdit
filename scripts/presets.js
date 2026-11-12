export const categories = [
  { id: 'all', name: 'ทั้งหมด', icon: 'grid' },
  { id: 'film', name: '90s Film', icon: 'film' },
  { id: 'y2k', name: 'Y2K / 2000s', icon: 'sparkles' },
  { id: 'cinematic', name: 'Cinematic', icon: 'clapper' },
  { id: 'dreamy', name: 'Dreamy', icon: 'cloud' },
  { id: 'retro', name: 'Retro', icon: 'radio' },
  { id: 'mono', name: 'Black & White', icon: 'contrast' },
  { id: 'cosmic', name: 'Cosmic', icon: 'orbit' },
  { id: 'everyday', name: 'Everyday', icon: 'sun' }
];

const p = (id, name, category, description, values) => ({ id, name, category, description, values });
export const presets = [
  p('warm-disposable', 'Warm Disposable', 'film', 'แสงอุ่นและสีซีดจาง เหมือนภาพจากกล้องฟิล์มใช้แล้วทิ้ง', { brightness: 106, contrast: 91, saturation: 87, warmth: 24, fade: 13, grain: 19, vignette: 14 }),
  p('grain-1994', 'Grain 1994', 'film', 'เกรนละเอียด เงาลึก และสีเหลืองอ่อนแบบภาพยุค 90', { contrast: 112, saturation: 82, warmth: 15, grain: 35, vignette: 20, fade: 7 }),
  p('faded-memory', 'Faded Memory', 'film', 'สีนุ่มและเงายกสูง ให้บรรยากาศความทรงจำเก่า ๆ', { brightness: 108, contrast: 82, saturation: 76, warmth: 10, fade: 25, grain: 12 }),
  p('golden-roll', 'Golden Roll', 'film', 'ไฮไลต์สีทองและโทนผิวอุ่นสำหรับวันแดด สดใส', { brightness: 104, contrast: 104, saturation: 105, warmth: 32, grain: 12, leak: 18 }),
  p('supermarket-97', 'Supermarket 97', 'film', 'สีเขียวอมฟ้าและคอนทราสต์สูงแบบฟิล์มสแกน', { contrast: 117, saturation: 112, warmth: -9, tint: 9, grain: 18, vignette: 12 }),
  p('chrome-flash', 'Chrome Flash', 'y2k', 'แฟลชสว่าง สีสด และประกายเงินสไตล์ Y2K', { brightness: 113, contrast: 121, saturation: 117, warmth: -15, glow: 15, sparkle: 12 }),
  p('cyber-pink', 'Cyber Pink', 'y2k', 'โทนชมพูไซเบอร์กับเงาอมม่วง', { contrast: 114, saturation: 125, tint: 30, hue: -12, glow: 12, sparkle: 8 }),
  p('early-digicam', 'Early Digicam', 'y2k', 'สีเข้มและแสงแข็ง เหมือนภาพกล้องดิจิทัลยุคแรก', { brightness: 107, contrast: 128, saturation: 93, warmth: -7, grain: 15, vignette: 17 }),
  p('iced-silver', 'Iced Silver', 'y2k', 'โทนเงินเย็นwithความอิ่มสีต่ำและแสงฟุ้ง', { brightness: 109, contrast: 108, saturation: 58, warmth: -28, glow: 19 }),
  p('bubblegum-pop', 'Bubblegum Pop', 'y2k', 'ชมพูหวาน สดใส และขี้เล่นแบบนิตยสารปี 2000', { brightness: 111, contrast: 105, saturation: 132, tint: 22, warmth: 8, sparkle: 17 }),
  p('teal-orange', 'Teal & Orange', 'cinematic', 'เงาอมฟ้าตัดแสงอุ่น ให้บรรยากาศแบบภาพยนตร์', { contrast: 119, saturation: 108, warmth: 19, tint: -15, vignette: 27, fade: 5 }),
  p('midnight-blue', 'Midnight Blue', 'cinematic', 'ภาพกลางคืนสีน้ำเงินเข้มและแสงนุ่ม', { brightness: 89, contrast: 117, saturation: 81, warmth: -34, tint: -8, vignette: 32 }),
  p('neo-noir', 'Neo Noir', 'cinematic', 'คอนทราสต์จัดและสีต่ำสำหรับภาพดราม่า', { brightness: 94, contrast: 139, saturation: 49, warmth: -12, vignette: 37, grain: 12 }),
  p('desert-cinema', 'Desert Cinema', 'cinematic', 'โทนทรายและน้ำตาลอบอุ่นแบบภาพยนตร์', { contrast: 112, saturation: 79, warmth: 29, sepia: 18, fade: 10, vignette: 18 }),
  p('green-room', 'Green Room', 'cinematic', 'เงาเขียวสุขุมกับไฮไลต์ครีม', { contrast: 113, saturation: 88, tint: -22, warmth: 9, fade: 9, grain: 9 }),
  p('soft-glow', 'Soft Glow', 'dreamy', 'แสงฟุ้งละมุน ลดคอนทราสต์เพื่อภาพชวนฝัน', { brightness: 109, contrast: 90, saturation: 92, glow: 38, fade: 10 }),
  p('pastel-haze', 'Pastel Haze', 'dreamy', 'สีพาสเทลหมอกบางและไฮไลต์นุ่ม', { brightness: 112, contrast: 82, saturation: 73, tint: 12, glow: 22, fade: 21 }),
  p('moonlight', 'Moonlight', 'dreamy', 'แสงจันทร์สีฟ้าเย็นกับประกายดาวจาง ๆ', { brightness: 98, contrast: 103, saturation: 76, warmth: -29, glow: 20, sparkle: 22 }),
  p('lavender-dream', 'Lavender Dream', 'dreamy', 'ลาเวนเดอร์อ่อน ๆ และแสงเรืองนุ่ม', { brightness: 108, contrast: 91, saturation: 88, tint: 24, glow: 26, fade: 12 }),
  p('cloud-nine', 'Cloud Nine', 'dreamy', 'ภาพสว่างโปร่งคล้ายความฝันในก้อนเมฆ', { brightness: 117, contrast: 83, saturation: 84, warmth: 5, glow: 31, fade: 19 }),
  p('vhs-tape', 'VHS Tape', 'retro', 'สีเลื่อนเส้นวิดีโอ และเกรนแบบเทป VHS', { contrast: 117, saturation: 119, warmth: -8, scanlines: 33, chromatic: 35, grain: 21, vignette: 18 }),
  p('old-print', 'Old Print', 'retro', 'สีซีเปียและฝุ่นเบา ๆ เหมือนสิ่งพิมพ์เก่า', { saturation: 44, sepia: 49, warmth: 18, contrast: 92, fade: 17, grain: 24, dust: 28 }),
  p('polaroid-day', 'Polaroid Day', 'retro', 'ภาพ สำเร็จรูป โทนครีมและเงาอมเขียว', { brightness: 108, contrast: 89, saturation: 83, warmth: 14, tint: -8, fade: 18, vignette: 12 }),
  p('retro-postcard', 'Retro Postcard', 'retro', 'สีสดแบบโปสการ์ดวินเทจพร้อมรอยเวลา', { contrast: 116, saturation: 124, warmth: 21, fade: 7, grain: 14, dust: 14 }),
  p('analog-sunset', 'Analog Sunset', 'retro', 'แสงรั่วสีส้มและสีอนาล็อกอบอุ่น', { brightness: 104, contrast: 105, saturation: 107, warmth: 25, leak: 43, grain: 17 }),
  p('classic-mono', 'Classic Mono', 'mono', 'ขาวดำคลาสสิกกับโทนสีสมดุล', { grayscale: 100, contrast: 110, brightness: 103, grain: 7 }),
  p('silver-grain', 'Silver Grain', 'mono', 'ขาวดำเงินเกรนละเอียดแบบฟิล์ม', { grayscale: 100, contrast: 98, brightness: 106, fade: 10, grain: 33 }),
  p('high-contrast', 'High Contrast', 'mono', 'ดำลึกขาวจัดสำหรับภาพกราฟิก', { grayscale: 100, contrast: 151, brightness: 99, vignette: 15 }),
  p('soft-monochrome', 'Soft Monochrome', 'mono', 'ขาวดำคอนทราสต์ต่ำและผิวนุ่ม', { grayscale: 100, contrast: 83, brightness: 110, fade: 15, glow: 13 }),
  p('charcoal', 'Charcoal', 'mono', 'โทนถ่านเข้มwithเงาหนักและขอบมืด', { grayscale: 100, brightness: 91, contrast: 127, vignette: 34, grain: 15 }),
  p('nebula-tint', 'Nebula Tint', 'cosmic', 'เนบิวลาม่วงอมชมพูและแสงฟุ้งทั่วภาพ', { contrast: 111, saturation: 114, tint: 29, warmth: -12, glow: 22, leak: 17, sparkle: 14 }),
  p('aurora-glow', 'Aurora Glow', 'cosmic', 'แสงออโรราฟ้าเขียวกับประกายดาว', { contrast: 113, saturation: 121, tint: -28, warmth: -18, glow: 22, sparkle: 23 }),
  p('stardust', 'Stardust', 'cosmic', 'ละอองดาวสีเงินบนภาพโทนเย็น', { brightness: 105, contrast: 105, saturation: 78, warmth: -17, sparkle: 48, grain: 11, glow: 13 }),
  p('lunar-dust', 'Lunar Dust', 'cosmic', 'พื้นผิวดวงจันทร์สีเทาเย็นและเกรนละเอียด', { grayscale: 65, contrast: 122, warmth: -18, grain: 26, vignette: 24, dust: 12 }),
  p('deep-space', 'Deep Space', 'cosmic', 'อวกาศลึกสีดำม่วงและดาวสว่าง', { brightness: 88, contrast: 132, saturation: 91, tint: 17, warmth: -22, vignette: 39, sparkle: 34 }),
  p('natural-pop', 'Natural Pop', 'everyday', 'เพิ่มชีวิตชีวาโดยยังคงสีธรรมชาติ', { brightness: 103, contrast: 107, saturation: 112, warmth: 3 }),
  p('soft-portrait', 'Soft Portrait', 'everyday', 'แสงนุ่มและสีอ่อนสำหรับภาพบุคคล', { brightness: 106, contrast: 94, saturation: 94, warmth: 7, glow: 13 }),
  p('clean-vivid', 'Clean Vivid', 'everyday', 'ภาพใสคมและสีสดกำลังดี', { brightness: 104, contrast: 114, saturation: 119, warmth: -3 }),
  p('golden-hour', 'Golden Hour', 'everyday', 'เติมแสงสีทองให้ทุกวันดูอบอุ่น', { brightness: 107, contrast: 103, saturation: 108, warmth: 26, leak: 12 }),
  p('fresh-air', 'Fresh Air', 'everyday', 'โทนเย็นสะอาดและแสงสว่างโปร่ง', { brightness: 108, contrast: 104, saturation: 103, warmth: -13, tint: -5, fade: 4 })
];

export const neutral = { brightness: 100, contrast: 100, saturation: 100, warmth: 0, tint: 0, hue: 0, sepia: 0, grayscale: 0, fade: 0, vignette: 0, grain: 0, glow: 0, scanlines: 0, chromatic: 0, dust: 0, leak: 0, sparkle: 0, blur: 0 };
export const adjustmentKeys = ['brightness', 'contrast', 'saturation', 'warmth', 'tint', 'hue', 'fade', 'blur'];
export const effectKeys = ['grain', 'vignette', 'glow', 'scanlines', 'chromatic', 'dust', 'leak', 'sparkle'];
export const getPreset = id => presets.find(preset => preset.id === id);
export function resolveValues(state) {
  const preset = getPreset(state.preset);
  const strength = state.presetStrength / 100;
  const values = { ...neutral };
  if (preset) {
    for (const [key, value] of Object.entries(preset.values)) values[key] = ['brightness', 'contrast', 'saturation'].includes(key) ? 100 + (value - 100) * strength : value * strength;
  }
  for (const key of adjustmentKeys) {
    if (['brightness', 'contrast', 'saturation'].includes(key)) values[key] *= state.adjustments[key] / 100;
    else values[key] += state.adjustments[key];
  }
  for (const key of effectKeys) values[key] = state.effects[key];
  return values;
}
