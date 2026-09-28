/**
 * 补过宫炮 + 纯强 AI（引擎）对战棋谱
 *
 *   node scripts/fetch-guogong-ai.js
 *   node scripts/fetch-guogong-ai.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildManual } = require('./import-dhtmlxq');

const OUT_DIR = path.resolve(__dirname, '../src/data/manuals/modern');
const LAYOUT_BASE = 'http://www.dpxq.com/hldcg/share/chess_大师对局/按布局名称';
const EVENT_BASE = 'http://www.dpxq.com/hldcg/share/chess_大师对局/电脑象棋软件大赛';

const STAR_PLAYERS = [
  '王天一',
  '郑惟桐',
  '赵鑫鑫',
  '蒋川',
  '谢靖',
  '孙勇征',
  '汪洋',
  '孟辰',
  '王禹博',
  '许银川',
  '洪智',
  '赵国荣',
  '吕钦',
  '柳大华',
  '于幼华',
  '胡荣华',
  '徐天红',
  '陶汉明',
  '黄竹风',
  '谢岿',
  '党斐',
];

/** 过宫炮：先手局 + 后手应对 */
const GUOGONG_GROUPS = [
  {
    prefix: 'guogong',
    label: '过宫炮',
    tags: ['开局'],
    max: 20,
    folders: [
      'A60 过宫炮局',
      'A61 过宫炮对进左马',
      'A63 过宫炮对左中炮',
      'A64 过宫炮直车对左中炮',
      'A62 过宫炮对横车',
    ],
  },
  {
    prefix: 'feiguogong',
    label: '飞相对过宫炮',
    tags: ['开局'],
    max: 12,
    folders: ['A30 飞相对左过宫炮', 'A35 飞相对右过宫炮', 'A31 飞相进右马对左过宫炮'],
  },
];

/** 引擎 vs 引擎赛事（不含 LLM / 人机） */
const AI_EVENTS = [
  {
    prefix: 'ai2016',
    label: '楚河汉界2016',
    tags: ['AI对战'],
    path: '2016年楚河汉界杯亚洲象棋人工智能对决邀请赛',
    max: 20,
  },
  {
    prefix: 'ai2017',
    label: '楚河汉界2017',
    tags: ['AI对战'],
    path: '2017年第二届楚河汉界象棋人工智能对决',
    max: 10,
  },
  {
    prefix: 'ai2007',
    label: '电脑软件重庆争霸2007',
    tags: ['AI对战'],
    path: '2007年中国象棋电脑软件重庆争霸赛',
    max: 24,
  },
  {
    prefix: 'ai2007b',
    label: '计算机博弈锦标赛2007',
    tags: ['AI对战'],
    path: '2007年第02届全国象棋计算机博弈锦标赛',
    max: 10,
  },
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
    if (a.startsWith('--') && i + 1 < argv.length && !argv[i + 1].startsWith('--')) {
      out[a.slice(2)] = argv[++i];
    } else if (a.startsWith('--')) out[a.slice(2)] = true;
  }
  return out;
}

async function fetchHtml(url, retries = 5) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'xiangqi-manual-guogong-ai/1.0' },
      });
      if (res.status === 503 || res.status === 502 || res.status === 429) {
        await sleep(1000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      return decodeGbk(Buffer.from(await res.arrayBuffer()));
    } catch (err) {
      lastErr = err;
      await sleep(800 * (i + 1));
    }
  }
  throw lastErr || new Error(`fetch failed ${url}`);
}

function parseDatedRows(html) {
  const rows = [];
  const seen = new Set();
  const reEvent =
    /<td>(20\d\d-\d\d-\d\d)?<\/td><td[^>]*>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a><\/td><td>(\d+)<\/td>/g;
  let m;
  while ((m = reEvent.exec(html))) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    rows.push({
      date: m[1] || '',
      id: m[2],
      title: m[3].trim(),
      moves: Number(m[4]) || 0,
    });
  }
  if (rows.length) return rows;

  const reLoose =
    /<td>(20\d\d-\d\d-\d\d)<\/td>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a>/g;
  while ((m = reLoose.exec(html))) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    rows.push({ date: m[1], id: m[2], title: m[3].trim(), moves: 0 });
  }
  if (rows.length) return rows;

  const reAny = /view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a>/g;
  while ((m = reAny.exec(html))) {
    if (seen.has(m[1])) continue;
    seen.add(m[1]);
    rows.push({ date: '', id: m[1], title: m[2].trim(), moves: 0 });
  }
  return rows;
}

async function crawlPages(baseUrl, { maxPages = 10 } = {}) {
  const all = [];
  const seen = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = page <= 1 ? baseUrl : `${baseUrl}${page}.html`;
    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
    const rows = parseDatedRows(html);
    if (!rows.length) break;
    let added = 0;
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      all.push(row);
      added += 1;
    }
    if (added === 0) break;
    await sleep(180);
  }
  return all;
}

