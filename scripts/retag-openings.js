/**
 * 回填 opening：从东萍拉 open，写入 Manual.opening，并去掉扁平开局 tag。
 *
 *   node scripts/retag-openings.js
 *   node scripts/retag-openings.js --dry-run
 *   node scripts/retag-openings.js --limit 5
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { parseDongpingOpen, stripLegacyOpeningTags } = require('./openings');

const ROOT = path.resolve(__dirname, '..');
const MANUAL_DIRS = [
  path.join(ROOT, 'src/data/manuals/modern'),
  path.join(ROOT, 'src/data/manuals/ycql'),
];

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

function extractTag(text, name) {
  const re = new RegExp(`\\[DhtmlXQ_${name}\\]([\\s\\S]*?)\\[/DhtmlXQ_${name}\\]`, 'i');
  const m = text.match(re);
  return m ? m[1].replace(/\|\|/g, '\n').trim() : '';
}

function extractOpenFromPage(text) {
  let open = extractTag(text, 'open');
  if (open) return open;
  const js = text.match(/var DhtmlXQ_open\s*=\s*'([^']*)'/i);
  if (js) {
    const payload = js[1];
    return (
      payload.match(/\[DhtmlXQ_open\]([\s\S]*?)\[\/DhtmlXQ_open\]/i)?.[1]?.trim() ||
      payload.replace(/\[\/?DhtmlXQ_open\]/gi, '').trim()
    );
  }
  return '';
}

function dpxqRef(source) {
  const m = (source || '').match(/\b([mu])_(\d+)\b/);
  if (!m) return null;
  return { kind: m[1], id: m[2] };
}

function viewUrl(ref) {
  return `http://www.dpxq.com/hldcg/search/view_${ref.kind}_${ref.id}.html`;
}

async function fetchHtml(url, retries = 6) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'xiangqi-manual-retag/1.0 (personal offline study)' },
      });
      if (res.status === 503 || res.status === 502 || res.status === 429) {
        await sleep(1200 * (i + 1));
        continue;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status} ${url}`);
      const text = decodeGbk(Buffer.from(await res.arrayBuffer()));
      if (/服务不可用|Service Unavailable/i.test(text) && text.length < 200) {
        await sleep(1200 * (i + 1));
        continue;
      }
      return text;
    } catch (err) {
      lastErr = err;
      await sleep(1000 * (i + 1));
    }
  }
  throw lastErr || new Error(`fetch failed ${url}`);
}

function listManualFiles() {
  const files = [];
  for (const dir of MANUAL_DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir).sort()) {
      if (name.endsWith('.json')) files.push(path.join(dir, name));
    }
  }
  return files;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const dryRun = Boolean(args['dry-run']);
  const limit = args.limit ? Number(args.limit) : Infinity;

  const files = listManualFiles().slice(0, limit);
  let updated = 0;
  let withOpening = 0;
  let missingOpen = 0;
  let errors = 0;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const manual = JSON.parse(fs.readFileSync(file, 'utf8'));
    const ref = dpxqRef(manual.source);
    if (!ref) {
      console.warn(`skip ${manual.id}: no dpxq id in source`);
      errors += 1;
      continue;
    }

    try {
      const html = await fetchHtml(viewUrl(ref));
      const openRaw = extractOpenFromPage(html);
      const opening = parseDongpingOpen(openRaw);
      const tags = stripLegacyOpeningTags(manual.tags);

      const next = { ...manual, tags };
      if (Object.keys(opening).length) {
        next.opening = opening;
        withOpening += 1;
      } else {
        delete next.opening;
        missingOpen += 1;
      }

      // Stable key order: id, title, tags, opening, ...
      const ordered = {
        id: next.id,
        title: next.title,
        tags: next.tags,
        ...(next.opening ? { opening: next.opening } : {}),
        sideToMemorize: next.sideToMemorize,
        ...(next.defaultFlipped != null ? { defaultFlipped: next.defaultFlipped } : {}),
        startFen: next.startFen,
        moves: next.moves,
        ...(next.comments && Object.keys(next.comments).length
          ? { comments: next.comments }
          : {}),
        ...(next.source ? { source: next.source } : {}),
      };

      const label = openRaw
        ? `${openRaw} → ${JSON.stringify(opening)}`
        : '(no open)';
      console.log(`[${i + 1}/${files.length}] ${manual.id} ${label}`);

      if (!dryRun) {
        fs.writeFileSync(file, `${JSON.stringify(ordered, null, 2)}\n`);
      }
      updated += 1;
      await sleep(200);
    } catch (err) {
      errors += 1;
      console.error(`fail ${manual.id}:`, err.message || err);
    }
  }

  console.log(
    `\nDone${dryRun ? ' (dry-run)' : ''}: ${updated} files, opening=${withOpening}, emptyOpen=${missingOpen}, errors=${errors}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
