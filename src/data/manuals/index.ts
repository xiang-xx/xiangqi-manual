import type { Manual } from '../../types/manual';
import {
  exclusiveOpeningSide,
  keepsResultForSide,
  resultHintForSide,
} from '../../lib/manualResult';
import { formatOpeningLabel, sortOpeningNames } from '../openings';
import { sortTags } from '../tags';

import { modernManuals } from './modern';
import { ycqlManuals } from './ycql';

export const manuals: Manual[] = [...modernManuals, ...ycqlManuals];

export type ManualFilter = {
  tags?: string[];
  redOpening?: string | null;
  blackOpening?: string | null;
};

export function getManualById(id: string | undefined): Manual | undefined {
  if (!id) return undefined;
  return manuals.find((manual) => manual.id === id);
}

export function allTags(): string[] {
  return sortTags(manuals.flatMap((m) => m.tags));
}

export function allOpenings(side: 'red' | 'black'): string[] {
  const names: string[] = [];
  for (const m of manuals) {
    const name = m.opening?.[side];
    if (name) names.push(name);
  }
  return sortOpeningNames(names);
}

export function openingCounts(side: 'red' | 'black'): Record<string, number> {
  return openingFacetCounts(side, {});
}

/**
 * 在当前其它筛选条件下，每个 tag 再纳入后还能命中的棋谱数（AND）。
 * 已选中的 tag 数字 = 当前结果集大小。
 */
export function tagFacetCounts(filter: ManualFilter = {}): Record<string, number> {
  const base = filterManuals(filter);
  const counts: Record<string, number> = {};
  for (const manual of base) {
    for (const tag of manual.tags) {
      counts[tag] = (counts[tag] ?? 0) + 1;
    }
  }
  return counts;
}

/**
 * 先手/后手开局为单选：数字 = 换成该开局（保留 tags 与另一侧开局）后的命中数。
 */
export function openingFacetCounts(
  side: 'red' | 'black',
  filter: ManualFilter = {},
): Record<string, number> {
  const base = filterManuals({
    tags: filter.tags,
    redOpening: side === 'red' ? null : filter.redOpening,
    blackOpening: side === 'black' ? null : filter.blackOpening,
  });
  const counts: Record<string, number> = {};
  for (const manual of base) {
    const name = manual.opening?.[side];
    if (!name) continue;
    counts[name] = (counts[name] ?? 0) + 1;
  }
  return counts;
}

/** 多 tag 取交集；空选中则返回全部 */
export function filterManualsByTags(selectedTags: string[]): Manual[] {
  return filterManuals({ tags: selectedTags });
}

/**
 * tags 全包含 AND 先手/后手开局（未选侧不限制）。
 * 只选一侧开局时：去掉该侧负局，保留胜/和（无 result 的保留）。
 */
export function filterManuals(filter: ManualFilter = {}): Manual[] {
  const tags = filter.tags ?? [];
  const { redOpening, blackOpening } = filter;
  const sideOnly = exclusiveOpeningSide(redOpening, blackOpening);
  if (tags.length === 0 && !redOpening && !blackOpening) return manuals;

  return manuals.filter((manual) => {
    if (tags.length > 0 && !tags.every((tag) => manual.tags.includes(tag))) {
      return false;
    }
    if (redOpening && manual.opening?.red !== redOpening) return false;
    if (blackOpening && manual.opening?.black !== blackOpening) return false;
    if (sideOnly && !keepsResultForSide(manual.result, sideOnly)) return false;
    return true;
  });
}

export function manualMetaLine(manual: Manual): string {
  const opening = formatOpeningLabel(manual.opening);
  const tagPart = manual.tags.join(' · ');
  const parts = [opening, tagPart, `${manual.moves.length} 手`].filter(Boolean);
  return parts.join(' · ');
}

/** 单侧开局筛选时的结果提示（胜/和） */
export function manualResultHint(
  manual: Manual,
  redOpening: string | null | undefined,
  blackOpening: string | null | undefined,
): '胜' | '和' | null {
  const side = exclusiveOpeningSide(redOpening, blackOpening);
  if (!side) return null;
  return resultHintForSide(manual.result, side);
}

export { exclusiveOpeningSide };