function existingDongpingIds() {
  const ids = new Set();
  for (const dir of [
    OUT_DIR,
    path.resolve(__dirname, '../src/data/manuals/ycql'),
  ]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const src = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8')).source || '';
      const m = src.match(/\b([mu])_(\d+)\b/);
      if (m) ids.add(m[2]);
    }
  }
  return ids;
}

function hasStar(title) {
  return STAR_PLAYERS.some((n) => (title || '').includes(n));
}

function pickGuogong(rows, max) {
  const recent = rows
    .filter((r) => !r.date || Number(r.date.slice(0, 4)) >= 2010)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const starred = recent.filter((r) => hasStar(r.title));
  const pool = starred.length >= Math.min(6, max) ? starred : recent;
  return pool.slice(0, max);
}

function nextSeq(prefix) {
  const nums = fs
    .readdirSync(OUT_DIR)
    .filter((n) => n.startsWith(`${prefix}-`) && n.endsWith('.json'))
    .map((n) => Number(n.replace(`${prefix}-`, '').replace('.json', '')))
    .filter((n) => Number.isFinite(n));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

function camel(id) {
  return id.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

function rebuildModernIndex() {
  const files = fs
    .readdirSync(OUT_DIR)
    .filter((n) => n.endsWith('.json'))
    .sort();
  const ids = files.map((n) => n.replace(/\.json$/, ''));
  const imports = ids.map((id) => `import ${camel(id)} from './${id}.json';`).join('\n');
  const arr = ids.map((id) => `  ${camel(id)} as Manual,`).join('\n');
  const ts = `import type { Manual } from '../../../types/manual';\n\n${imports}\n\nexport const modernManuals: Manual[] = [\n${arr}\n];\n`;
  fs.writeFileSync(path.join(OUT_DIR, 'index.ts'), ts);
  return ids.length;
}

async function importRows(rows, { prefix, label, tags, used, dry }) {
  let imported = 0;
  let failed = 0;
  let seq = nextSeq(prefix);
  for (const row of rows) {
    if (used.has(row.id)) continue;
    used.add(row.id);
    const id = `${prefix}-${String(seq).padStart(3, '0')}`;
    if (dry) {
      console.log(`    ${row.date || '?'} m_${row.id} ${row.title}`);
      imported += 1;
      seq += 1;
      continue;
    }
    process.stdout.write(`  import ${id} m_${row.id}… `);
    try {
      const url = `http://www.dpxq.com/hldcg/search/view_m_${row.id}.html`;
      const text = await fetchHtml(url);
      const manual = buildManual({
        text,
        id,
        title: row.title,
        tags,
        source: `${label} · 东萍 m_${row.id}${row.date ? ` · ${row.date}` : ''}`,
      });
      if (manual.moves.length < 8) {
        console.log(`skip short (${manual.moves.length})`);
        continue;
      }
      fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), `${JSON.stringify(manual, null, 2)}\n`);
      imported += 1;
      seq += 1;
      console.log(`ok ${manual.moves.length} · ${JSON.stringify(manual.opening || {})}`);
    } catch (err) {
      failed += 1;
      console.log(`FAIL ${err.message}`);
    }
    await sleep(280);
  }
  return { imported, failed };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dry = Boolean(args['dry-run']);
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const used = existingDongpingIds();
  console.log(`Existing dongping ids: ${used.size}`);

  let totalImp = 0;
  let totalFail = 0;

  for (const group of GUOGONG_GROUPS) {
    console.log(`\n== ${group.label} ==`);
    const pool = [];
    for (const folder of group.folders) {
      process.stdout.write(`  crawl ${folder}… `);
      try {
        const rows = await crawlPages(`${LAYOUT_BASE}/${folder}/全部/`);
        console.log(rows.length);
        pool.push(...rows);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
    }
    const picked = pickGuogong(pool, group.max).filter((r) => !used.has(r.id));
    console.log(`  picked ${picked.length}`);
    const { imported, failed } = await importRows(picked, {
      prefix: group.prefix,
      label: group.label,
      tags: group.tags,
      used,
      dry,
    });
    totalImp += imported;
    totalFail += failed;
  }

  for (const ev of AI_EVENTS) {
    console.log(`\n== AI ${ev.label} ==`);
    const listBase = `${EVENT_BASE}/${ev.path}/棋谱列表/`;
    process.stdout.write(`  crawl… `);
    let rows = [];
    try {
      rows = await crawlPages(listBase, { maxPages: 6 });
      console.log(rows.length);
    } catch (err) {
      console.log(`FAIL ${err.message}`);
      continue;
    }
    const picked = rows.filter((r) => !used.has(r.id)).slice(0, ev.max);
    console.log(`  picked ${picked.length}`);
    const { imported, failed } = await importRows(picked, {
      prefix: ev.prefix,
      label: ev.label,
      tags: ev.tags,
      used,
      dry,
    });
    totalImp += imported;
    totalFail += failed;
  }

  if (!dry) {
    const count = rebuildModernIndex();
    console.log(`\nRebuilt modern/index.ts (${count} manuals)`);
  }
  console.log(`\nDone${dry ? ' (dry-run)' : ''}: imported=${totalImp} fail=${totalFail}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
