/** 首页 Tag 展示顺序；棋谱里可有未列出的 tag，会排在末尾 */
export const TAG_ORDER = [
  '银川棋路',
  '个人赛',
  '碧桂园杯',
  '王天一',
  '郑惟桐',
  'AI对战',
  '开局',
  '中局',
  '残棋',
  '古谱',
  '名局',
] as const;

export function sortTags(tags: Iterable<string>): string[] {
  const order = new Map(TAG_ORDER.map((tag, index) => [tag, index]));
  return [...new Set(tags)].sort((a, b) => {
    const ai = order.get(a as (typeof TAG_ORDER)[number]) ?? 1000;
    const bi = order.get(b as (typeof TAG_ORDER)[number]) ?? 1000;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b, 'zh-CN');
  });
}
