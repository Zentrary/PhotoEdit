import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';

const source = process.argv[2] || '/tmp/emoji-src/unicode-emoji-json-0.9.0/package';
const keywordFile = process.argv[3] || '/tmp/emoji-src/emojilib-4.0.3/package/dist/emoji-en-US.json';
const catalog = JSON.parse(await readFile(resolve(source, 'data-by-emoji.json'), 'utf8'));
const ordered = JSON.parse(await readFile(resolve(source, 'data-ordered-emoji.json'), 'utf8'));
const keywords = JSON.parse(await readFile(keywordFile, 'utf8'));
const groups = [
  ['all', 'ทั้งหมด', '✦'], ['Smileys & Emotion', 'หน้ายิ้ม', '😀'],
  ['People & Body', 'ผู้คนและมือ', '👋'], ['Animals & Nature', 'สัตว์และธรรมชาติ', '🐱'],
  ['Food & Drink', 'อาหาร', '🍓'], ['Travel & Places', 'ท่องเที่ยว', '🚀'],
  ['Activities', 'กิจกรรม', '⚽'], ['Objects', 'สิ่งของ', '💡'],
  ['Symbols', 'สัญลักษณ์', '❤️'], ['Flags', 'ธงชาติ', '🏳️']
];
const tones = [
  { id: 'all', name: 'ทุกสีผิว', bit: 0, color: '' },
  { id: 'default', name: 'มาตรฐาน', bit: 1, color: '#ffcc4d' },
  { id: 'light', name: 'ผิวขาว', bit: 2, color: '#f7d7c4', modifier: '\u{1F3FB}' },
  { id: 'medium-light', name: 'ผิวขาวเหลือง', bit: 4, color: '#e8b88a', modifier: '\u{1F3FC}' },
  { id: 'medium', name: 'ผิวกลาง', bit: 8, color: '#bb9167', modifier: '\u{1F3FD}' },
  { id: 'medium-dark', name: 'ผิวน้ำตาล', bit: 16, color: '#8e562e', modifier: '\u{1F3FE}' },
  { id: 'dark', name: 'ผิวเข้ม', bit: 32, color: '#613d30', modifier: '\u{1F3FF}' }
];
const modifiers = tones.slice(2);
const pairs = modifiers.flatMap(first => modifiers.map(second => [first, second]));
function toneVariants(value) {
  if (value === '\u{1F91D}') return pairs.map(([a, b]) => [`\u{1FAF1}${a.modifier}‍\u{1FAF2}${b.modifier}`, a.bit | b.bit]);
  if (value === '\u{1F9D1}‍\u{1F91D}‍\u{1F9D1}') return pairs.map(([a, b]) => [`\u{1F9D1}${a.modifier}‍\u{1F91D}‍\u{1F9D1}${b.modifier}`, a.bit | b.bit]);
  if (value === '\u{1F48F}' || value === '\u{1F491}') {
    const middle = value === '\u{1F48F}' ? '\u200D\u2764\uFE0F\u200D\u{1F48B}\u200D' : '\u200D\u2764\uFE0F\u200D';
    return pairs.map(([a, b]) => [`\u{1F469}${a.modifier}${middle}\u{1F468}${b.modifier}`, a.bit | b.bit]);
  }
  if (/^(?:👩|👨)‍❤️(?:‍💋)?‍(?:👩|👨)$/.test(value)) {
    const middle = value.slice(2, -2);
    return pairs.map(([a, b]) => [`${value.slice(0, 2)}${a.modifier}${middle}${value.slice(-2)}${b.modifier}`, a.bit | b.bit]);
  }
  const base = value.includes('‍') ? value : value.replace(/\uFE0F$/, '');
  const segment = base.split('‍')[0];
  const first = segment.replace(/\uFE0F$/, '');
  const rest = base.slice(segment.length);
  return modifiers.map(tone => [`${first}${tone.modifier}${rest}`, tone.bit]);
}
const rows = [];
const seen = new Set();
function add(value, name, group, search, toneMask) {
  if (seen.has(value)) return;
  seen.add(value);
  rows.push([value, name, groups.findIndex(item => item[0] === group), search, toneMask]);
}
for (const value of ordered) {
  const entry = catalog[value];
  if (!entry) continue;
  const words = [...new Set((keywords[value] || []).flatMap(word => word.replaceAll('_', ' ').split(' ')).filter(word => word && !entry.name.includes(word)))].slice(0, 10).join(' ');
  add(value, entry.name, entry.group, words, 1);
  if (entry.skin_tone_support) for (const [variant, mask] of toneVariants(value)) add(variant, entry.name, entry.group, words, mask);
}
const header = `export const emojiGroups = ${JSON.stringify(groups.map(([id, name, symbol]) => ({ id, name, symbol })))};\nexport const emojiTones = ${JSON.stringify(tones.map(({ id, name, bit, color }) => ({ id, name, bit, color })))};\nconst rows = ${JSON.stringify(rows)};\nexport const emojiEntries = rows.map(([value, name, group, keywords, toneMask]) => ({ value, name, group: emojiGroups[group].id, keywords, toneMask }));\n`;
await writeFile('scripts/emoji-data.js', header);
await mkdir('assets/licenses', { recursive: true });
const licenses = await Promise.all([resolve(source, 'LICENSE'), resolve(keywordFile, '../../LICENSE')].map(path => readFile(path, 'utf8')));
await writeFile('assets/licenses/emoji-data.txt', `unicode-emoji-json 0.9.0\nhttps://github.com/muan/unicode-emoji-json\n\n${licenses[0]}\n\nemojilib 4.0.3\nhttps://github.com/muan/emojilib\n\n${licenses[1]}`);
console.log(JSON.stringify({ base: ordered.length, total: rows.length, skinToneVariants: rows.length - ordered.length, bytes: Buffer.byteLength(header) }));
