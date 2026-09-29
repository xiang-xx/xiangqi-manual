/**
 * 从经典残棋谱导入 Puzzle JSON
 *
 * 源：
 *   1) scripts/vendor/ttxq-chuangguan/*.pgn  —— 天天象棋残局挑战（谱着）
 *   2) scripts/vendor/shiqingyaqu/shiqingyaqu551.fen —— 《适情雅趣》局面
 *      （CBL 为象棋桥 3.0，着法暂不可解析；用规则引擎搜强制杀作主变）
 *
 *   node scripts/import-classic-puzzles.js
 */

const fs = require('fs');
const path = require('path');
const { Xiangqi } = require('../src/lib/vendor/xiangqi.js');
const { toChineseSan } = require('./import-dhtmlxq');

const OUT_DIR = path.resolve(__dirname, '../src/data/puzzles');
const CG_DIR = path.resolve(__dirname, 'vendor/ttxq-chuangguan');
const SQY_FEN = path.resolve(__dirname, 'vendor/shiqingyaqu/shiqingyaqu551.fen');
const MIN_SOLVER_MOVES = 3;
const MAX_PLIES = 60;

function normalizeFen(fen) {
  const parts = fen.trim().split(/\s+/);
  if (parts[1] === 'w') parts[1] = 'r';
  if (!parts[1]) parts[1] = 'r';
  if (!parts[2]) parts[2] = '-';
  if (!parts[3]) parts[3] = '-';
  if (!parts[4]) parts[4] = '0';
  if (!parts[5]) parts[5] = '1';
  return parts.slice(0, 6).join(' ');
}

function sideFromFen(fen) {
  return fen.trim().split(/\s+/)[1] === 'b' ? 'black' : 'red';
}

function normalizeSan(s) {
  const FW = '１２３４５６７８９零一二三四五六七八九';
  const HW = '1234567890123456789';
  let t = String(s).replace(/\s+/g, '');
  for (let i = 0; i < FW.length; i++) t = t.split(FW[i]).join(HW[i]);
  return t;
}

function header(text, name) {
  const m = text.match(new RegExp(`\\[${name}\\s+"([^"]*)"\\]`, 'i'));
  return m ? m[1].trim() : '';
}

function extractMovesAndComments(text) {
  const bodyStart = text.search(/(?:^|\n)\s*1[\.．]/m);
  let body = bodyStart >= 0 ? text.slice(bodyStart) : text.replace(/\[[^\]]*\]/g, ' ');
  body = body.replace(/(?:^|\n)\s*(1-0|0-1|1\/2-1\/2|\*)\b[\s\S]*$/m, '\n');

  const comments = {};
  const sans = [];
  const moveRe =
    /(?:前|后)?[车马炮兵相仕帅将象士卒][一二三四五六七八九１２３４５６７８９1-9]?[平进退][一二三四五六七八九１２３４５６７８９1-9]/g;

  const re = /\{([^}]*)\}|[^ {}\[\]\n，,。.]+/g;
  let m;
  while ((m = re.exec(body))) {
    if (m[1] != null) {
      const note = m[1].replace(/\s+/g, ' ').trim();
      if (note && sans.length > 0) {
        const key = String(sans.length - 1);
        comments[key] = comments[key] ? `${comments[key]} ${note}` : note;
      }
      continue;
    }
    const token = m[0].trim();
    if (!token || /^\d+[\.．]$/.test(token)) continue;

    for (const part of token.split(/[，,]/).map((s) => s.trim()).filter(Boolean)) {
      moveRe.lastIndex = 0;
      let mm;
      let found = false;
      while ((mm = moveRe.exec(part))) {
        sans.push(mm[0]);
        found = true;
      }
      if (!found && /[车马炮兵相仕帅将象士卒]/.test(part)) sans.push(part);
    }
  }
  return { sans, comments };
}

function sanToUci(game, san) {
  const target = normalizeSan(san);
  const hits = [];
  for (const mv of game.moves({ verbose: true })) {
    const generated = normalizeSan(toChineseSan(game, mv.from, mv.to));
    if (generated === target) hits.push(mv.iccs);
  }
  if (hits.length === 0) {
    const loose = target.replace(/进一$/, '进1').replace(/退一$/, '退1');
    for (const mv of game.moves({ verbose: true })) {
      const generated = normalizeSan(toChineseSan(game, mv.from, mv.to));
      if (
        generated === loose ||
        generated.replace(/进1$/, '进一').replace(/退1$/, '退一') === target
      ) {
        hits.push(mv.iccs);
      }
    }
  }
  return [...new Set(hits)];
}

