import AsyncStorage from '@react-native-async-storage/async-storage';

import { manuals } from '../data/manuals';
import type { Manual, ManualProgress } from '../types/manual';

const keyFor = (manualId: string) => `progress:${manualId}`;

/**
 * 用户上次翻转优先；只背黑且从未记过翻转则黑在下；
 * 否则谱默认 / 后手谱默认翻转。
 */
export function resolveFlipped(manual: Manual, progress?: ManualProgress | null): boolean {
  if (progress?.flipped != null) return progress.flipped;
  if (progress?.practiceSide === 'black') return true;
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
