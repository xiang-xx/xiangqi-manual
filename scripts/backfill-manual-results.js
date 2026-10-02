#!/usr/bin/env node
/**
 * 从标题「红方 胜/负/和 黑方」回填 Manual.result。
 * Usage: node scripts/backfill-manual-results.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const DIRS = [
  path.join(ROOT, 'src/data/manuals/modern'),
  path.join(ROOT, 'src/data/manuals/ycql'),
];

const TITLE_RESULT_RE = /^(.+?)\s+(胜|负|和)\s+(.+)$/;

function parseResultFromTitle(title) {
  const m = TITLE_RESULT_RE.exec(String(title || '').trim());
  if (!m) return null;
  if (m[2] === '和') return 'draw';
  if (m[2] === '胜') return 'red';
  if (m[2] === '负') return 'black';
  return null;
}

function main() {
  let updated = 0;
  let skipped = 0;
  let unchanged = 0;

  for (const dir of DIRS) {
    if (!fs.existsSync(dir)) continue;
    for (const name of fs.readdirSync(dir)) {
      if (!name.endsWith('.json')) continue;
      const file = path.join(dir, name);
      const manual = JSON.parse(fs.readFileSync(file, 'utf8'));
      const parsed = parseResultFromTitle(manual.title);
      if (!parsed) {
        skipped += 1;
        continue;
      }
      if (manual.result === parsed) {
        unchanged += 1;
        continue;
      }
      manual.result = parsed;
      // Keep key order roughly stable: insert result before source if present
      const ordered = {};
      for (const key of Object.keys(manual)) {
        if (key === 'result') continue;
        ordered[key] = manual[key];
        if (key === 'variations' || (key === 'comments' && !manual.variations)) {
          // fallthrough
        }
      }
      // rebuild with result near end before source
      const next = {};
      for (const key of Object.keys(manual)) {
        if (key === 'result' || key === 'source') continue;
        next[key] = manual[key];
      }
      next.result = parsed;
      if (manual.source != null) next.source = manual.source;
      fs.writeFileSync(file, `${JSON.stringify(next, null, 2)}\n`);
      updated += 1;
    }
  }

  console.log(`Done. updated=${updated} unchanged=${unchanged} no-title-result=${skipped}`);
}

main();
