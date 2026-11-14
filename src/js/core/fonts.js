export const fontFamilies = [
  { family: 'Noto Sans Thai', label: 'Noto Sans Thai · อ่านง่าย', group: 'thai' },
  { family: 'Anuphan', label: 'Anuphan · โมเดิร์น', group: 'thai' },
  { family: 'Sarabun', label: 'Sarabun · ทางการ', group: 'thai' },
  { family: 'Prompt', label: 'Prompt · กลมอ่านง่าย', group: 'thai' },
  { family: 'Kanit', label: 'Kanit · หนักแน่น', group: 'thai' },
  { family: 'Mitr', label: 'Mitr · เป็นกันเอง', group: 'thai' },
  { family: 'Bai Jamjuree', label: 'Bai Jamjuree · เรขาคณิต', group: 'thai' },
  { family: 'Chakra Petch', label: 'Chakra Petch · เทคโนโลยี', group: 'thai' },
  { family: 'K2D', label: 'K2D · เหลี่ยมคม', group: 'thai' },
  { family: 'KoHo', label: 'KoHo · นุ่มเหลี่ยม', group: 'thai' },
  { family: 'Krub', label: 'Krub · สะอาด', group: 'thai' },
  { family: 'Niramit', label: 'Niramit · คลาสสิก', group: 'thai' },
  { family: 'Trirong', label: 'Trirong · มีหัว', group: 'thai' },
  { family: 'Noto Serif Thai', label: 'Noto Serif Thai · หนังสือ', group: 'thai' },
  { family: 'Itim', label: 'Itim · ขี้เล่น', group: 'handwriting' },
  { family: 'Mali', label: 'Mali · ลายมือ', group: 'handwriting' },
  { family: 'Sriracha', label: 'Sriracha · ลายมือสนุก', group: 'handwriting' },
  { family: 'Charm', label: 'Charm · หวานละมุน', group: 'handwriting' },
  { family: 'Charmonman', label: 'Charmonman · ลายมือไทย', group: 'handwriting' },
  { family: 'Space Grotesk', label: 'Space Grotesk · Display', group: 'display' },
  { family: 'Playfair Display', label: 'Playfair Display · หรูหรา', group: 'display' },
  { family: 'Bebas Neue', label: 'Bebas Neue · ตัวพิมพ์ใหญ่', group: 'display' },
  { family: 'Lobster', label: 'Lobster · ย้อนยุค', group: 'display' },
  { family: 'Pacifico', label: 'Pacifico · สบาย ๆ', group: 'handwriting' },
  { family: 'Caveat', label: 'Caveat · ลายมือเร็ว', group: 'handwriting' },
  { family: 'Press Start 2P', label: 'Press Start 2P · พิกเซลเกม', group: 'display' }
];

const pending = new Map();
export function loadFont(family) {
  if (!document.fonts?.load) return Promise.resolve();
  if (!pending.has(family)) {
    pending.set(family, Promise.all([
      document.fonts.load(`600 24px "${family}"`, 'กขค AaBb 123'),
      document.fonts.load(`600 24px "${family}"`, 'ABCDEFGHIJKLM abcdefghijk 0123456789')
    ]).catch(error => { pending.delete(family); throw error; }));
  }
  return pending.get(family);
}
