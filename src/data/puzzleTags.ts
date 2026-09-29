/** 残棋列表 Tag 展示顺序 */
export const PUZZLE_TAG_ORDER = [
  '中级',
  '高级',
  '车类',
  '马类',
  '炮类',
  '兵类',
] as const;

export function sortPuzzleTags(tags: Iterable<string>): string[] {
  const order = new Map(PUZZLE_TAG_ORDER.map((tag, index) => [tag, index]));
  return [...new Set(tags)].sort((a, b) => {
    const ai = order.get(a as (typeof PUZZLE_TAG_ORDER)[number]) ?? 1000;
    const bi = order.get(b as (typeof PUZZLE_TAG_ORDER)[number]) ?? 1000;
    if (ai !== bi) return ai - bi;
    return a.localeCompare(b, 'zh-CN');
  });
}