function isWin(game, lastMove) {
  if (game.in_checkmate()) return true;
  const cap = lastMove?.captured;
  if (cap === 'k' || cap === 'K') return true;
  // 象棋无子可走即负（困毙）
  if (game.moves().length === 0) return true;
  return false;
}

function difficultyFromSolverMoves(n) {
  if (n >= 10) return 5;
  if (n >= 6) return 4;
  if (n >= 4) return 3;
  return 3;
}

/** 按局面子力打标签；不再使用「趣味」 */
function tagsFromFen(fen, solverMoves) {
  const board = fen.trim().split(/\s+/)[0];
  const tags = [];
  tags.push(solverMoves >= 6 ? '高级' : '中级');
  if (/[Rr]/.test(board)) tags.push('车类');
  if (/[Nn]/.test(board)) tags.push('马类');
  if (/[Cc]/.test(board)) tags.push('炮类');
  if (/[Pp]/.test(board)) tags.push('兵类');
  return [...new Set(tags)];
}

function titleFromEvent(event, fallback) {
  const parts = event.split('.').map((s) => s.trim()).filter(Boolean);
  if (parts.length >= 3) return parts[parts.length - 1];
  if (parts.length === 2) return parts[1];
  return event || fallback;
}

function camel(id) {
  return id.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

function ucisToSolution(startFen, ucis) {
  const game = new Xiangqi(startFen);
  const solution = [];
  let last = null;
  for (const uci of ucis) {
    const cn = toChineseSan(game, uci.slice(0, 2), uci.slice(2, 4));
    last = game.move(uci);
    if (!last) throw new Error(`illegal ${uci}`);
    solution.push({ san: cn, uci: last.iccs });
  }
  return { solution, won: isWin(game, last), game };
}

// —— 强制杀搜索（所有应着均有续杀）——

function moveGivesCheck(fen, iccs) {
  const g = new Xiangqi(fen);
  g.move(iccs);
  return g.in_check();
}

/**
 * 搜一条能杀的主变（对每一层取可续杀的应着作主线）。
 * 非全应着证明，但主变可玩；局面来自古谱。
 */
function findMateMainline(startFen, maxSolver, minSolver, deadline) {
  const startSide = sideFromFen(startFen);

  function search(fen, solverLeft, solverUsed) {
    if (Date.now() > deadline) return null;
    if (sideFromFen(fen) !== startSide) return null;
    if (solverLeft <= 0) return null;

    const g = new Xiangqi(fen);
    const moves = g.moves({ verbose: true });
    const ordered = [...moves].sort((a, b) => {
      const ac = moveGivesCheck(fen, a.iccs) ? 0 : 1;
      const bc = moveGivesCheck(fen, b.iccs) ? 0 : 1;
      if (ac !== bc) return ac - bc;
      return (a.captured ? 0 : 1) - (b.captured ? 0 : 1);
    });

    for (const m of ordered) {
      if (Date.now() > deadline) return null;
      const g2 = new Xiangqi(fen);
      const played = g2.move(m.iccs);
      if (!played) continue;
      const used = solverUsed + 1;

      if (isWin(g2, played)) {
        if (used >= minSolver) return [m.iccs];
        continue;
      }

      const replies = g2.moves({ verbose: true });
      if (replies.length === 0) continue;

      // 优先短应着；对每个应着尝试续杀，取第一条成功主变
      const replyOrdered = [...replies].sort((a, b) => a.iccs.localeCompare(b.iccs));
      for (const r of replyOrdered) {
        const g3 = new Xiangqi(g2.fen());
        g3.move(r.iccs);
        const rest = search(g3.fen(), solverLeft - 1, used);
        if (rest) return [m.iccs, r.iccs, ...rest];
      }
    }
    return null;
  }

  return search(startFen, maxSolver, 0);
}

function resolveMateLine(fen) {
  const deadline = Date.now() + 2500;
  // 优先更长杀（中高级）
  return (
    findMateMainline(fen, 5, 4, deadline) ||
    findMateMainline(fen, 4, 3, deadline) ||
    findMateMainline(fen, 6, 4, deadline) ||
    findMateMainline(fen, 3, 3, deadline)
  );
}

function buildFromPgn(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  const event = header(text, 'Event');
  const index = header(text, 'Index') || path.basename(filePath, '.pgn');
  const fenRaw = header(text, 'FEN');
  if (!fenRaw) throw new Error('missing FEN');

  const startFen = normalizeFen(fenRaw);
  const v = new Xiangqi().validate_fen(startFen);
  if (!v.valid) throw new Error(`bad fen: ${v.error}`);

  const { sans, comments } = extractMovesAndComments(text);
  if (sans.length === 0) throw new Error('no moves');
  if (sans.length > MAX_PLIES) throw new Error(`too long (${sans.length} plies)`);

  const game = new Xiangqi(startFen);
  const solution = [];
  let last = null;
  for (const san of sans) {
    const hits = sanToUci(game, san);
    if (hits.length === 0) throw new Error(`unparsed ${san} at ${game.fen()}`);
    if (hits.length > 1) throw new Error(`ambiguous ${san}`);
    const uci = hits[0];
    const cn = toChineseSan(game, uci.slice(0, 2), uci.slice(2, 4));
    last = game.move(uci);
    if (!last) throw new Error(`illegal ${uci}`);
    solution.push({ san: cn, uci: last.iccs });
  }

  if (!isWin(game, last)) throw new Error('line does not win/mate');

  const solverMoves = solution.filter((_, i) => i % 2 === 0).length;
  if (solverMoves < MIN_SOLVER_MOVES) throw new Error(`too short (${solverMoves}步)`);

  const sideToMove = sideFromFen(startFen);
  const idNum = index.replace(/\D/g, '').padStart(3, '0') || index;
  const puzzleId = `cg-${idNum}`;

  return {
    id: puzzleId,
    title: titleFromEvent(event, puzzleId),
    tags: tagsFromFen(startFen, solverMoves),
    difficulty: difficultyFromSolverMoves(solverMoves),
    sideToMove,
    goal: sideToMove === 'red' ? 'red_win' : 'black_win',
    goalLabel: sideToMove === 'red' ? '红先胜' : '黑先胜',
    startFen,
    solution,
    comments: {
      ...comments,
      [String(solution.length - 1)]:
        comments[String(solution.length - 1)] || '将死，解题成功。',
    },
    source: '天天象棋残局挑战',
    ...(sideToMove === 'black' ? { defaultFlipped: true } : {}),
  };
}

function parseSqyFenFile(text) {
  const items = [];
  const blocks = text.replace(/^\uFEFF/, '').split(/\n(?=\[FEN_INDEX)/);
  for (const b of blocks) {
    const id = b.match(/\[FEN_INDEX "([^"]+)"\]/)?.[1];
    const event = b.match(/\[EVENT "([^"]+)"\]/)?.[1] || '';
    const fen = b.match(/\[FEN "([^"]+)"\]/)?.[1];
    if (!id || !fen) continue;
    const titleMatch = event.match(/第\d+局\s*\*?(.+)$/);
    const title = (titleMatch?.[1] || event)
      .replace(/^\*/, '')
      .replace(/_补图复原$/, '')
      .replace(/^原_\d+局_/, '')
      .trim() || id;
    const num = id.match(/(\d+)$/)?.[1] || String(items.length + 1);
    items.push({ id: `sqy-${num.padStart(3, '0')}`, title, fen: normalizeFen(fen) });
  }
  return items;
}

function buildFromSqy(item) {
  const v = new Xiangqi().validate_fen(item.fen);
  if (!v.valid) throw new Error(`bad fen: ${v.error}`);

  const ucis = resolveMateLine(item.fen);
  if (!ucis) throw new Error('no mate line ≥3');

  const solverMoves = ucis.filter((_, i) => i % 2 === 0).length;
  if (solverMoves < MIN_SOLVER_MOVES) throw new Error(`too short (${solverMoves})`);

  const { solution, won } = ucisToSolution(item.fen, ucis);
  if (!won) throw new Error('not win');

  const sideToMove = sideFromFen(item.fen);
  return {
    id: item.id,
    title: item.title,
    tags: tagsFromFen(item.fen, solverMoves),
    difficulty: difficultyFromSolverMoves(solverMoves),
    sideToMove,
    goal: sideToMove === 'red' ? 'red_win' : 'black_win',
    goalLabel: sideToMove === 'red' ? '红先胜' : '黑先胜',
    startFen: item.fen,
    solution,
    comments: {
      [String(solution.length - 1)]: '将死，解题成功。',
    },
    source: '适情雅趣（经典局面）',
    ...(sideToMove === 'black' ? { defaultFlipped: true } : {}),
  };
}

function writeIndex(built) {
  const ids = built.map((p) => p.id).sort((a, b) => a.localeCompare(b, 'en'));
  // keep cg- before sqy- by natural order already; sort by prefix then number
  ids.sort((a, b) => {
    const [ap, an] = a.split('-');
    const [bp, bn] = b.split('-');
    if (ap !== bp) return ap.localeCompare(bp);
    return Number(an) - Number(bn);
  });

  const imports = ids.map((id) => `import ${camel(id)} from './${id}.json';`).join('\n');
  const arr = ids.map((id) => `  ${camel(id)} as Puzzle,`).join('\n');
  const ts = `import type { Puzzle } from '../../types/puzzle';
import { sortPuzzleTags } from '../puzzleTags';

${imports}

export const puzzles: Puzzle[] = [
${arr}
];

export function getPuzzleById(id: string | undefined): Puzzle | undefined {
  if (!id) return undefined;
  return puzzles.find((p) => p.id === id);
}

export function allPuzzleTags(): string[] {
  return sortPuzzleTags(puzzles.flatMap((p) => p.tags));
}

export type PuzzleFilter = { tags?: string[] };

export function filterPuzzles(filter: PuzzleFilter = {}): Puzzle[] {
  const tags = filter.tags ?? [];
  if (tags.length === 0) return puzzles;
  return puzzles.filter((p) => tags.every((t) => p.tags.includes(t)));
}

export function puzzleTagFacetCounts(filter: PuzzleFilter = {}): Record<string, number> {
  const base = filterPuzzles(filter);
  const counts: Record<string, number> = {};
  for (const p of base) {
    for (const tag of p.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

export function puzzleMetaLine(puzzle: Puzzle): string {
  const tags = puzzle.tags.filter((t) => t !== '中级' && t !== '高级').slice(0, 3);
  const stars = '★'.repeat(puzzle.difficulty) + '☆'.repeat(Math.max(0, 5 - puzzle.difficulty));
  return tags.length > 0 ? \`\${tags.join(' · ')} · \${stars}\` : stars;
}

export function nextPuzzleId(currentId: string): string | null {
  const i = puzzles.findIndex((p) => p.id === currentId);
  if (i < 0 || i + 1 >= puzzles.length) return null;
  return puzzles[i + 1].id;
}
`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), ts);
}

