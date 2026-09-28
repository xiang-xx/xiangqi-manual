import AsyncStorage from '@react-native-async-storage/async-storage';

import { manuals } from '../data/manuals';
import type { ManualProgress } from '../types/manual';

const keyFor = (manualId: string) => `progress:${manualId}`;

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
