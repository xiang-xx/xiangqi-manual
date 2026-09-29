/**
 * 近 5 年高分名局补库（7 套餐）
 *
 *   node scripts/fetch-recent-elite.js
 *   node scripts/fetch-recent-elite.js --dry-run
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { buildManual } = require('./import-dhtmlxq');

const OUT_DIR = path.resolve(__dirname, '../src/data/manuals/modern');
const LAYOUT_BASE = 'http://www.dpxq.com/hldcg/share/chess_大师对局/按布局名称';

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
  '郝继超',
  '黄竹风',
  '赵金成',
  '武俊强',
  '申鹏',
  '曹岩磊',
  '孟繁睿',
  '刘柏宏',
  '黄光颖',
  '许国义',
  '程宇东',
];

/** @type {Array<{
 *   prefix: string;
 *   label: string;
 *   tags: string[];
 *   listBase?: string;
 *   maxPages?: number;
 *   max: number;
 *   pick: (rows: any[]) => any[];
 *   openingFolders?: string[];
 *   minYear?: number;
 * }>} */
const PACKAGES = [
  {
    prefix: 'dqs2021',
    label: '大棋圣战2021',
    tags: ['大棋圣战', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/其他大师或以上级别大赛/2021年“花木杯”第六届全国象棋大棋圣战/棋谱列表/',
    maxPages: 4,
    max: 8,
    pick: (rows) =>
      rows
        .filter(
          (r) =>
            /决赛|半决赛/.test(r.round) &&
            (r.title.includes('王天一') || r.title.includes('郑惟桐')),
        )
        .slice(0, 8),
  },
  {
    prefix: 'jia2022f',
    label: '甲级联赛2022决赛',
    tags: ['甲级联赛', '甲级2022', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/全国象棋甲级联赛/2022年腾讯棋牌天天象棋全国象棋甲级联赛/棋谱列表/',
    maxPages: 10,
    max: 12,
    pick: (rows) =>
      rows
        .filter((r) => /决赛/.test(r.round) && hasStar(r.title))
        .slice(0, 12),
  },
  {
    prefix: 'sh2022f',
    label: '上海杯2022决赛',
    tags: ['上海杯', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/其他大师或以上级别大赛/2022年第二届上海杯象棋大师公开赛/棋谱列表/',
    maxPages: 4,
    max: 8,
    allowExisting: true,
    pick: (rows) => {
      const finals = rows.filter(
        (r) => /决赛/.test(r.round) && /专业男子|男子/.test(r.group + r.round) && hasStar(r.title),
      );
      const wangZheng = rows.filter(
        (r) =>
          /决赛/.test(r.round) &&
          (r.title.includes('王天一') || r.title.includes('郑惟桐')),
      );
      return uniqueRows([...wangZheng, ...finals]).slice(0, 8);
    },
  },
  {
    prefix: 'jia2023k',
    label: '甲级联赛2023关键局',
    tags: ['甲级联赛', '甲级2023', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/全国象棋甲级联赛/2023年腾讯棋牌天天象棋全国象棋甲级联赛/棋谱列表/',
    maxPages: 12,
    max: 15,
    pick: (rows) => {
      const knockout = rows.filter(
        (r) =>
          /决赛|半决赛|季殿|季军|殿军|3-4|5-6|7-8/.test(r.round) && starCount(r.title) >= 1,
      );
      const starred = rows.filter((r) => starCount(r.title) >= 2 && !knockout.includes(r));
      return [...knockout, ...starred].slice(0, 15);
    },
  },
  {
    prefix: 'wtlq2024',
    label: '王天一吕钦三番棋2024',
    tags: ['约战', '王天一', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/网络赛事/2024年王天一吕钦三番棋约战/棋谱列表/',
    maxPages: 2,
    max: 3,
    pick: (rows) => rows.slice(0, 3),
    /** 已在王天一精选里：仍 enrich tags */
    allowExisting: true,
  },
  {
    prefix: 'tt2024',
    label: '天天象棋杯2024精选',
    tags: ['天天象棋杯', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/网络赛事/2024年天天象棋杯象棋大师邀请赛/棋谱列表/',
    maxPages: 6,
    max: 10,
    pick: (rows) => {
      const late = rows.filter(
        (r) => /决赛|半决赛|8进4|4进2|季殿|季军|殿军/.test(r.round) && hasStar(r.title),
      );
      const dual = rows.filter((r) => starCount(r.title) >= 2);
      return uniqueRows([...late, ...dual]).slice(0, 10);
    },
  },
  {
    prefix: 'hesui2024',
    label: '贺岁杯2024',
    tags: ['贺岁杯', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/其他大师或以上级别大赛/2024年深圳“贺岁杯”象棋特级大师快棋邀请赛/棋谱列表/',
    maxPages: 2,
    max: 8,
    pick: (rows) => rows.filter((r) => hasStar(r.title)).slice(0, 8),
  },
  {
    prefix: 'jia2025',
    label: '甲级联赛2025精选',
    tags: ['甲级联赛', '甲级2025', '名局'],
    listBase:
      'http://www.dpxq.com/hldcg/share/chess_大师对局/全国象棋甲级联赛/2025年全国象棋男子甲级联赛/棋谱列表/',
    maxPages: 10,
    max: 12,
    pick: (rows) => {
      const late = rows.filter(
        (r) => /决赛|半决赛|季殿|季军|殿军/.test(r.round) && hasStar(r.title),
      );
      const dual = rows.filter((r) => starCount(r.title) >= 2 && !late.includes(r));
      return [...late, ...dual].slice(0, 12);
    },
  },
  // 开局补强：近年特大实战
  {
    prefix: 'shun',
    label: '顺炮近年',
    tags: ['开局', '名局'],
    openingFolders: ['D10 顺炮直车对缓开车', 'D20 顺炮直车对横车', 'D04 顺炮横车对直车'],
    minYear: 2021,
    max: 5,
    pick: (rows) => pickOpening(rows, 5, 2021),
  },
  {
    prefix: 'lie',
    label: '列炮近年',
    tags: ['开局', '名局'],
    openingFolders: ['D50 中炮对列炮', 'D31 中炮进三兵对左炮封车转列炮'],
    minYear: 2021,
    max: 4,
    pick: (rows) => pickOpening(rows, 4, 2021),
  },
  {
    prefix: 'guogong',
    label: '过宫炮近年',
    tags: ['开局', '名局'],
    openingFolders: [
      'A60 过宫炮局',
      'A61 过宫炮对进左马',
      'A63 过宫炮对左中炮',
      'A64 过宫炮直车对左中炮',
    ],
    minYear: 2021,
    max: 5,
    pick: (rows) => pickOpening(rows, 5, 2021),
  },
  {
    prefix: 'fangong',
    label: '反宫马近年',
    tags: ['开局', '名局'],
    openingFolders: ['B31 中炮对反宫马', 'B40 五六炮对反宫马'],
    minYear: 2021,
    max: 4,
    pick: (rows) => pickOpening(rows, 4, 2021),
  },
  {
    prefix: 'sanbu',
    label: '三步虎近年',
    tags: ['开局', '名局'],
    openingFolders: ['B20 中炮对左三步虎', 'B22 中炮右横车对左三步虎'],
    minYear: 2021,
    max: 4,
    pick: (rows) => pickOpening(rows, 4, 2021),
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

function hasStar(title) {
  return STAR_PLAYERS.some((n) => (title || '').includes(n));
}

function starCount(title) {
  return STAR_PLAYERS.filter((n) => (title || '').includes(n)).length;
}

function uniqueRows(rows) {
  const seen = new Set();
  const out = [];
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    out.push(r);
  }
  return out;
}

function pickOpening(rows, max, minYear, maxYear = 2026) {
  const recent = rows
    .filter((r) => {
      const y = Number(String(r.date || '').slice(0, 4));
      return y >= minYear && y <= maxYear && hasStar(r.title);
    })
    .sort((a, b) => String(b.date).localeCompare(String(a.date)));
  return recent.slice(0, max);
}

async function fetchHtml(url, retries = 5) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'xiangqi-manual-recent-elite/1.0' },
      });
      if (res.status === 503 || res.status === 502 || res.status === 429) {
        await sleep(1000 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      const text = decodeGbk(Buffer.from(await res.arrayBuffer()));
      if (/服务不可用|Service Unavailable/i.test(text) && text.length < 200) {
        await sleep(1000 * (i + 1));
        continue;
      }
      return text;
    } catch (err) {
      lastErr = err;
      await sleep(800 * (i + 1));
    }
  }
  throw lastErr || new Error(`fetch failed ${url}`);
}

function listUrl(base, page) {
  if (page <= 1) return base;
  return base.endsWith('/') ? `${base}${page}.html` : `${base}/${page}.html`;
}

function parseEventListPage(html) {
  const rows = [];
  const seen = new Set();
  // 日期可能带时段：2021-10-28 08:30-11:30 / 2025-12-01 15:00
  const reEvent =
    /<td>(20\d\d-\d\d-\d\d[^<]*)<\/td><td[^>]*>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a><\/td><td>(\d+)<\/td><td>([^<]*)<\/td><td>([^<]*)<\/td>/g;
  let m;
  while ((m = reEvent.exec(html))) {
    if (seen.has(m[2])) continue;
    seen.add(m[2]);
    rows.push({
      date: m[1].trim().slice(0, 10),
      id: m[2],
      title: m[3].trim(),
      moves: Number(m[4]),
      round: m[5].trim(),
      group: m[6].trim(),
    });
  }
  if (rows.length === 0) {
    const reLoose =
      /<td>(20\d\d-\d\d-\d\d[^<]*)<\/td>[\s\S]*?view_m_(\d+)\.html"[^>]*>\s*([^<]+)<\/a>/g;
    while ((m = reLoose.exec(html))) {
      if (seen.has(m[2])) continue;
      seen.add(m[2]);
      rows.push({
        date: m[1].trim().slice(0, 10),
        id: m[2],
        title: m[3].trim(),
        moves: 0,
        round: '',
        group: '',
      });
    }
  }
  return rows;
}

async function crawlEventList(base, { maxPages = 8 } = {}) {
  const all = [];
  const seen = new Set();
  for (let page = 1; page <= maxPages; page++) {
    const url = listUrl(base, page);
    let html;
    try {
      html = await fetchHtml(url);
    } catch (err) {
      if (page === 1) throw err;
      break;
    }
    const rows = parseEventListPage(html);
    if (rows.length === 0) break;
    let added = 0;
    for (const row of rows) {
      if (seen.has(row.id)) continue;
      seen.add(row.id);
      all.push(row);
      added += 1;
    }
    process.stdout.write(`  list p${page}: +${added} (unique ${all.length})\n`);
    if (added === 0) break;
    if (!/下一页/.test(html)) break;
    if (rows.length < 30) break;
    await sleep(280);
  }
  return all;
}

async function crawlOpeningFolders(folders, { maxPages = 6, minYear = 2021 } = {}) {
  const all = [];
  const seen = new Set();
  for (const folder of folders) {
    for (let page = 1; page <= maxPages; page++) {
      const base = `${LAYOUT_BASE}/${folder}/全部/`;
      const url = listUrl(base, page);
      let html;
      try {
        html = await fetchHtml(url);
      } catch (err) {
        if (page === 1) console.log(`    FAIL ${folder}: ${err.message}`);
        break;
      }
      const rows = parseEventListPage(html);
      if (rows.length === 0) break;
      let added = 0;
      for (const row of rows) {
        if (seen.has(row.id)) continue;
        if (Number((row.date || '').slice(0, 4)) < minYear) continue;
        seen.add(row.id);
        all.push(row);
        added += 1;
      }
      if (added === 0 && rows.every((r) => Number((r.date || '').slice(0, 4)) < minYear)) break;
      await sleep(200);
    }
  }
  return all;
}

function existingDongpingMap() {
  /** @type {Map<string, string>} dongpingId -> local file id */
  const map = new Map();
  for (const dir of [
    path.resolve(__dirname, '../src/data/manuals/modern'),
    path.resolve(__dirname, '../src/data/manuals/ycql'),
  ]) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const manual = JSON.parse(fs.readFileSync(path.join(dir, name), 'utf8'));
      const m = (manual.source || '').match(/\b([mu])_(\d+)\b/);
      if (m) map.set(m[2], path.join(dir, name));
    }
  }
  return map;
}

function enrichTags(filePath, tags) {
  const manual = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const before = new Set(manual.tags || []);
  let changed = false;
  for (const t of tags) {
    if (!before.has(t)) {
      before.add(t);
      changed = true;
    }
  }
  if (!changed) return false;
  manual.tags = [...before];
  fs.writeFileSync(filePath, `${JSON.stringify(manual, null, 2)}\n`);
  return true;
}

function camel(id) {
  return id.replace(/-([a-z0-9])/gi, (_, c) => c.toUpperCase());
}

function nextSeq(prefix) {
  const existing = fs
    .readdirSync(OUT_DIR)
    .filter((n) => n.startsWith(`${prefix}-`) && n.endsWith('.json'))
    .map((n) => Number(n.replace(`${prefix}-`, '').replace('.json', '')))
    .filter((n) => Number.isFinite(n));
  return existing.length ? Math.max(...existing) + 1 : 1;
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

  const existing = existingDongpingMap();
  const used = new Set(existing.keys());
  console.log(`Existing dongping ids: ${used.size}`);

  let imported = 0;
  let enriched = 0;
  let skipped = 0;
  let failed = 0;

  for (const pkg of PACKAGES) {
    console.log(`\n== ${pkg.label} ==`);
    let rows = [];
    try {
      if (pkg.openingFolders) {
        rows = await crawlOpeningFolders(pkg.openingFolders, {
          minYear: pkg.minYear || 2021,
        });
        console.log(`  crawled openings: ${rows.length}`);
      } else {
        rows = await crawlEventList(pkg.listBase, { maxPages: pkg.maxPages || 8 });
      }
    } catch (err) {
      console.log(`  SKIP package crawl: ${err.message}`);
      continue;
    }

    const picked = pkg.pick(rows).slice(0, pkg.max);
    const fresh = [];
    for (const r of picked) {
      if (existing.has(r.id) || used.has(r.id)) {
        if (pkg.allowExisting || existing.has(r.id)) {
          const file = existing.get(r.id);
          if (file && !dry && enrichTags(file, pkg.tags)) {
            enriched += 1;
            console.log(`  enrich ${path.basename(file)} +tags`);
          } else if (dry && file) {
            console.log(`  would-enrich ${path.basename(file)} m_${r.id}`);
          }
        }
        continue;
      }
      used.add(r.id);
      fresh.push(r);
    }

    console.log(`  picked ${picked.length}/${rows.length} → new ${fresh.length}`);
    if (dry) {
      for (const r of fresh.slice(0, 8)) {
        console.log(`    ${r.date || ''} ${r.round || ''} m_${r.id} ${r.title}`);
      }
      continue;
    }

    let seq = nextSeq(pkg.prefix);
    for (const row of fresh) {
      const id = `${pkg.prefix}-${String(seq).padStart(3, '0')}`;
      process.stdout.write(`  import ${id} m_${row.id}… `);
      try {
        const url = `http://www.dpxq.com/hldcg/search/view_m_${row.id}.html`;
        const text = await fetchHtml(url);
        const manual = buildManual({
          text,
          id,
          title: row.title,
          tags: pkg.tags,
          source: `${pkg.label} · 东萍 m_${row.id}${row.date ? ` · ${row.date}` : ''}`,
        });
        if (manual.moves.length < 8) {
          console.log(`skip short (${manual.moves.length})`);
          skipped += 1;
          continue;
        }
        fs.writeFileSync(path.join(OUT_DIR, `${id}.json`), `${JSON.stringify(manual, null, 2)}\n`);
        existing.set(row.id, path.join(OUT_DIR, `${id}.json`));
        imported += 1;
        seq += 1;
        console.log(`ok ${manual.moves.length}`);
      } catch (err) {
        failed += 1;
        console.log(`FAIL ${err.message}`);
      }
      await sleep(300);
    }
  }

  if (!dry) {
    const count = rebuildModernIndex();
    console.log(`\nRebuilt modern/index.ts (${count} manuals)`);
  }

  console.log(
    `\nDone${dry ? ' (dry-run)' : ''}: imported=${imported} enriched=${enriched} skip=${skipped} fail=${failed}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
