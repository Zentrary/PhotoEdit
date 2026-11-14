export const toolInfo = {
  presets: ['FIND YOUR MOOD', 'สไตล์รูป'],
  adjust: ['COLOR & LIGHT', 'ปรับแสงและสี'],
  crop: ['FRAME YOUR MOMENT', 'ครอปและจัดแนว'],
  resize: ['THE PERFECT FIT', 'เปลี่ยนขนาดรูป'],
  effects: ['A LITTLE EXTRA', 'เอฟเฟกต์'],
  frame: ['FINISHING TOUCH', 'กรอบรูป'],
  text: ['SAY IT YOUR WAY', 'ข้อความ'],
  stickers: ['MAKE IT PLAYFUL', 'สติ๊กเกอร์'],
  draw: ['LEAVE YOUR MARK', 'วาดรูป'],
  looks: ['MADE BY YOU', 'สไตล์ของฉัน']
};

export const toolHints = {
  presets: 'เลือกสไตล์ที่ใช่ แล้วปรับความแรงให้เป็นคุณ',
  adjust: 'ทุกการปรับแก้คำนวณจากรูปต้นฉบับเสมอ',
  crop: 'ลากกรอบหรือมุมทั้งสี่ แล้วกดใช้การครอป',
  resize: 'กำหนดขนาดเป็นพิกเซลหรือเปอร์เซ็นต์',
  effects: 'เติมบรรยากาศทีละนิด รูปก็มีเรื่องเล่า',
  frame: 'เลือกกรอบที่เข้ากับภาพของคุณ',
  text: 'เพิ่มข้อความ แล้วลากวางบนรูปได้เลย',
  stickers: 'เลือกสติ๊กเกอร์ แล้วลากไปวางที่ถูกใจ',
  draw: 'วาดด้วยนิ้วหรือเมาส์ ยางลบจะลบเฉพาะเส้นวาด',
  looks: 'สไตล์ที่บันทึกอยู่ในรอบใช้งานนี้เท่านั้น'
};

export const adjustmentLabels = {
  brightness: 'ความสว่าง', contrast: 'คอนทราสต์', saturation: 'ความอิ่มสี', warmth: 'อุ่น – เย็น', tint: 'เขียว – ม่วง',
  hue: 'เปลี่ยนเฉดสี', fade: 'เฟด / สีจาง', blur: 'ความเบลอ', exposure: 'เอกซ์โพเชอร์', highlights: 'ไฮไลต์',
  shadows: 'เงา', whites: 'ขาวจัด', blacks: 'ดำจัด', vibrance: 'สีสดอัจฉริยะ', clarity: 'ความเคลียร์', sharpness: 'ความคมชัด'
};

export const effectLabels = {
  grain: 'เกรนฟิล์ม', vignette: 'ขอบมืด', glow: 'แสงฟุ้ง', scanlines: 'เส้นสแกน VHS', chromatic: 'สีเหลื่อม',
  dust: 'ฝุ่นละออง', leak: 'แสงรั่ว', sparkle: 'ละอองดาว', pixelate: 'พิกเซลแตก', posterize: 'ลดระดับสี',
  halftone: 'จุดหนังสือพิมพ์', duotone: 'ดูโอโทน', invert: 'กลับสี', solarize: 'โซลาไรซ์', threshold: 'ขาวดำสองค่า',
  radialBlur: 'เบลอพุ่งกลาง', motionBlur: 'เบลอเคลื่อนไหว', tiltShift: 'เบลอบนล่าง', fog: 'หมอก', bokeh: 'โบเก้',
  rain: 'ฝน', snow: 'หิมะ', scratches: 'รอยขีดฟิล์ม', glitch: 'ภาพกระตุก', bloom: 'แสงบลูม', lightRays: 'ลำแสง',
  starburst: 'แสงกระจาย', prism: 'ปริซึม', colorNoise: 'นอยส์สี', dither: 'ดิทเทอร์', emboss: 'ภาพนูน',
  edges: 'เส้นขอบ', mirror: 'กระจกเงา', kaleidoscope: 'คาไลโดสโคป', fisheye: 'เลนส์ตาปลา', swirl: 'วนก้นหอย',
  doubleExposure: 'ซ้อนภาพ', tracking: 'แทร็กกิ้ง VHS', colorDodge: 'สีสว่างจัด', bleach: 'ฟอกสีฟิล์ม'
};