function main() {
  const sqyOnly = process.argv.includes('--sqy-only');
  fs.mkdirSync(OUT_DIR, { recursive: true });

  let built = [];
  if (sqyOnly) {
    built = fs
      .readdirSync(OUT_DIR)
      .filter((n) => n.endsWith('.json'))
      .map((n) => JSON.parse(fs.readFileSync(path.join(OUT_DIR, n), 'utf8')));
  } else {
    for (const name of fs.readdirSync(OUT_DIR)) {
      if (name.endsWith('.json') || name === 'index.ts') {
        fs.unlinkSync(path.join(OUT_DIR, name));
      }
    }
  }

  let skipped = 0;
  const have = new Set(built.map((p) => p.id));

  // 1) 闯关
  if (!sqyOnly) {
    const cgFiles = fs
      .readdirSync(CG_DIR)
      .filter((n) => /^cg\d+\.pgn$/i.test(n))
      .sort((a, b) => Number(a.match(/\d+/)[0]) - Number(b.match(/\d+/)[0]));

    for (const name of cgFiles) {
      process.stdout.write(`cg ${name}… `);
      try {
        const puzzle = buildFromPgn(path.join(CG_DIR, name));
        fs.writeFileSync(
          path.join(OUT_DIR, `${puzzle.id}.json`),
          `${JSON.stringify(puzzle, null, 2)}\n`,
        );
        built.push(puzzle);
        have.add(puzzle.id);
        console.log(`ok ${puzzle.tags.join('/')} · ${puzzle.title}`);
      } catch (err) {
        skipped += 1;
        console.log(`skip ${err.message}`);
      }
    }
  }

  // 2) 适情雅趣
  if (fs.existsSync(SQY_FEN)) {
    const items = parseSqyFenFile(fs.readFileSync(SQY_FEN, 'utf8'));
    console.log(`\n适情雅趣 ${items.length} 局面…`);
    let sqyOk = 0;
    for (const item of items) {
      if (have.has(item.id)) continue;
      process.stdout.write(`sqy ${item.id}… `);
      try {
        const puzzle = buildFromSqy(item);
        fs.writeFileSync(
          path.join(OUT_DIR, `${puzzle.id}.json`),
          `${JSON.stringify(puzzle, null, 2)}\n`,
        );
        built.push(puzzle);
        have.add(puzzle.id);
        sqyOk += 1;
        const n = puzzle.solution.filter((_, i) => i % 2 === 0).length;
        console.log(`ok ${n}步 · ${puzzle.title}`);
      } catch (err) {
        skipped += 1;
        console.log(`skip ${err.message}`);
      }
    }
    console.log(`适情雅趣入库 ${sqyOk}`);
  }

  writeIndex(built);
  console.log(`\nWrote ${built.length} puzzles (skipped ${skipped}) → ${OUT_DIR}`);
  if (built.length < 50) process.exitCode = 1;
}

main();
