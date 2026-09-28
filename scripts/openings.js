/**
 * 东萍开局解析（与 src/data/openings.ts 保持一致）
 */

const OPENING_NAMES = [
  '仙人指路',
  '屏风马',
  '反宫马',
  '单提马',
  '三步虎',
  '卒底炮',
  '过宫炮',
  '士角炮',
  '列手炮',
  '列炮',
  '顺炮',
  '中炮',
  '飞相',
  '飞象',
  '起马',
  '对兵',
  '两头蛇',
];

const OPENING_ALIASES = {
  飞相局: '飞相',
  顺相局: '飞相',
  起马局: '起马',
  对兵局: '对兵',
  列手炮: '列炮',
  后补列炮: '列炮',
  仕角炮: '士角炮',
  五七炮: '中炮',
  五六炮: '中炮',
  五八炮: '中炮',
  五九炮: '中炮',
};

const MATCH_TERMS = [
  ...OPENING_NAMES.map((name) => ({ term: name, canonical: name })),
  ...Object.entries(OPENING_ALIASES).map(([term, canonical]) => ({ term, canonical })),
].sort((a, b) => b.term.length - a.term.length);

const LEGACY_OPENING_TAGS = new Set([
  '中炮',
  '屏风马',
  '顺炮',
  '飞相',
  '飞象',
  '仙人指路',
  '反宫马',
  '列炮',
  '列手炮',
  '卒底炮',
  '过宫炮',
  '士角炮',
  '起马',
  '单提马',
  '三步虎',
  '对兵',
  '两头蛇',
]);

function matchOpeningName(text) {
  if (!text) return undefined;
  let best;
  let bestPos = Infinity;
  let bestLen = 0;
  for (const { term, canonical } of MATCH_TERMS) {
    const pos = text.indexOf(term);
    if (pos < 0) continue;
    if (pos < bestPos || (pos === bestPos && term.length > bestLen)) {
      best = canonical;
      bestPos = pos;
      bestLen = term.length;
    }
  }
  return best;
}

function stripOpenCode(open) {
  return (open || '').trim().replace(/^[A-Za-z]\d+\s+/, '');
}

function duiSplitIndexes(raw) {
  const idxs = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '对') continue;
    if (raw.startsWith('对兵', i)) continue;
    idxs.push(i);
  }
  return idxs;
}

function parseDongpingOpen(open) {
  const raw = stripOpenCode(open);
  if (!raw) return {};

  if (raw.startsWith('顺炮')) {
    return { red: '中炮', black: '顺炮' };
  }

  let partial = null;
  for (const idx of duiSplitIndexes(raw)) {
    const red = matchOpeningName(raw.slice(0, idx));
    const black = matchOpeningName(raw.slice(idx + 1));
    if (red && black) return { red, black };
    if ((red || black) && !partial) {
      partial = {};
      if (red) partial.red = red;
      if (black) partial.black = black;
    }
  }
  if (partial) return partial;

  const only = matchOpeningName(raw);
  return only ? { red: only } : {};
}

function stripLegacyOpeningTags(tags) {
  return (tags || []).filter((t) => !LEGACY_OPENING_TAGS.has(t));
}

module.exports = {
  OPENING_NAMES,
  LEGACY_OPENING_TAGS,
  matchOpeningName,
  parseDongpingOpen,
  stripLegacyOpeningTags,
};
