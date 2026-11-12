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

const families = {
  film: [
    ['Portra', 'โทนผิวอุ่นนุ่มแบบฟิล์มพอร์ตเทรต', { brightness: 105, contrast: 94, saturation: 92, warmth: 18, fade: 12, grain: 14 }],
    ['Gold 200', 'แสงสีทองและเกรนละเอียดแบบฟิล์มยอดนิยม', { brightness: 106, contrast: 105, saturation: 104, warmth: 28, grain: 20, leak: 10 }],
    ['Fuji Green', 'เงาเขียวอมฟ้าและไฮไลต์สะอาดแบบฟิล์มฟูจิ', { contrast: 110, saturation: 108, warmth: -8, tint: -14, grain: 12 }],
    ['Cinestill', 'แสงเรืองนุ่มและโทนเย็นแบบฟิล์มภาพยนตร์', { brightness: 103, contrast: 108, saturation: 96, warmth: -10, glow: 18, grain: 16 }],
    ['Expired Roll', 'สีเพี้ยนและฝุ่นเบา ๆ เหมือนฟิล์มหมดอายุ', { contrast: 96, saturation: 88, warmth: 12, tint: 16, fade: 20, grain: 28, dust: 18 }]
  ],
  y2k: [
    ['Digicam', 'แฟลชแข็งและสีสดแบบกล้องดิจิทัลยุค 2000', { brightness: 110, contrast: 124, saturation: 110, warmth: -6, grain: 12, vignette: 14 }],
    ['Cyber Chrome', 'ประกายเงินม่วงและแสงฟุ้งสไตล์ไซเบอร์', { contrast: 116, saturation: 118, tint: 24, glow: 20, sparkle: 16, chromatic: 12 }],
    ['Bubblegum', 'ชมพูหวานสดใสแบบนิตยสารวัยรุ่น', { brightness: 112, contrast: 104, saturation: 130, tint: 20, warmth: 8, sparkle: 12 }],
    ['Vaporwave', 'ม่วงชมพูอมฟ้าและเส้นสแกนแบบ vaporwave', { contrast: 112, saturation: 120, tint: 26, warmth: -14, scanlines: 18, chromatic: 20, glow: 14 }],
    ['Frosted Silver', 'เงินเย็นโปร่งแสงและสีอิ่มต่ำ', { brightness: 109, contrast: 106, saturation: 62, warmth: -26, glow: 22, sparkle: 10 }]
  ],
  cinematic: [
    ['Blockbuster', 'เงาฟ้าตัดแสงส้มแบบหนังฟอร์มยักษ์', { contrast: 120, saturation: 108, warmth: 20, tint: -16, vignette: 26 }],
    ['Noir Drama', 'คอนทราสต์จัดและสีต่ำสำหรับภาพดราม่า', { brightness: 95, contrast: 138, saturation: 52, warmth: -10, vignette: 34, grain: 12 }],
    ['Western', 'ทรายน้ำตาลและแสงอุ่นแบบหนังคาวบอย', { contrast: 114, saturation: 82, warmth: 30, sepia: 16, fade: 10, vignette: 20 }],
    ['Sci-Fi', 'โทนเหล็กเย็นและแสงเรืองแบบหนังไซไฟ', { brightness: 98, contrast: 118, saturation: 84, warmth: -24, tint: -10, glow: 16, chromatic: 10 }],
    ['Romance Film', 'แสงนุ่มสีอุ่นและเงายกสูงแบบหนังรัก', { brightness: 108, contrast: 92, saturation: 90, warmth: 14, fade: 16, glow: 20 }]
  ],
  dreamy: [
    ['Angel Soft', 'แสงฟุ้งขาวนุ่มเหมือนความฝัน', { brightness: 114, contrast: 84, saturation: 88, glow: 34, fade: 16 }],
    ['Cotton Candy', 'พาสเทลชมพูฟ้าหวานละมุน', { brightness: 110, contrast: 86, saturation: 80, tint: 16, warmth: -6, glow: 24, fade: 18 }],
    ['Lavender Mist', 'ลาเวนเดอร์หมอกบางและแสงเรือง', { brightness: 108, contrast: 90, saturation: 86, tint: 26, glow: 26, fade: 14, fog: 12 }],
    ['Moonlit', 'แสงจันทร์เย็นกับประกายดาวจาง ๆ', { brightness: 99, contrast: 104, saturation: 78, warmth: -28, glow: 22, sparkle: 20 }],
    ['Pearl', 'ขาวมุกโปร่งและผิวนุ่มเบาสบาย', { brightness: 112, contrast: 88, saturation: 76, warmth: 4, glow: 28, fade: 20 }]
  ],
  retro: [
    ['Seventies', 'สีน้ำตาลอุ่นและเกรนแบบยุค 70', { contrast: 108, saturation: 86, warmth: 24, sepia: 22, fade: 14, grain: 22 }],
    ['Eighties Neon', 'สีสดจัดและแสงนีออนแบบยุค 80', { contrast: 118, saturation: 128, tint: 18, warmth: -8, glow: 18, scanlines: 12 }],
    ['VHS Memory', 'สีเลื่อนและเส้นวิดีโอแบบเทปเก่า', { contrast: 116, saturation: 116, warmth: -8, scanlines: 30, chromatic: 32, grain: 20, glitch: 10 }],
    ['Instant Print', 'โทนครีมและเงาอมเขียวแบบภาพโพลารอยด์', { brightness: 107, contrast: 90, saturation: 84, warmth: 14, tint: -8, fade: 18, vignette: 12 }],
    ['Postcard', 'สีสดแบบโปสการ์ดวินเทจพร้อมรอยเวลา', { contrast: 114, saturation: 122, warmth: 20, fade: 8, grain: 14, dust: 16, scratches: 10 }]
  ],
  mono: [
    ['Ilford', 'ขาวดำเกรนละเอียดแบบฟิล์ม Ilford', { grayscale: 100, contrast: 112, brightness: 103, grain: 18 }],
    ['Platinum', 'ขาวดำโทนครีมอ่อนและคอนทราสต์นุ่ม', { grayscale: 100, contrast: 94, brightness: 108, sepia: 12, fade: 10 }],
    ['Deep Charcoal', 'ดำลึกเงาหนักและขอบมืด', { grayscale: 100, brightness: 92, contrast: 130, vignette: 32, grain: 14 }],
    ['Silver Gelatin', 'เงินเงางามและไฮไลต์นุ่มแบบอัดเงิน', { grayscale: 100, contrast: 102, brightness: 106, glow: 12, grain: 24 }],
    ['Street Noir', 'ขาวดำคอนทราสต์จัดสำหรับภาพสตรีท', { grayscale: 100, contrast: 142, brightness: 98, vignette: 20, grain: 20 }]
  ],
  cosmic: [
    ['Nebula', 'เนบิวลาม่วงชมพูและแสงฟุ้งทั่วภาพ', { contrast: 112, saturation: 116, tint: 28, warmth: -12, glow: 24, leak: 16, sparkle: 16 }],
    ['Aurora', 'แสงออโรราฟ้าเขียวกับประกายดาว', { contrast: 114, saturation: 122, tint: -28, warmth: -18, glow: 22, sparkle: 24 }],
    ['Lunar', 'พื้นผิวดวงจันทร์เทาเย็นและเกรนละเอียด', { grayscale: 60, contrast: 122, warmth: -18, grain: 24, vignette: 24, dust: 12 }],
    ['Mars Dust', 'ฝุ่นดาวอังคารสีส้มแดงและแสงรั่ว', { contrast: 116, saturation: 104, warmth: 30, tint: 8, leak: 24, dust: 20, vignette: 22 }],
    ['Deep Void', 'อวกาศลึกดำม่วงและดาวสว่าง', { brightness: 88, contrast: 134, saturation: 92, tint: 18, warmth: -22, vignette: 38, sparkle: 34 }]
  ],
  everyday: [
    ['Natural Light', 'เพิ่มชีวิตชีวาโดยยังคงสีธรรมชาติ', { brightness: 103, contrast: 106, saturation: 110, warmth: 3 }],
    ['Soft Portrait', 'แสงนุ่มและสีอ่อนสำหรับภาพบุคคล', { brightness: 106, contrast: 94, saturation: 94, warmth: 7, glow: 12 }],
    ['Travel Vivid', 'สีสดคมสำหรับภาพท่องเที่ยว', { brightness: 104, contrast: 112, saturation: 120, warmth: 2, vignette: 8 }],
    ['Food Warm', 'โทนอุ่นน่ากินสำหรับภาพอาหาร', { brightness: 106, contrast: 104, saturation: 112, warmth: 16, glow: 8 }],
    ['Street Clean', 'โทนสะอาดคอนทราสต์กำลังดีสำหรับภาพสตรีท', { brightness: 102, contrast: 110, saturation: 96, warmth: -4, vignette: 10 }]
  ]
};
const variants = [
  ['Soft', 'นุ่มละมุน', { brightness: 4, contrast: -8, saturation: -6, fade: 8, glow: 6 }],
  ['Classic', 'สมดุลคลาสสิก', {}],
  ['Deep', 'เข้มมีมิติ', { brightness: -4, contrast: 10, saturation: 6, vignette: 10, fade: -4 }],
  ['Airy', 'โปร่งเบา', { brightness: 7, contrast: -10, saturation: -10, fade: 12, glow: 8 }]
];
const extra = [];
for (const [category, list] of Object.entries(families)) {
  list.forEach(([family, description, values], familyIndex) => {
    variants.forEach(([variant, variantDescription, delta], variantIndex) => {
      const next = { ...values };
      for (const [key, amount] of Object.entries(delta)) next[key] = (next[key] || (['brightness', 'contrast', 'saturation'].includes(key) ? 100 : 0)) + amount;
      next.brightness = (next.brightness || 100) + familyIndex - 2;
      next.hue = (familyIndex - 2) * 2 + (variantIndex - 1.5) * 1.5;
      next.grain = (next.grain || 0) + variantIndex;
      const id = `${family.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${variant.toLowerCase()}`;
      extra.push(p(id, `${family} ${variant}`, category, `${description} · รุ่น${variantDescription}`, next));
    });
  });
}
for (const preset of extra) {
  for (const key of ['fade', 'grain', 'glow', 'leak', 'dust', 'sparkle', 'scanlines', 'chromatic', 'vignette', 'fog', 'glitch', 'scratches']) {
    if (preset.values[key] !== undefined) preset.values[key] = Math.max(0, preset.values[key]);
  }
}
export const presets = [
  p('warm-disposable', 'Warm Disposable', 'film', 'แสงอุ่นและสีซีดจาง เหมือนภาพจากกล้องฟิล์มใช้แล้วทิ้ง', { brightness: 106, contrast: 91, saturation: 87, warmth: 24, fade: 13, grain: 19, vignette: 14 }),
  p('grain-1994', 'Grain 1994', 'film', 'เกรนละเอียด เงาลึก และสีเหลืองอ่อนแบบภาพยุค 90', { contrast: 112, saturation: 82, warmth: 15, grain: 35, vignette: 20, fade: 7 }),
  p('faded-memory', 'Faded Memory', 'film', 'สีนุ่มและเงายกสูง ให้บรรยากาศความทรงจำเก่า ๆ', { brightness: 108, contrast: 82, saturation: 76, warmth: 10, fade: 25, grain: 12 }),
  p('golden-roll', 'Golden Roll', 'film', 'ไฮไลต์สีทองและโทนผิวอุ่นสำหรับวันแดดสดใส', { brightness: 104, contrast: 104, saturation: 105, warmth: 32, grain: 12, leak: 18 }),
  p('supermarket-97', 'Supermarket 97', 'film', 'สีเขียวอมฟ้าและคอนทราสต์สูงแบบฟิล์มสแกน', { contrast: 117, saturation: 112, warmth: -9, tint: 9, grain: 18, vignette: 12 }),
  p('chrome-flash', 'Chrome Flash', 'y2k', 'แฟลชสว่าง สีสด และประกายเงินสไตล์ Y2K', { brightness: 113, contrast: 121, saturation: 117, warmth: -15, glow: 15, sparkle: 12 }),
  p('cyber-pink', 'Cyber Pink', 'y2k', 'โทนชมพูไซเบอร์กับเงาอมม่วง', { contrast: 114, saturation: 125, tint: 30, hue: -12, glow: 12, sparkle: 8 }),
  p('early-digicam', 'Early Digicam', 'y2k', 'สีเข้มและแสงแข็ง เหมือนภาพกล้องดิจิทัลยุคแรก', { brightness: 107, contrast: 128, saturation: 93, warmth: -7, grain: 15, vignette: 17 }),
  p('iced-silver', 'Iced Silver', 'y2k', 'โทนเงินเย็นกับความอิ่มสีต่ำและแสงฟุ้ง', { brightness: 109, contrast: 108, saturation: 58, warmth: -28, glow: 19 }),
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
  p('polaroid-day', 'Polaroid Day', 'retro', 'ภาพโพลารอยด์โทนครีมและเงาอมเขียว', { brightness: 108, contrast: 89, saturation: 83, warmth: 14, tint: -8, fade: 18, vignette: 12 }),
  p('retro-postcard', 'Retro Postcard', 'retro', 'สีสดแบบโปสการ์ดวินเทจพร้อมรอยเวลา', { contrast: 116, saturation: 124, warmth: 21, fade: 7, grain: 14, dust: 14 }),
  p('analog-sunset', 'Analog Sunset', 'retro', 'แสงรั่วสีส้มและสีอนาล็อกอบอุ่น', { brightness: 104, contrast: 105, saturation: 107, warmth: 25, leak: 43, grain: 17 }),
  p('classic-mono', 'Classic Mono', 'mono', 'ขาวดำคลาสสิกกับโทนสีสมดุล', { grayscale: 100, contrast: 110, brightness: 103, grain: 7 }),
  p('silver-grain', 'Silver Grain', 'mono', 'ขาวดำเงินเกรนละเอียดแบบฟิล์ม', { grayscale: 100, contrast: 98, brightness: 106, fade: 10, grain: 33 }),
  p('high-contrast', 'High Contrast', 'mono', 'ดำลึกขาวจัดสำหรับภาพกราฟิก', { grayscale: 100, contrast: 151, brightness: 99, vignette: 15 }),
  p('soft-monochrome', 'Soft Monochrome', 'mono', 'ขาวดำคอนทราสต์ต่ำและผิวนุ่ม', { grayscale: 100, contrast: 83, brightness: 110, fade: 15, glow: 13 }),
  p('charcoal', 'Charcoal', 'mono', 'โทนถ่านเข้มกับเงาหนักและขอบมืด', { grayscale: 100, brightness: 91, contrast: 127, vignette: 34, grain: 15 }),
  p('nebula-tint', 'Nebula Tint', 'cosmic', 'เนบิวลาม่วงอมชมพูและแสงฟุ้งทั่วภาพ', { contrast: 111, saturation: 114, tint: 29, warmth: -12, glow: 22, leak: 17, sparkle: 14 }),
  p('aurora-glow', 'Aurora Glow', 'cosmic', 'แสงออโรราฟ้าเขียวกับประกายดาว', { contrast: 113, saturation: 121, tint: -28, warmth: -18, glow: 22, sparkle: 23 }),
  p('stardust', 'Stardust', 'cosmic', 'ละอองดาวสีเงินบนภาพโทนเย็น', { brightness: 105, contrast: 105, saturation: 78, warmth: -17, sparkle: 48, grain: 11, glow: 13 }),
  p('lunar-dust', 'Lunar Dust', 'cosmic', 'พื้นผิวดวงจันทร์สีเทาเย็นและเกรนละเอียด', { grayscale: 65, contrast: 122, warmth: -18, grain: 26, vignette: 24, dust: 12 }),
  p('deep-space', 'Deep Space', 'cosmic', 'อวกาศลึกสีดำม่วงและดาวสว่าง', { brightness: 88, contrast: 132, saturation: 91, tint: 17, warmth: -22, vignette: 39, sparkle: 34 }),
  p('natural-pop', 'Natural Pop', 'everyday', 'เพิ่มชีวิตชีวาโดยยังคงสีธรรมชาติ', { brightness: 103, contrast: 107, saturation: 112, warmth: 3 }),
  p('soft-portrait', 'Soft Portrait', 'everyday', 'แสงนุ่มและสีอ่อนสำหรับภาพบุคคล', { brightness: 106, contrast: 94, saturation: 94, warmth: 7, glow: 13 }),
  p('clean-vivid', 'Clean Vivid', 'everyday', 'ภาพใสคมและสีสดกำลังดี', { brightness: 104, contrast: 114, saturation: 119, warmth: -3 }),
  p('golden-hour', 'Golden Hour', 'everyday', 'เติมแสงสีทองให้ทุกวันดูอบอุ่น', { brightness: 107, contrast: 103, saturation: 108, warmth: 26, leak: 12 }),
  p('fresh-air', 'Fresh Air', 'everyday', 'โทนเย็นสะอาดและแสงสว่างโปร่ง', { brightness: 108, contrast: 104, saturation: 103, warmth: -13, tint: -5, fade: 4 }),
  ...extra
];