export const effectGroups = [
  ['ฟิล์มและพื้นผิว', ['grain', 'dust', 'scratches', 'scanlines', 'halftone', 'colorNoise', 'dither', 'tracking', 'bleach']],
  ['แสงและสี', ['glow', 'bloom', 'leak', 'lightRays', 'starburst', 'vignette', 'chromatic', 'prism', 'duotone', 'posterize', 'invert', 'solarize', 'threshold', 'colorDodge']],
  ['เบลอและเคลื่อนไหว', ['radialBlur', 'motionBlur', 'tiltShift', 'glitch', 'pixelate']],
  ['บรรยากาศ', ['fog', 'bokeh', 'rain', 'snow', 'sparkle']],
  ['รูปทรงและกราฟิก', ['emboss', 'edges', 'mirror', 'kaleidoscope', 'fisheye', 'swirl', 'doubleExposure']]
];

export const stickerLabels = {
  star: 'ดาว', heart: 'หัวใจ', moon: 'ดวงจันทร์', planet: 'ดาวเคราะห์', sparkle: 'ประกาย', flower: 'ดอกไม้',
  bolt: 'สายฟ้า', butterfly: 'ผีเสื้อ', smile: 'ยิ้ม', cherry: 'เชอร์รี', diamond: 'เพชร', music: 'ดนตรี',
  sun: 'ดวงอาทิตย์', cloud: 'เมฆ', rainbow: 'สายรุ้ง', rocket: 'จรวด', ufo: 'จานบิน', comet: 'ดาวหาง',
  crown: 'มงกุฎ', camera: 'กล้อง', cassette: 'เทปคาสเซ็ต', floppy: 'ฟลอปปี้ดิสก์', gamepad: 'จอยเกม',
  gift: 'ของขวัญ', balloon: 'ลูกโป่ง', cake: 'เค้ก', icecream: 'ไอศกรีม', coffee: 'กาแฟ', pizza: 'พิซซ่า',
  strawberry: 'สตรอว์เบอร์รี', leaf: 'ใบไม้', cactus: 'กระบองเพชร', paw: 'รอยเท้าสัตว์', peace: 'สันติภาพ',
  fire: 'ไฟ', drop: 'หยดน้ำ', snowflake: 'เกล็ดหิมะ', mountain: 'ภูเขา', wave: 'คลื่น', shell: 'เปลือกหอย',
  clover: 'โคลเวอร์', mushroom: 'เห็ด', ghost: 'ผีน่ารัก', alien: 'เอเลียน', eyes: 'ดวงตา', lips: 'ริมฝีปาก',
  speech: 'กล่องคำพูด', umbrella: 'ร่ม', palm: 'ต้นปาล์ม', airplane: 'เครื่องบิน', car: 'รถยนต์',
  bicycle: 'จักรยาน', sailboat: 'เรือใบ', anchor: 'สมอเรือ', telescope: 'กล้องโทรทรรศน์', ring: 'แหวน',
  lipstick: 'ลิปสติก', palette: 'จานสี', book: 'หนังสือ', letter: 'จดหมาย', phone: 'โทรศัพท์',
  headphones: 'หูฟัง', guitar: 'กีตาร์', dice: 'ลูกเต๋า', trophy: 'ถ้วยรางวัล', medal: 'เหรียญรางวัล',
  soccer: 'ฟุตบอล', basketball: 'บาสเกตบอล', dumbbell: 'ดัมเบล', wand: 'คฑาเวทมนตร์', potion: 'ขวดยาวิเศษ',
  key: 'กุญแจ', bulb: 'หลอดไฟ', candle: 'เทียน', teddy: 'หมีเทดดี้', bow: 'โบว์', confetti: 'คอนเฟตติ',
  firework: 'พลุ', partyhat: 'หมวกปาร์ตี้', crescent: 'จันทร์เสี้ยวคู่'
};

export const stickerLabel = type => type.startsWith('emoji:') ? type.slice(6) : stickerLabels[type] || type;

export const colors = ['#ffffff', '#1b1426', '#c4a0f5', '#f1acd0', '#a5d8e6', '#a4d5a2', '#f4d38d', '#ef8d79'];
