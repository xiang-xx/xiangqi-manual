import AsyncStorage from '@react-native-async-storage/async-storage';

import { manuals } from '../data/manuals';
import type { Manual, ManualProgress, SideToMemorize } from '../types/manual';

const keyFor = (manualId: string) => `progress:${manualId}`;

/**
 * 只背红/黑时的默认朝向：红在下 / 黑在下。双方不改。
 */
export function flippedForPracticeSide(side: SideToMemorize): boolean | null {
  if (side === 'black') return true;
  if (side === 'red') return false;
  return null;
}

/**
 * 首页只筛后手（未选先手）进谱时默认黑方；只筛先手则默认红方。
 * 两边都选或都未选则不据此改朝向 / 练习方。
 */
export function entrySideFromOpeningFilter(
  redOpening: string | null,
  blackOpening: string | null,
): 'red' | 'black' | null {
  if (blackOpening != null && redOpening == null) return 'black';
  if (redOpening != null && blackOpening == null) return 'red';
  return null;
}

/**
 * 用户上次翻转优先；否则谱默认 / 后手谱默认翻转。
 */
export function resolveFlipped(manual: Manual, progress?: ManualProgress | null): boolean {
  if (progress?.flipped != null) return progress.flipped;
  const fromSide = progress?.practiceSide
    ? flippedForPracticeSide(progress.practiceSide)
    : null;
  if (fromSide != null) return fromSide;
  if (manual.defaultFlipped != null) return manual.defaultFlipped;
  return manual.sideToMemorize === 'black';
}

export async function loadProgress(manualId: string): Promise<ManualProgress | null> {
  const raw = await AsyncStorage.getItem(keyFor(manualId));
  if (!raw) return null;
  return JSON.parse(raw) as ManualProgress;
}

export async function saveProgress(manualId: string, progress: ManualProgress): Promise<void> {
  await AsyncStorage.setItem(keyFor(manualId), JSON.stringify(progress));
}

export async function listAllProgress(): Promise<Record<string, ManualProgress>> {
  const entries = await Promise.all(
    manuals.map(async (manual) => {
      const progress = await loadProgress(manual.id);
      return [manual.id, progress] as const;
    }),
  );

  return Object.fromEntries(entries.filter(([, progress]) => progress != null)) as Record<
    string,
    ManualProgress
  >;
}

export async function listRecentManualIds(limit = 8): Promise<string[]> {
  const all = await listAllProgress();
  return Object.entries(all)
    .filter(([, p]) => p.lastStudiedAt)
    .sort((a, b) => (b[1].lastStudiedAt! > a[1].lastStudiedAt! ? 1 : -1))
    .slice(0, limit)
    .map(([id]) => id);
}
