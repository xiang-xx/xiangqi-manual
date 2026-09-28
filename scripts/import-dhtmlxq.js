/**
 * 东萍 DhtmlXQ → Manual JSON
 *
 * 用法：
 *   node scripts/import-dhtmlxq.js --file game.ubb --id ycql-01 --title "…"
 *   node scripts/import-dhtmlxq.js --url "http://www.dpxq.com/hldcg/search/view_u_68905.html"
 */

const fs = require('fs');
const path = require('path');
const { Xiangqi } = require('../src/lib/vendor/xiangqi.js');
const { parseDongpingOpen, stripLegacyOpeningTags } = require('./openings');

const START_FEN =
  'rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1';

const FILES = 'abcdefghi';
const RED_FILE = '九八七六五四三二一';
const BLACK_FILE = '123456789';
const RED_PIECE = { k: '帅', a: '仕', b: '相', n: '马', c: '炮', r: '车', p: '兵' };
const BLACK_PIECE = { k: '将', a: '士', b: '象', n: '马', c: '炮', r: '车', p: '卒' };

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && i + 1 < argv.length) out[a.slice(2)] = argv[++i];
  }
  return out;
}

/** 东萍 4 位坐标 → ICCS（列 0–8 左→右，行 0–9 上→下） */
function dpToIccs(m4) {
  const sq = (f, r) => `${FILES[f]}${9 - r}`;
  return sq(+m4[0], +m4[1]) + sq(+m4[2], +m4[3]);
}

function extractTag(text, name) {
  const re = new RegExp(`\\[DhtmlXQ_${name}\\]([\\s\\S]*?)\\[/DhtmlXQ_${name}\\]`, 'i');
  const m = text.match(re);
  return m ? m[1].replace(/\|\|/g, '\n').trim() : '';
}

function extractMainMovelist(text) {
  // 1) 标准 UBB
  let raw = extractTag(text, 'movelist');

  // 2) 页面内 JS：var DhtmlXQ_movelist = '[DhtmlXQ_movelist]…' 或 '[0_1_0]…'
  if (!raw) {
    const js = text.match(/var DhtmlXQ_movelist\s*=\s*'([^']*)'/);
    if (js) {
      const payload = js[1];
      raw =
        payload.match(/\[DhtmlXQ_movelist\](\d+)\[\/DhtmlXQ_movelist\]/i)?.[1] ||
        payload.match(/\[0_1_0\](\d+)\[\/0_1_0\]/)?.[1] ||
        ( /^\d+$/.test(payload) ? payload : '');
    }
  }

  raw = (raw || '').replace(/[^0-9]/g, '');
  if (!raw) throw new Error('empty movelist');
  if (raw.length % 4 !== 0) {
    throw new Error(`movelist length ${raw.length} not multiple of 4`);
  }
  return raw.match(/.{4}/g) ?? [];
}

function extractComments(text) {
  const comments = {};
  // 主线注释 commentN（不含变例 commentA_B）
  const re = /\[DhtmlXQ_comment(\d+)\]([\s\S]*?)\[\/DhtmlXQ_comment\1\]/gi;
  let m;
  while ((m = re.exec(text))) {
    const n = Number(m[1]);
    if (!Number.isFinite(n) || n <= 0) {
      if (n === 0 && m[2].trim()) comments.intro = m[2].replace(/\|\|/g, '\n').trim();
      continue;
    }
    const body = m[2].replace(/\|\|/g, '\n').trim();
    if (body) comments[String(n - 1)] = body;
  }
  // JS 内嵌也可能只有开标签形式出现在源码外 — 已覆盖 UBB
  return comments;
}

function fileLabel(color, file) {
  return color === 'r' ? RED_FILE[file] : BLACK_FILE[file];
}

function pieceName(color, type) {
  const t = type.toLowerCase();
  return (color === 'r' ? RED_PIECE : BLACK_PIECE)[t] ?? t;
}

function samePieceSquares(game, color, type, excludeSq) {
  const out = [];
  for (let r = 0; r < 10; r++) {
    for (let f = 0; f < 9; f++) {
      const sq = `${FILES[f]}${9 - r}`;
      if (sq === excludeSq) continue;
      const p = game.get(sq);
      if (p && p.color === color && p.type.toLowerCase() === type) out.push(sq);
    }
  }
  return out;
}

/** 简易中文着法（含前后/双炮等同名消歧的常见情况） */
function toChineseSan(game, from, to) {
  const piece = game.get(from);
  if (!piece) return `${from}${to}`;
  const color = piece.color;
  const type = piece.type.toLowerCase();
  const name = pieceName(color, type);
  const fromFile = FILES.indexOf(from[0]);
  const fromRank = Number(from[1]);
  const toFile = FILES.indexOf(to[0]);
  const toRank = Number(to[1]);

  const others = samePieceSquares(game, color, type, from).filter((sq) => {
    // 同列才需要前/后；车马炮兵等同列常见
    return sq[0] === from[0];
  });

  let head = name + fileLabel(color, fromFile);
  if (others.length > 0 && 'ncrp'.includes(type)) {
    const ranks = [fromRank, ...others.map((s) => Number(s[1]))];
    const max = Math.max(...ranks);
    const min = Math.min(...ranks);
    if (fromRank === max && fromRank !== min) {
      head = color === 'r' ? `前${name}` : `后${name}`;
    } else if (fromRank === min && fromRank !== max) {
      head = color === 'r' ? `后${name}` : `前${name}`;
    }
  }

  const toward = color === 'r' ? toRank > fromRank : toRank < fromRank;
  const retreat = color === 'r' ? toRank < fromRank : toRank > fromRank;

  if (fromRank === toRank) {
    return `${head}平${fileLabel(color, toFile)}`;
  }

  const verb = toward ? '进' : retreat ? '退' : '平';
  // 马相士仕：进退后写落点路数；车炮兵帅将：写步数
  if ('nab'.includes(type)) {
    return `${head}${verb}${fileLabel(color, toFile)}`;
  }
  const steps = Math.abs(toRank - fromRank);
  const stepLabel = color === 'r' ? RED_FILE[9 - steps] ?? String(steps) : String(steps);
  // 红方步数用中文数字一二…；上面 RED_FILE 是路数不是步数
  const CN = '零一二三四五六七八九';
  const stepStr = color === 'r' ? CN[steps] : String(steps);
  return `${head}${verb}${stepStr}`;
}

