#!/usr/bin/env node
/**
 * 将《银川棋路》长篇书评压成适合棋盘旁的短注释。
 * Usage: node scripts/shorten-ycql-comments.js [--dry]
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '../src/data/manuals/ycql');
const DRY = process.argv.includes('--dry');
const MAX = 56;

function clean(text) {
  let s = String(text)
    .replace(/&#\d+;?/g, '')
    .replace(/[ \t\r\n\u00a0　]+/g, ' ')
    .trim();
  // 去中文之间空格（OCR 断字）
  for (let i = 0; i < 3; i++) {
    s = s.replace(/([\u4e00-\u9fff])\s+([\u4e00-\u9fff])/g, '$1$2');
  }
  return s.replace(/\s+/g, ' ').trim();
}

function sentences(text) {
  return clean(text)
    .split(/(?<=[。！？；])/)
    .map((s) => s.trim().replace(/^["”]+/, ''))
    .filter((s) => s.length >= 6);
}

function clip(s) {
  if (s.length <= MAX) return s;
  const cut = s.slice(0, MAX - 1);
  const comma = Math.max(
    cut.lastIndexOf('，'),
    cut.lastIndexOf('、'),
    cut.lastIndexOf('：'),
    cut.lastIndexOf(':'),
  );
  if (comma > 20) return `${cut.slice(0, comma)}…`;
  return `${cut}…`;
}

function pick(text, moveIndex) {
  const list = sentences(text);
  if (list.length === 0) return clip(clean(text));
  const prefer =
    moveIndex === 0
      ? /布局|首着|起手|飞相|中炮|屏风|仙人|过宫|开局|阵法|应法/
      : /如改走|应走|软着|漏着|占优|先手|不宜|可走|改走|败着|优势|劣势/;
  let hit = list.find((s) => prefer.test(s));
  if (!hit && moveIndex === 0) {
    hit = [...list].reverse().find((s) => /炮|马|车|兵|相|仕|卒|象|将|帅|局/.test(s));
  }
  if (!hit) hit = list[0];
  return clip(hit);
}

let files = 0;
let comments = 0;
for (const name of fs.readdirSync(ROOT).filter((f) => f.endsWith('.json')).sort()) {
  const file = path.join(ROOT, name);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  if (!data.comments || Object.keys(data.comments).length === 0) continue;
  const next = {};
  for (const [k, v] of Object.entries(data.comments)) {
    next[k] = pick(v, Number(k) || 0);
    comments += 1;
  }
  files += 1;
  if (!DRY) {
    data.comments = next;
    fs.writeFileSync(file, `${JSON.stringify(data, null, 2)}\n`);
  } else if (files <= 2) {
    console.log(name, Object.entries(next).slice(0, 3));
  }
}
console.log(`${DRY ? 'dry ' : ''}shortened ${comments} comments in ${files} files`);
