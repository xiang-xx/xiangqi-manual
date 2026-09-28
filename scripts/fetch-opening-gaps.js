/**
 * 按布局补缺口棋谱：顺炮 / 列炮 / 单提马 / 三步虎 / 反宫马 / 仙人指路对飞象|中炮
 *
 *   node scripts/fetch-opening-gaps.js
 *   node scripts/fetch-opening-gaps.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildManual } = require('./import-dhtmlxq');

const OUT_DIR = path.resolve(__dirname, '../src/data/manuals/modern');
const LAYOUT_BASE = 'http://www.dpxq.com/hldcg/share/chess_大师对局/按布局名称';

/** 每组目标局数；优先近年大师局 */
const GROUPS = [
  {
    prefix: 'shun',
    label: '顺炮',
    tags: ['开局'],
    max: 18,
    folders: ['D10 顺炮直车对缓开车', 'D20 顺炮直车对横车', 'D04 顺炮横车对直车'],
  },
  {
    prefix: 'lie',
    label: '列炮',
    tags: ['开局'],
    max: 15,
    folders: ['D50 中炮对列炮', 'D31 中炮进三兵对左炮封车转列炮', 'D40 中炮对左三步虎转列炮'],
  },
  {
    prefix: 'danti',
    label: '单提马',
    tags: ['开局'],
    max: 15,
    folders: ['B10 中炮对单提马', 'B12 中炮对单提马横车'],
  },
  {
    prefix: 'sanbu',
    label: '三步虎',
    tags: ['开局'],
    max: 15,
    folders: ['B20 中炮对左三步虎', 'B22 中炮右横车对左三步虎'],
  },
  {
    prefix: 'fangong',
    label: '反宫马',
    tags: ['开局'],
    max: 12,
    folders: ['B31 中炮对反宫马', 'B40 五六炮对反宫马'],
  },
  {
    prefix: 'xianfei',
    label: '仙人指路对飞象',
    tags: ['开局'],
    max: 12,
    folders: ['E01 仙人指路对飞象', 'E02 仙人指路进右马对飞象'],
  },
  {
    prefix: 'xianzhong',
    label: '仙人指路对中炮',
    tags: ['开局'],
    max: 12,
    folders: ['E03 仙人指路对中炮'],
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
        headers: { 'User-Agent': 'xiangqi-manual-opening-gaps/1.0' },
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

function listUrl(folder, page) {
  const base = `${LAYOUT_BASE}/${folder}/全部/`;
  if (page <= 1) return base;
  return `${base}${page}.html`;
}

function parseListPage(html) {
  const rows = [];
  const seen = new Set();
  const re =
    /<td>(20\d\d-\d\d-\d\d)<\/td>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a>/g;
  let m;
  while ((m = re.exec(html))) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    rows.push({ date: m[1], id: m[2], title: m[3].trim() });
  }
  return rows;
}

async function crawlFolder(folder, { maxPages = 8 } = {}) {
  const all = [];
  const seen = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = listUrl(folder, page);
    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
    const rows = parseListPage(html);
    if (rows.length === 0) break;
    let added = 0;
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      all.push(row);
      added += 1;
    }
    if (added === 0) break;
    await sleep(200);
  }
  return all;
}

function existingDongpingIds() {
  const ids = new Set();
  for (const dir of [
    path.resolve(__dirname, '../src/data/manuals/modern'),
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

const STAR_PLAYERS = [
  '王天一',
  '郑惟桐',
  '赵鑫鑫',
  '蒋川',
  '谢靖',
  '孙勇征',
  '汪洋',
  '徐超',
  '孟辰',
  '王禹博',
  '许银川',
  '洪智',
  '赵国荣',
  '吕钦',
  '许国义',
  '郝继超',
  '黄竹风',
  '徐超',
  '程进超',
  '赵金成',
  '金波',
  '谢岿',
  '孙浩宇',
  '陆伟韬',
  '徐超',
  '李少庚',
  '聂铁文',
  '陶汉明',
  '于幼华',
  '刘大华',
  '柳大华',
  '胡荣华',
  '徐天红',
  '陶汉明',
  '庄玉庭',
  '万春林',
  '苗永鹏',
  '张申宏',
  '党斐',
  '赵玮',
  '徐超',
  '蒋川',
];

function hasStar(title) {
  return STAR_PLAYERS.some((n) => (title || '').includes(n));
}

function pickRecent(rows, max, minYear = 2010) {
  const recent = rows
    .filter((r) => Number((r.date || '').slice(0, 4)) >= minYear)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  const starred = recent.filter((r) => hasStar(r.title));
  const pool = starred.length >= Math.min(8, max) ? starred : recent;
  return pool.slice(0, max);
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

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dry = Boolean(args['dry-run']);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const used = existingDongpingIds();
  console.log(`Existing dongping ids: ${used.size}`);

  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const group of GROUPS) {
    console.log(`\n== ${group.label} ==`);
    const pool = [];
    for (const folder of group.folders) {
      process.stdout.write(`  crawl ${folder}… `);
      try {
        const rows = await crawlFolder(folder);
        console.log(rows.length);
        pool.push(...rows);
      } catch (err) {
        console.log(`FAIL ${err.message}`);
      }
    }

    const picked = pickRecent(pool, group.max * 3).filter((r) => {
      if (used.has(r.id)) return false;
      used.add(r.id);
      return true;
    }).slice(0, group.max);

    console.log(`  picked ${picked.length}`);
    if (dry) {
      for (const r of picked.slice(0, 5)) console.log(`    ${r.date} m_${r.id} ${r.title}`);
      continue;
    }

    let seq = 1;
    // continue numbering if prefix files already exist
    const existingSeq = fs
      .readdirSync(OUT_DIR)
      .filter((n) => n.startsWith(`${group.prefix}-`) && n.endsWith('.json'))
      .map((n) => Number(n.replace(`${group.prefix}-`, '').replace('.json', '')))
      .filter((n) => Number.isFinite(n));
    if (existingSeq.length) seq = Math.max(...existingSeq) + 1;

    for (const row of picked) {
      const id = `${group.prefix}-${String(seq).padStart(3, '0')}`;
      process.stdout.write(`  import ${id} m_${row.id}… `);
      try {
        const url = `http://www.dpxq.com/hldcg/search/view_m_${row.id}.html`;
        const text = await fetchHtml(url);
        const manual = buildManual({
          text,
          id,
          title: row.title,
          tags: group.tags,
          source: `${group.label} · 东萍 m_${row.id} · ${row.date}`,
        });
        if (manual.moves.length < 8) {
          console.log(`skip short (${manual.moves.length})`);
          skipped += 1;
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
  }

  if (!dry) {
    // Fix legacy 顺炮-as-red-only on existing manuals
    for (const dir of [OUT_DIR, path.resolve(__dirname, '../src/data/manuals/ycql')]) {
      for (const name of fs.readdirSync(dir)) {
        if (!name.endsWith('.json')) continue;
        const file = path.join(dir, name);
        const manual = JSON.parse(fs.readFileSync(file, 'utf8'));
        if (manual.opening?.red === '顺炮' && !manual.opening.black) {
          manual.opening = { red: '中炮', black: '顺炮' };
          fs.writeFileSync(file, `${JSON.stringify(manual, null, 2)}\n`);
          console.log(`fix 顺炮 ${manual.id}`);
        }
      }
    }

    const count = rebuildModernIndex();
    console.log(`\nRebuilt modern/index.ts (${count} manuals)`);
  }

  console.log(`\nDone${dry ? ' (dry-run)' : ''}: imported=${imported} skip=${skipped} fail=${failed}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