function binitToFen(binit) {
  if (!binit || binit.length < 64) return START_FEN;
  // 东萍 binit：64 个半字节对，按固定子力顺序；空则用开局
  // 多数银川棋路全局 binit 为空，直接开局即可
  return START_FEN;
}

function buildManual({ text, id, title, tags, sideToMemorize, source, focusPlayers }) {
  const dpMoves = extractMainMovelist(text);
  const startFen = binitToFen(extractTag(text, 'binit'));
  const game = new Xiangqi(startFen);
  const moves = [];

  for (const dp of dpMoves) {
    const uci = dpToIccs(dp);
    const from = uci.slice(0, 2);
    const to = uci.slice(2, 4);
    const san = toChineseSan(game, from, to);
    const result = game.move(uci);
    if (!result) {
      throw new Error(`Illegal move ${dp}→${uci} at ${game.fen()}`);
    }
    moves.push({ san, uci: result.iccs });
  }

  const rawComments = extractComments(text);
  const comments = { ...rawComments };
  delete comments.intro;

  const metaTitle =
    title ||
    extractTag(text, 'title') ||
    id;
  const red = extractTag(text, 'redname') || extractTag(text, 'red');
  const black = extractTag(text, 'blackname') || extractTag(text, 'black');
  const opening = extractTag(text, 'open');
  const date = extractTag(text, 'date');
  const result = extractTag(text, 'result');

  const focus = Array.isArray(focusPlayers) ? focusPlayers : focusPlayers ? [focusPlayers] : [];
  let side = sideToMemorize;
  if (!side && focus.length) {
    const redHit = focus.some((n) => red.includes(n));
    const blackHit = focus.some((n) => black.includes(n));
    if (blackHit && !redHit) side = 'black';
    else if (redHit && !blackHit) side = 'red';
    else side = 'both';
  }
  if (!side) {
    side =
      /许银川/.test(black) && !/许银川/.test(red)
        ? 'black'
        : /许银川/.test(red) && !/许银川/.test(black)
          ? 'red'
          : 'both';
  }

  const tagSet = new Set(stripLegacyOpeningTags(tags?.length ? tags : ['名局']));
  tagSet.add('名局');

  const parsedOpening = parseDongpingOpen(opening);

  return {
    id,
    title: metaTitle,
    tags: [...tagSet],
    ...(Object.keys(parsedOpening).length ? { opening: parsedOpening } : {}),
    sideToMemorize: side,
    defaultFlipped: side === 'black',
    startFen,
    moves,
    comments,
    source:
      source ||
      [red && black ? `${red} vs ${black}` : '', date, result, opening].filter(Boolean).join(' · '),
  };
}

async function loadText(args) {
  if (args.file) {
    const buf = fs.readFileSync(path.resolve(args.file));
    return decodeMaybeGbk(buf);
  }
  if (args.url) {
    const res = await fetch(args.url, {
      headers: { 'User-Agent': 'xiangqi-manual-import/1.0' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status} for ${args.url}`);
    return decodeMaybeGbk(Buffer.from(await res.arrayBuffer()));
  }
  if (args.text) return args.text;
  throw new Error('Provide --file, --url, or text');
}

function decodeMaybeGbk(buf) {
  try {
    return require('child_process')
      .execFileSync('iconv', ['-f', 'gbk', '-t', 'utf-8'], { input: buf })
      .toString('utf8');
  } catch {
    return buf.toString('utf8');
  }
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!args.file && !args.url) {
    console.error('Usage: node scripts/import-dhtmlxq.js --url URL|--file PATH --id ID');
    process.exit(1);
  }
  const text = await loadText(args);

  const id = args.id ?? 'imported-dhtmlxq';
  const manual = buildManual({
    text,
    id,
    title: args.title,
    tags: args.tags ? args.tags.split(',').map((t) => t.trim()) : undefined,
    sideToMemorize: args.side,
    source: args.source,
  });

  const outPath = args.out
    ? path.resolve(args.out)
    : path.resolve(__dirname, `../src/data/manuals/${id}.json`);
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, `${JSON.stringify(manual, null, 2)}\n`);
  console.log(`Wrote ${outPath} (${manual.moves.length} moves, side=${manual.sideToMemorize})`);
}

module.exports = {
  buildManual,
  dpToIccs,
  extractMainMovelist,
  extractComments,
  toChineseSan,
  START_FEN,
};

if (require.main === module) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
