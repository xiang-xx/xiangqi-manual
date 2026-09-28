/**
 * 从东萍拉取《银川棋路》45 局并生成 Manual JSON。
 *
 *   node scripts/fetch-ycql.js
 *   node scripts/fetch-ycql.js --limit 3
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildManual } = require('./import-dhtmlxq');

// 东萍「银川棋谱完整版」局号：01→68905 … 45→68861
const GAMES = [
  [68905, '01'],
  [68904, '02'],
  [68903, '03'],
  [68902, '04'],
  [68901, '05'],
  [68900, '06'],
  [68899, '07'],
  [68898, '08'],
  [68897, '09'],
  [68896, '10'],
  [68895, '11'],
  [68894, '12'],
  [68893, '13'],
  [68892, '14'],
  [68891, '15'],
  [68890, '16'],
  [68889, '17'],
  [68888, '18'],
  [68887, '19'],
  [68886, '20'],
  [68885, '21'],
  [68884, '22'],
  [68883, '23'],
  [68882, '24'],
  [68881, '25'],
  [68880, '26'],
  [68879, '27'],
  [68878, '28'],
  [68877, '29'],
  [68876, '30'],
  [68875, '31'],
  [68874, '32'],
  [68873, '33'],
  [68872, '34'],
  [68871, '35'],
  [68870, '36'],
  [68869, '37'],
  [68868, '38'],
  [68867, '39'],
  [68866, '40'],
  [68865, '41'],
  [68864, '42'],
  [68863, '43'],
  [68862, '44'],
  [68861, '45'],
];

function decodeGbk(buf) {
  try {
    return execFileSync('iconv', ['-f', 'gbk', '-t', 'utf-8'], { input: buf }).toString('utf8');
  } catch {
    return buf.toString('utf8');
  }
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function parseArgs(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--') && i + 1 < argv.length) out[a.slice(2)] = argv[++i];
    else if (a.startsWith('--')) out[a.slice(2)] = true;
  }
  return out;
}

async function fetchGame(dpxqId) {
  const url = `http://www.dpxq.com/hldcg/search/view_u_${dpxqId}.html`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'xiangqi-manual-import/1.0 (personal offline study)' },
  });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
  return decodeGbk(Buffer.from(await res.arrayBuffer()));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const limit = args.limit ? Number(args.limit) : GAMES.length;
  const outDir = path.resolve(__dirname, '../src/data/manuals/ycql');
  fs.mkdirSync(outDir, { recursive: true });

  const index = [];
  const games = GAMES.slice(0, limit);

  for (const [dpxqId, num] of games) {
    const id = `ycql-${num}`;
    process.stdout.write(`Fetching ${id} (u_${dpxqId})… `);
    try {
      const text = await fetchGame(dpxqId);
      const manual = buildManual({
        text,
        id,
        tags: ['名局', '银川棋路'],
        source: `《银川棋路》第${Number(num)}局 · 东萍 u_${dpxqId}`,
      });
      // 标题带局号，便于列表识别
      if (!/^\d+\./.test(manual.title)) {
        manual.title = `${num}.${manual.title}`;
      }
      const outPath = path.join(outDir, `${id}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(manual, null, 2)}\n`);
      index.push({ id, title: manual.title, moves: manual.moves.length, side: manual.sideToMemorize });
      console.log(`ok ${manual.moves.length} moves · ${manual.sideToMemorize}`);
    } catch (err) {
      console.log(`FAIL ${err.message}`);
    }
    await sleep(400);
  }

  // 生成 ycql/index.ts
  const imports = index
    .map((g) => `import ${camel(g.id)} from './${g.id}.json';`)
    .join('\n');
  const arr = index.map((g) => `  ${camel(g.id)} as Manual,`).join('\n');
  const ts = `import type { Manual } from '../../../types/manual';\n\n${imports}\n\nexport const ycqlManuals: Manual[] = [\n${arr}\n];\n`;
  fs.writeFileSync(path.join(outDir, 'index.ts'), ts);
  console.log(`\nWrote ${index.length} manuals → ${outDir}`);
}

function camel(id) {
  return id.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
