/** Regenerate wood board + circular piece SVGs under assets/ */
const fs = require('fs');
const path = require('path');

const piecesDir = path.join(__dirname, '../assets/pieces');
const boardDir = path.join(__dirname, '../assets/board');
fs.mkdirSync(piecesDir, { recursive: true });
fs.mkdirSync(boardDir, { recursive: true });

const PIECES = [
  { id: 'rK', label: '帅', side: 'red' },
  { id: 'rA', label: '仕', side: 'red' },
  { id: 'rB', label: '相', side: 'red' },
  { id: 'rN', label: '马', side: 'red' },
  { id: 'rR', label: '车', side: 'red' },
  { id: 'rC', label: '炮', side: 'red' },
  { id: 'rP', label: '兵', side: 'red' },
  { id: 'bK', label: '将', side: 'black' },
  { id: 'bA', label: '士', side: 'black' },
  { id: 'bB', label: '象', side: 'black' },
  { id: 'bN', label: '马', side: 'black' },
  { id: 'bR', label: '车', side: 'black' },
  { id: 'bC', label: '炮', side: 'black' },
  { id: 'bP', label: '卒', side: 'black' },
];

function pieceSvg({ label, side }) {
  const fill = side === 'red' ? '#F4E4C1' : '#F0E6D2';
  const stroke = side === 'red' ? '#C62828' : '#212121';
  const text = side === 'red' ? '#B71C1C' : '#111111';
  const inner = side === 'red' ? '#E57373' : '#616161';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="wood" cx="35%" cy="30%" r="70%">
      <stop offset="0%" stop-color="#FFF8E7"/>
      <stop offset="55%" stop-color="${fill}"/>
      <stop offset="100%" stop-color="#D7C4A0"/>
    </radialGradient>
  </defs>
  <circle cx="64" cy="64" r="58" fill="url(#wood)" stroke="${stroke}" stroke-width="6"/>
  <circle cx="64" cy="64" r="48" fill="none" stroke="${inner}" stroke-width="2.5" opacity="0.85"/>
  <text x="64" y="72" text-anchor="middle" font-family="Songti SC, STSong, serif" font-size="54" font-weight="700" fill="${text}">${label}</text>
</svg>
`;
}

for (const p of PIECES) {
  fs.writeFileSync(path.join(piecesDir, `${p.id}.svg`), pieceSvg(p));
}

const W = 900;
const H = 1000;
const M = 50;
const cellW = (W - 2 * M) / 8;
const cellH = (H - 2 * M) / 9;
const xAt = (file) => M + file * cellW;
const yAt = (rank) => M + rank * cellH;

let lines = '';
for (let f = 0; f <= 8; f++) {
  if (f === 0 || f === 8) {
    lines += `<line x1="${xAt(f)}" y1="${yAt(0)}" x2="${xAt(f)}" y2="${yAt(9)}" stroke="#3E2723" stroke-width="3"/>\n`;
  } else {
    lines += `<line x1="${xAt(f)}" y1="${yAt(0)}" x2="${xAt(f)}" y2="${yAt(4)}" stroke="#4E342E" stroke-width="2"/>\n`;
    lines += `<line x1="${xAt(f)}" y1="${yAt(5)}" x2="${xAt(f)}" y2="${yAt(9)}" stroke="#4E342E" stroke-width="2"/>\n`;
  }
}
for (let r = 0; r <= 9; r++) {
  lines += `<line x1="${xAt(0)}" y1="${yAt(r)}" x2="${xAt(8)}" y2="${yAt(r)}" stroke="#4E342E" stroke-width="${r === 0 || r === 9 ? 3 : 2}"/>\n`;
}
lines += `<line x1="${xAt(3)}" y1="${yAt(0)}" x2="${xAt(5)}" y2="${yAt(2)}" stroke="#4E342E" stroke-width="2"/>\n`;
lines += `<line x1="${xAt(5)}" y1="${yAt(0)}" x2="${xAt(3)}" y2="${yAt(2)}" stroke="#4E342E" stroke-width="2"/>\n`;
lines += `<line x1="${xAt(3)}" y1="${yAt(7)}" x2="${xAt(5)}" y2="${yAt(9)}" stroke="#4E342E" stroke-width="2"/>\n`;
lines += `<line x1="${xAt(5)}" y1="${yAt(7)}" x2="${xAt(3)}" y2="${yAt(9)}" stroke="#4E342E" stroke-width="2"/>\n`;

function mark(file, rank) {
  const x = xAt(file);
  const y = yAt(rank);
  const s = 10;
  const g = 4;
  const segs = [];
  if (file > 0) segs.push(`M${x - g},${y - s} L${x - g},${y - g} L${x - s},${y - g}`);
  if (file < 8) segs.push(`M${x + g},${y - s} L${x + g},${y - g} L${x + s},${y - g}`);
  if (file > 0) segs.push(`M${x - g},${y + s} L${x - g},${y + g} L${x - s},${y + g}`);
  if (file < 8) segs.push(`M${x + g},${y + s} L${x + g},${y + g} L${x + s},${y + g}`);
  return segs.map((d) => `<path d="${d}" fill="none" stroke="#5D4037" stroke-width="1.5"/>`).join('\n');
}

const marks = [
  [1, 2],
  [7, 2],
  [0, 3],
  [2, 3],
  [4, 3],
  [6, 3],
  [8, 3],
  [1, 7],
  [7, 7],
  [0, 6],
  [2, 6],
  [4, 6],
  [6, 6],
  [8, 6],
]
  .map(([f, r]) => mark(f, r))
  .join('\n');

const board = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="woodbg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#E8C99A"/>
      <stop offset="40%" stop-color="#D4A574"/>
      <stop offset="100%" stop-color="#C4956A"/>
    </linearGradient>
    <pattern id="grain" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q10 18 20 22 T40 20" fill="none" stroke="#B8845A" stroke-width="0.8" opacity="0.35"/>
      <path d="M0 8 Q12 10 24 6 T40 8" fill="none" stroke="#A67C52" stroke-width="0.6" opacity="0.25"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" rx="18" fill="url(#woodbg)"/>
  <rect width="${W}" height="${H}" rx="18" fill="url(#grain)"/>
  <rect x="28" y="28" width="${W - 56}" height="${H - 56}" rx="8" fill="#E8D5B0" stroke="#5D4037" stroke-width="4"/>
  ${lines}
  ${marks}
  <text x="${W / 2}" y="${(yAt(4) + yAt(5)) / 2 + 8}" text-anchor="middle" font-family="Songti SC, STSong, serif" font-size="36" fill="#5D4037" opacity="0.55" letter-spacing="24">楚 河　　汉 界</text>
</svg>
`;

fs.writeFileSync(path.join(boardDir, 'board.svg'), board);
console.log(`Wrote ${PIECES.length} pieces + board.svg`);
