/**
 * 从注释「如改走…则…」抽取可走变例，写入 Manual.variations。
 *
 *   node scripts/extract-variations.js
 *   node scripts/extract-variations.js --dir ycql
 *   node scripts/extract-variations.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { Xiangqi } = require('../src/lib/vendor/xiangqi.js');

const FILES = 'abcdefghi';
const RED_FILE = '九八七六五四三二一';
const BLACK_FILE = '123456789';
const RED_PIECE = { k: '帅', a: '仕', b: '相', n: '马', c: '炮', r: '车', p: '兵' };
const BLACK_PIECE = { k: '将', a: '士', b: '象', n: '马', c: '炮', r: '车', p: '卒' };
const CN = '零一二三四五六七八九';

const TRIGGER = /(如改走|若改走|又如改走|如走|若走|应改走|可改走|亦可走|可以走|应走|宜走|可走|不如走)/g;

const SAN_RE =
  /(前|后)?(车|马|炮|兵|卒|相|象|仕|士|帅|将)([一二三四五六七八九1-9])?(进|退|平)([一二三四五六七八九1-9])/g;

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      out[a.slice(2)] = argv[++i];
    } else if (a.startsWith('--')) out[a.slice(2)] = true;
  }
  return out;
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

  const others = samePieceSquares(game, color, type, from).filter((sq) => sq[0] === from[0]);
  let head = name + fileLabel(color, fromFile);
  if (others.length > 0 && 'ncrp'.includes(type)) {
    const ranks = [fromRank, ...others.map((s) => Number(s[1]))];
    const max = Math.max(...ranks);
    const min = Math.min(...ranks);
    if (fromRank === max && fromRank !== min) head = color === 'r' ? `前${name}` : `后${name}`;
    else if (fromRank === min && fromRank !== max) head = color === 'r' ? `后${name}` : `前${name}`;
  }

  const toward = color === 'r' ? toRank > fromRank : toRank < fromRank;
  const retreat = color === 'r' ? toRank < fromRank : toRank > fromRank;
  if (fromRank === toRank) return `${head}平${fileLabel(color, toFile)}`;
  const verb = toward ? '进' : retreat ? '退' : '平';
  if ('nab'.includes(type)) return `${head}${verb}${fileLabel(color, toFile)}`;
  const steps = Math.abs(toRank - fromRank);
  const stepStr = color === 'r' ? CN[steps] : String(steps);
  return `${head}${verb}${stepStr}`;
}

function normalizeSan(s) {
  return String(s || '')
    .replace(/\s+/g, '')
    .replace(/[lI｜]/g, '1')
    .replace(/[oO]/g, '0');
}

function fenAfter(startFen, ucis) {
  const game = new Xiangqi(startFen);
  for (const uci of ucis) {
    if (!game.move(uci)) throw new Error(`illegal ${uci}`);
  }
  return game.fen();
}

function resolveSan(fen, san) {
  const want = normalizeSan(san);
  const game = new Xiangqi(fen);
  const legal = game.moves({ verbose: true });
  for (const m of legal) {
    const from = m.iccs.slice(0, 2);
    const to = m.iccs.slice(2, 4);
    const generated = normalizeSan(toChineseSan(game, from, to));
    if (generated === want) return { san: toChineseSan(game, from, to), uci: m.iccs };
  }
  // loose: ignore 前/后 prefix mismatch if unique piece+dest pattern
  const looseWant = want.replace(/^[前后]/, '');
  const looseHits = [];
  for (const m of legal) {
    const from = m.iccs.slice(0, 2);
    const to = m.iccs.slice(2, 4);
    const generated = normalizeSan(toChineseSan(game, from, to)).replace(/^[前后]/, '');
    if (generated === looseWant) looseHits.push({ san: toChineseSan(game, from, to), uci: m.iccs });
  }
  if (looseHits.length === 1) return looseHits[0];
  return null;
}

function extractSanTokens(chunk) {
  const text = chunk.replace(/\s+/g, '');
  const tokens = [];
  SAN_RE.lastIndex = 0;
  let m;
  while ((m = SAN_RE.exec(text))) {
    tokens.push(m[0]);
  }
  return tokens;
}

function parseVariationChunks(comment) {
  const chunks = [];
  const text = comment.replace(/\s+/g, ' ');
  TRIGGER.lastIndex = 0;
  let m;
  const hits = [];
  while ((m = TRIGGER.exec(text))) hits.push({ index: m.index, trigger: m[1] });
  for (let i = 0; i < hits.length; i++) {
    const start = hits[i].index + hits[i].trigger.length;
    const end = i + 1 < hits.length ? hits[i + 1].index : text.length;
    let body = text.slice(start, end);
    // cut trailing prose after sentence end following moves
    const stop = body.search(/[。！？]/);
    if (stop >= 0) body = body.slice(0, stop);
    body = body.replace(/^[,，、\s]+/, '');
    // split first move / continuation after 则
    let firstPart = body;
    let restPart = '';
    const ze = body.search(/则/);
    if (ze >= 0) {
      firstPart = body.slice(0, ze);
      restPart = body.slice(ze + 1);
    }
    const sans = [...extractSanTokens(firstPart), ...extractSanTokens(restPart)];
    if (sans.length === 0) continue;
    chunks.push({
      label: `${hits[i].trigger}${sans[0]}`,
      sans,
      raw: body.slice(0, 60),
    });
  }
  return chunks;
}

function buildVariations(manual) {
  const comments = manual.comments || {};
  const existing = manual.variations || {};
  const out = { ...existing };
  // clone arrays so we can push
  for (const k of Object.keys(out)) out[k] = [...(out[k] || [])];

  let ok = 0;
  let fail = 0;

  for (const [key, comment] of Object.entries(comments)) {
    if (key === 'intro') continue;
    const moveIndex = Number(key);
    if (!Number.isFinite(moveIndex) || moveIndex < 0 || moveIndex >= manual.moves.length) continue;
    if (!TRIGGER.test(comment)) continue;
    TRIGGER.lastIndex = 0;

    const chunks = parseVariationChunks(comment);
    const bucket = out[key] ? [...out[key]] : [];
    const seenLabels = new Set(bucket.map((v) => normalizeSan(v.label)));

    for (let ci = 0; ci < chunks.length; ci++) {
      const chunk = chunks[ci];
      const labelKey = normalizeSan(chunk.label);
      if (seenLabels.has(labelKey)) continue;

      let fen;
      try {
        fen = fenAfter(
          manual.startFen,
          manual.moves.slice(0, moveIndex).map((x) => x.uci),
        );
      } catch {
        fail += 1;
        continue;
      }

      const moves = [];
      let cur = fen;
      let resolved = true;
      for (const san of chunk.sans) {
        const hit = resolveSan(cur, san);
        if (!hit) {
          resolved = false;
          break;
        }
        moves.push(hit);
        const g = new Xiangqi(cur);
        if (!g.move(hit.uci)) {
          resolved = false;
          break;
        }
        cur = g.fen();
      }

      if (!resolved || moves.length === 0) {
        fail += 1;
        continue;
      }

      const letter = String.fromCharCode(97 + bucket.length);
      bucket.push({
        id: `${moveIndex}-${letter}`,
        label: chunk.label,
        comment: comment.length > 160 ? `${comment.slice(0, 160)}…` : comment,
        moves,
      });
      seenLabels.add(labelKey);
      ok += 1;
    }

    if (bucket.length) out[key] = bucket;
  }

  return { variations: out, ok, fail };
}

function listJsonFiles(dirArg) {
  const root = path.resolve(__dirname, '../src/data/manuals');
  const dirs =
    dirArg === 'ycql'
      ? [path.join(root, 'ycql')]
      : dirArg === 'modern'
        ? [path.join(root, 'modern')]
        : [path.join(root, 'ycql'), path.join(root, 'modern')];
  const files = [];
  for (const dir of dirs) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith('.json')) files.push(path.join(dir, name));
    }
  }
  return files;
}

function writeManual(file, manual) {
  const ordered = {
    id: manual.id,
    title: manual.title,
    tags: manual.tags,
    ...(manual.opening ? { opening: manual.opening } : {}),
    sideToMemorize: manual.sideToMemorize,
    ...(manual.defaultFlipped != null ? { defaultFlipped: manual.defaultFlipped } : {}),
    startFen: manual.startFen,
    moves: manual.moves,
    ...(manual.comments && Object.keys(manual.comments).length ? { comments: manual.comments } : {}),
    ...(manual.variations && Object.keys(manual.variations).length
      ? { variations: manual.variations }
      : {}),
    ...(manual.source ? { source: manual.source } : {}),
  };
  fs.writeFileSync(file, `${JSON.stringify(ordered, null, 2)}\n`);
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const dry = Boolean(args['dry-run']);
  const files = listJsonFiles(args.dir); // default: ycql + modern
  let manualsWith = 0;
  let totalVars = 0;
  let totalOk = 0;
  let totalFail = 0;

  for (const file of files) {
    const manual = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (!manual.comments || !Object.keys(manual.comments).length) continue;
    const { variations, ok, fail } = buildVariations(manual);
    totalOk += ok;
    totalFail += fail;
    const count = Object.values(variations).reduce((n, arr) => n + arr.length, 0);
    if (!count) continue;
    manualsWith += 1;
    totalVars += count;
    console.log(`${manual.id}: ${count} variations (resolve fail chunks ~${fail})`);
    if (!dry) {
      manual.variations = variations;
      writeManual(file, manual);
    }
  }

  console.log(
    `\nDone${dry ? ' (dry-run)' : ''}: ${manualsWith} manuals, ${totalVars} variations, resolved=${totalOk}, unresolved≈${totalFail}`,
  );
}

main();
