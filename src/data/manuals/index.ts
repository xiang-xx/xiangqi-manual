import type { Manual } from '../../types/manual';
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
  const counts: Record<string, number> = {};
  for (const manual of manuals) {
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

/** tags 全包含 AND 先手/后手开局（未选侧不限制） */
export function filterManuals(filter: ManualFilter = {}): Manual[] {
  const tags = filter.tags ?? [];
  const { redOpening, blackOpening } = filter;
  if (tags.length === 0 && !redOpening && !blackOpening) return manuals;

  return manuals.filter((manual) => {
    if (tags.length > 0 && !tags.every((tag) => manual.tags.includes(tag))) {
      return false;
    }
    if (redOpening && manual.opening?.red !== redOpening) return false;
    if (blackOpening && manual.opening?.black !== blackOpening) return false;
    return true;
  });
}

export function manualMetaLine(manual: Manual): string {
  const opening = formatOpeningLabel(manual.opening);
  const tagPart = manual.tags.join(' · ');
  const parts = [opening, tagPart, `${manual.moves.length} 手`].filter(Boolean);
  return parts.join(' · ');
}
