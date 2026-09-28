/**
 * 导入 AI 时代棋谱：个人赛精选 + 王天一/郑惟桐近年 + 碧桂园杯 2020+
 *
 *   node scripts/fetch-modern-ai.js
 *   node scripts/fetch-modern-ai.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildManual } = require('./import-dhtmlxq');

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
];

const SOURCES = {
  grs2025: {
    label: '个人赛2025',
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/全国象棋个人赛/2025年民生实业杯全国象棋个人赛/棋谱列表/',
    tags: ['AI时代', '个人赛', '个人赛2025'],
    max: 40,
    pick: pickPersonal2025,
  },
  grs2023: {
    label: '个人赛2023',
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/全国象棋个人赛/2023年贵州王道酒业杯全国象棋个人赛/棋谱列表/',
    tags: ['AI时代', '个人赛', '个人赛2023'],
    max: 40,
    pick: pickPersonal2023,
  },
  wang: {
    label: '王天一',
    listBase: 'http://www.dpxq.com/hldcg/share/chess_大师对局/按棋手姓名/王天一/全部对局/',
    tags: ['AI时代', '王天一'],
    max: 30,
    focusPlayers: ['王天一'],
    pick: (rows) => pickByYear(rows, 2022, 30),
  },
  zheng: {
    label: '郑惟桐',
    listBase: 'http://www.dpxq.com/hldcg/share/chess_大师对局/按棋手姓名/郑惟桐/全部对局/',
    tags: ['AI时代', '郑惟桐'],
    max: 30,
    focusPlayers: ['郑惟桐'],
    pick: (rows) => pickByYear(rows, 2022, 30),
  },
  bgy2020: {
    label: '碧桂园2020',
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/其他大师或以上级别大赛/2020年第09届碧桂园杯全国象棋冠军邀请赛/棋谱列表/',
    tags: ['AI时代', '碧桂园杯', '碧桂园2020'],
    max: 80,
    pick: (rows) => rows.slice(0, 80),
  },
  bgy2021: {
    label: '碧桂园2021',
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/其他大师或以上级别大赛/2021年第10届碧桂园杯全国象棋冠军邀请赛/棋谱列表/',
    tags: ['AI时代', '碧桂园杯', '碧桂园2021'],
    max: 80,
    pick: (rows) => rows.slice(0, 80),
  },
};

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

function listUrl(base, page) {
  if (page <= 1) return base;
  return base.endsWith('/') ? `${base}${page}.html` : `${base}/${page}.html`;
}

function parseListPage(html) {
  const rows = [];
  const seen = new Set();

  // Event list: date | title link | moves | round | group | table | hits
  const reEvent =
    /<td>(20\d\d-\d\d-\d\d)<\/td><td[^>]*>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a><\/td><td>(\d+)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/g;
  let m;
  while ((m = reEvent.exec(html))) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    rows.push({
      date: m[1],
      id: m[2],
      title: m[3].trim(),
      moves: Number(m[4]),
      round: m[5].trim(),
      group: m[6].trim(),
    });
  }

  // Player list: date | event | round | title | hits (no move count)
  if (rows.length === 0) {
    const rePlayer =
      /<td>(20\d\d-\d\d-\d\d)<\/td>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a><\/td><td>(\d+)<\/td>/g;
    while ((m = rePlayer.exec(html))) {
      if (seen.has(m[2])) continue;
      seen.add(m[2]);
      rows.push({
        date: m[1],
        id: m[2],
        title: m[3].trim(),
        moves: 0,
        round: '',
        group: '',
        hits: Number(m[4]),
      });
    }
  }

  return rows;
}

async function fetchHtml(url, retries = 4) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'xiangqi-manual-import/1.0 (personal offline study)' },
      });
      if (res.status === 503 || res.status === 502) {
        await sleep(800 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      const text = decodeGbk(Buffer.from(await res.arrayBuffer()));
      if (/服务不可用|Service Unavailable/i.test(text) && text.length < 200) {
        await sleep(800 * (i + 1));
        continue;
      }
      return text;
    } catch (err) {
      lastErr = err;
      await sleep(600 * (i + 1));
    }
  }
  throw lastErr || new Error(`fetch failed ${url}`);
}

async function crawlList(base, { maxPages = 25 } = {}) {
  const all = [];
  const seen = new Set();

  for (let page = 1; page <= maxPages; page++) {
    const url = listUrl(base, page);
    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      if (page === 1) throw err;
      console.log(`  stop at p${page}: ${err.message}`);
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
    const recent = rows.filter((r) => Number((r.date || '').slice(0, 4)) >= 2022).length;
    process.stdout.write(
      `  list p${page}: +${added} (unique ${all.length}, page recent ${recent})\n`,
    );
    if (added === 0) break;
    if (!/下一页/.test(html)) break;
    if (rows.length < 40) break;
    await sleep(350);
  }
  return all;
}

function hasStar(title) {
  return STAR_PLAYERS.some((n) => title.includes(n));
}

function pickPersonal2025(rows) {
  const knockout = rows.filter(
    (r) =>
      /男子/.test(r.group) &&
      /决赛|半决赛|8进4|16进8|5-8|5-6|7-8|季殿|季军|殿军/.test(r.round),
  );
  const rest = rows.filter(
    (r) => /男子/.test(r.group) && hasStar(r.title) && !knockout.includes(r),
  );
  return [...knockout, ...rest].slice(0, 40);
}

function pickPersonal2023(rows) {
  const late = rows.filter(
    (r) =>
      /男子甲/.test(r.group) &&
      (/第(0?[8-9]|1[0-1])轮/.test(r.round) || hasStar(r.title)),
  );
  const starred = late.filter((r) => hasStar(r.title));
  const pool = starred.length >= 20 ? starred : late;
  return pool.slice(0, 40);
}

function pickByYear(rows, minYear, max) {
  const filtered = rows
    .filter((r) => Number((r.date || '').slice(0, 4)) >= minYear)
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return filtered.slice(0, max);
}

function camel(id) {
  return id.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

async function importGame(row, meta, seq) {
  const url = `http://www.dpxq.com/hldcg/search/view_m_${row.id}.html`;
  const text = await fetchHtml(url);
  const id = `${meta.prefix}-${String(seq).padStart(3, '0')}`;
  const manual = buildManual({
    text,
    id,
    title: row.title,
    tags: meta.tags,
    focusPlayers: meta.focusPlayers,
    source: `${meta.label} · 东萍 m_${row.id}${row.date ? ` · ${row.date}` : ''}`,
  });
  if (row.round) {
    manual.title = `${row.title}`;
  }
  return manual;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dry = !!args['dry-run'];
  const outDir = path.resolve(__dirname, '../src/data/manuals/modern');
  fs.mkdirSync(outDir, { recursive: true });

  const selected = [];
  const usedIds = new Set();

  for (const [key, cfg] of Object.entries(SOURCES)) {
    console.log(`\n== ${cfg.label} ==`);
    const isPlayer = key === 'wang' || key === 'zheng';
    const rows = await crawlList(cfg.listBase, { maxPages: isPlayer ? 20 : 12 });
    const picked = cfg.pick(rows).filter((r) => {
      if (usedIds.has(r.id)) return false;
      usedIds.add(r.id);
      return true;
    });
    console.log(`  picked ${picked.length}/${rows.length}`);
    selected.push(
      ...picked.map((row, i) => ({
        row,
        meta: {
          label: cfg.label,
          tags: cfg.tags,
          focusPlayers: cfg.focusPlayers,
          prefix: key.replace(/[^a-z0-9]/gi, ''),
          key,
        },
        seq: i + 1,
      })),
    );
  }

  console.log(`\nTotal unique games to import: ${selected.length}`);
  if (dry) {
    for (const item of selected.slice(0, 20)) {
      console.log(`  ${item.meta.key} ${item.row.id} ${item.row.date || ''} ${item.row.title}`);
    }
    return;
  }

  const index = [];
  let ok = 0;
  let fail = 0;

  for (const item of selected) {
    const idHint = `${item.meta.prefix}-${String(item.seq).padStart(3, '0')}`;
    process.stdout.write(`Import ${idHint} m_${item.row.id}… `);
    try {
      const manual = await importGame(item.row, item.meta, item.seq);
      // skip tiny fragments
      if (manual.moves.length < 8) {
        console.log(`skip short (${manual.moves.length})`);
        continue;
      }
      const outPath = path.join(outDir, `${manual.id}.json`);
      fs.writeFileSync(outPath, `${JSON.stringify(manual, null, 2)}\n`);
      index.push({ id: manual.id, title: manual.title, moves: manual.moves.length });
      ok += 1;
      console.log(`ok ${manual.moves.length} · ${manual.sideToMemorize}`);
    } catch (err) {
      fail += 1;
      console.log(`FAIL ${err.message}`);
    }
    await sleep(350);
  }

  // generate index.ts
  const imports = index
    .map((g) => `import ${camel(g.id)} from './${g.id}.json';`)
    .join('\n');
  const arr = index.map((g) => `  ${camel(g.id)} as Manual,`).join('\n');
  const ts = `import type { Manual } from '../../../types/manual';\n\n${imports}\n\nexport const modernManuals: Manual[] = [\n${arr}\n];\n`;
  fs.writeFileSync(path.join(outDir, 'index.ts'), ts);

  console.log(`\nDone: ${ok} ok, ${fail} fail → ${outDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
