/**
 * 将 ICCS 着法列表（或简易 PGN 着法段）转为 Manual JSON 模板。
 *
 * 用法：
 *   node scripts/import-pgn.js --id my-game --title "示例" --moves "h2e2 h9g7 h0g2"
 *   node scripts/import-pgn.js --id my-game --title "示例" --file moves.txt
 */

const fs = require('fs');
const path = require('path');
const { Xiangqi } = require('../src/lib/vendor/xiangqi.js');

const START_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1';

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && i + 1 < argv.length) {
      out[a.slice(2)] = argv[++i];
    }
  }
  return out;
}

function extractMoves(text) {
  return text
    .replace(/\[[^\]]*\]/g, ' ')
    .replace(/\d+\./g, ' ')
    .split(/[\s,;]+/)
    .map((t) => t.trim().toLowerCase().replace(/-/g, ''))
    .filter((t) => /^[a-i][0-9][a-i][0-9]$/.test(t));
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const id = args.id ?? 'imported-manual';
  const title = args.title ?? id;
  const startFen = args.fen ?? START_FEN;

  let raw = args.moves ?? '';
  if (args.file) {
    raw = fs.readFileSync(path.resolve(args.file), 'utf8');
  }
  if (!raw) {
    console.error('Provide --moves "h2e2 h9g7 ..." or --file path');
    process.exit(1);
  }

  const ucis = extractMoves(raw);
  const game = new Xiangqi(startFen);
  const moves = [];

  for (const uci of ucis) {
    const result = game.move(uci);
    if (!result) {
      console.error(`Illegal move: ${uci} at fen ${game.fen()}`);
      process.exit(1);
    }
    moves.push({ san: result.iccs, uci: result.iccs });
  }

  const manual = {
    id,
    title,
    tags: [],
    sideToMemorize: 'both',
    startFen,
    moves,
    comments: {},
    source: args.source ?? '',
  };

  const outPath = args.out
    ? path.resolve(args.out)
    : path.resolve(__dirname, `../src/data/manuals/${id}.json`);

  fs.writeFileSync(outPath, `${JSON.stringify(manual, null, 2)}\n`);
  console.log(`Wrote ${outPath} (${moves.length} moves). Fill tags/san/comments manually.`);
}

main();
