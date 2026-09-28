/** Regenerate 天天象棋-style wood board + circular piece SVGs under assets/ */
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
  const rim = side === 'red' ? '#9B1C1C' : '#1A1A1A';
  const ink = side === 'red' ? '#B71C1C' : '#121212';
  const inner = side === 'red' ? '#C62828' : '#333333';
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128">
  <defs>
    <radialGradient id="disc" cx="38%" cy="32%" r="70%">
      <stop offset="0%" stop-color="#FFF3D6"/>
      <stop offset="55%" stop-color="#E8CFA5"/>
      <stop offset="100%" stop-color="#C9A46E"/>
    </radialGradient>
    <linearGradient id="bevel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#fff" stop-opacity="0.35"/>
      <stop offset="40%" stop-color="#fff" stop-opacity="0"/>
      <stop offset="100%" stop-color="#000" stop-opacity="0.18"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-10%" width="140%" height="140%">
      <feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#1A1208" flood-opacity="0.35"/>
    </filter>
  </defs>
  <circle cx="64" cy="64" r="58" fill="url(#disc)" filter="url(#shadow)"/>
  <circle cx="64" cy="64" r="52" fill="none" stroke="${rim}" stroke-width="6"/>
  <circle cx="64" cy="64" r="42" fill="none" stroke="${inner}" stroke-width="2.2" opacity="0.75"/>
  <circle cx="64" cy="64" r="58" fill="url(#bevel)"/>
  <text x="64" y="74" text-anchor="middle" font-family="Songti SC, STSong, serif" font-size="52" font-weight="700" fill="${ink}">${label}</text>
</svg>
`;
}

for (const p of PIECES) {
  fs.writeFileSync(path.join(piecesDir, `${p.id}.svg`), pieceSvg(p));
}

const W = 900;
const H = 1000;
const M = 54;
const cellW = (W - 2 * M) / 8;
const cellH = (H - 2 * M) / 9;
const xAt = (file) => M + file * cellW;
const yAt = (rank) => M + rank * cellH;

let lines = '';
for (let f = 0; f <= 8; f++) {
  if (f === 0 || f === 8) {
    lines += `<line x1="${xAt(f)}" y1="${yAt(0)}" x2="${xAt(f)}" y2="${yAt(9)}" stroke="#4A2F18" stroke-width="3"/>\n`;
  } else {
    lines += `<line x1="${xAt(f)}" y1="${yAt(0)}" x2="${xAt(f)}" y2="${yAt(4)}" stroke="#5C3D22" stroke-width="2"/>\n`;
    lines += `<line x1="${xAt(f)}" y1="${yAt(5)}" x2="${xAt(f)}" y2="${yAt(9)}" stroke="#5C3D22" stroke-width="2"/>\n`;
  }
}
for (let r = 0; r <= 9; r++) {
  lines += `<line x1="${xAt(0)}" y1="${yAt(r)}" x2="${xAt(8)}" y2="${yAt(r)}" stroke="#5C3D22" stroke-width="${r === 0 || r === 9 ? 3 : 2}"/>\n`;
}
lines += `<line x1="${xAt(3)}" y1="${yAt(0)}" x2="${xAt(5)}" y2="${yAt(2)}" stroke="#5C3D22" stroke-width="2"/>\n`;
lines += `<line x1="${xAt(5)}" y1="${yAt(0)}" x2="${xAt(3)}" y2="${yAt(2)}" stroke="#5C3D22" stroke-width="2"/>\n`;
lines += `<line x1="${xAt(3)}" y1="${yAt(7)}" x2="${xAt(5)}" y2="${yAt(9)}" stroke="#5C3D22" stroke-width="2"/>\n`;
lines += `<line x1="${xAt(5)}" y1="${yAt(7)}" x2="${xAt(3)}" y2="${yAt(9)}" stroke="#5C3D22" stroke-width="2"/>\n`;

const board = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="frame" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#6B4423"/>
      <stop offset="50%" stop-color="#4E2F18"/>
      <stop offset="100%" stop-color="#3A2110"/>
    </linearGradient>
    <linearGradient id="face" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#F0D9B0"/>
      <stop offset="100%" stop-color="#D4B07A"/>
    </linearGradient>
    <pattern id="grain" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M0 20 Q10 17 20 22 T40 20" fill="none" stroke="#C4A06A" stroke-width="1" opacity="0.4"/>
    </pattern>
  </defs>
  <rect width="${W}" height="${H}" rx="16" fill="url(#frame)"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="6" fill="url(#face)" stroke="#5A3A1E" stroke-width="4"/>
  <rect x="22" y="22" width="${W - 44}" height="${H - 44}" rx="6" fill="url(#grain)" opacity="0.45"/>
  ${lines}
  <text x="${W / 2 - 140}" y="${(yAt(4) + yAt(5)) / 2 + 12}" text-anchor="middle" font-family="Songti SC, STSong, serif" font-size="36" fill="#6B4A2A" opacity="0.55">楚 河</text>
  <text x="${W / 2 + 140}" y="${(yAt(4) + yAt(5)) / 2 + 12}" text-anchor="middle" font-family="Songti SC, STSong, serif" font-size="36" fill="#6B4A2A" opacity="0.55">汉 界</text>
</svg>
`;

fs.writeFileSync(path.join(boardDir, 'board.svg'), board);
console.log(`Wrote ${PIECES.length} pieces + board.svg`);