export const neutral = { brightness: 100, contrast: 100, saturation: 100, warmth: 0, tint: 0, hue: 0, sepia: 0, grayscale: 0, fade: 0, vignette: 0, grain: 0, glow: 0, scanlines: 0, chromatic: 0, dust: 0, leak: 0, sparkle: 0, blur: 0, pixelate: 0, posterize: 0, halftone: 0, duotone: 0, invert: 0, solarize: 0, threshold: 0, radialBlur: 0, motionBlur: 0, tiltShift: 0, fog: 0, bokeh: 0, rain: 0, snow: 0, scratches: 0, glitch: 0 };
export const adjustmentKeys = ['brightness', 'contrast', 'saturation', 'warmth', 'tint', 'hue', 'fade', 'blur'];
export const effectKeys = ['grain', 'vignette', 'glow', 'scanlines', 'chromatic', 'dust', 'leak', 'sparkle', 'pixelate', 'posterize', 'halftone', 'duotone', 'invert', 'solarize', 'threshold', 'radialBlur', 'motionBlur', 'tiltShift', 'fog', 'bokeh', 'rain', 'snow', 'scratches', 'glitch'];
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
  for (const key of effectKeys) values[key] = Math.max(0, Math.min(100, (values[key] || 0) + (state.effects[key] || 0)));
  return values;
}
