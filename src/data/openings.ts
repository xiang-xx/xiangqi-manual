/** 粗粒度开局名；东萍 open「A对B」左右各匹配一个 */

export const OPENING_NAMES = [
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
] as const;

export type OpeningName = (typeof OPENING_NAMES)[number];

/** 首页先手/后手 chip 展示顺序 */
export const OPENING_ORDER: OpeningName[] = [
  '中炮',
  '飞相',
  '仙人指路',
  '起马',
  '过宫炮',
  '士角炮',
  '对兵',
  '两头蛇',
  '屏风马',
  '反宫马',
  '顺炮',
  '列炮',
  '单提马',
  '三步虎',
  '卒底炮',
  '飞象',
];

/** 别名 → 规范名 */
const OPENING_ALIASES: Record<string, OpeningName> = {
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
  ...OPENING_NAMES.map((name) => ({ term: name, canonical: name as OpeningName })),
  ...Object.entries(OPENING_ALIASES).map(([term, canonical]) => ({ term, canonical })),
].sort((a, b) => b.term.length - a.term.length);

export type ManualOpening = {
  red?: OpeningName;
  black?: OpeningName;
};

/** 取文中最靠前的开局名（「飞相转屏风马」→ 飞相） */
export function matchOpeningName(text: string): OpeningName | undefined {
  if (!text) return undefined;
  let best: OpeningName | undefined;
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

function stripOpenCode(open: string): string {
  return open.trim().replace(/^[A-Za-z]\d+\s+/, '');
}

/** 跳过「对兵」里的「对」 */
function duiSplitIndexes(raw: string): number[] {
  const idxs: number[] = [];
  for (let i = 0; i < raw.length; i++) {
    if (raw[i] !== '对') continue;
    if (raw.startsWith('对兵', i)) continue;
    idxs.push(i);
  }
  return idxs;
}

/** 解析东萍 `[DhtmlXQ_open]`，如「中炮对屏风马」→ { red: 中炮, black: 屏风马 } */
export function parseDongpingOpen(open: string): ManualOpening {
  const raw = stripOpenCode(open);
  if (!raw) return {};

  // 顺炮系：双方中炮，黑方走顺炮
  if (raw.startsWith('顺炮')) {
    return { red: '中炮', black: '顺炮' };
  }

  let partial: ManualOpening | null = null;
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

export function sortOpeningNames(names: Iterable<string>): string[] {
  const order = new Map(OPENING_ORDER.map((name, i) => [name, i]));
  return [...new Set(names)].sort((a, b) => {
    const ai = order.get(a as OpeningName) ?? 1000;
    const bi = order.get(b as OpeningName) ?? 1000;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b, 'zh-CN');
  });
}

export function formatOpeningLabel(opening: ManualOpening | undefined): string {
  if (!opening) return '';
  const parts: string[] = [];
  if (opening.red) parts.push(`先手${opening.red}`);
  if (opening.black) parts.push(`后手${opening.black}`);
  return parts.join(' · ');
}

/** 旧扁平开局 tag，回填后应从 tags 去掉 */
export const LEGACY_OPENING_TAGS = new Set([
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
