import AsyncStorage from '@react-native-async-storage/async-storage';

import { puzzles } from '../data/puzzles';
import type { PuzzleProgress } from '../types/puzzle';

const keyFor = (puzzleId: string) => `puzzle:${puzzleId}`;

export async function loadPuzzleProgress(puzzleId: string): Promise<PuzzleProgress | null> {
  const raw = await AsyncStorage.getItem(keyFor(puzzleId));
  if (!raw) return null;
  return JSON.parse(raw) as PuzzleProgress;
}

export async function savePuzzleProgress(
  puzzleId: string,
  progress: PuzzleProgress,
): Promise<void> {
  await AsyncStorage.setItem(keyFor(puzzleId), JSON.stringify(progress));
}

export async function listAllPuzzleProgress(): Promise<Record<string, PuzzleProgress>> {
  const entries = await Promise.all(
    puzzles.map(async (puzzle) => {
      const progress = await loadPuzzleProgress(puzzle.id);
      return [puzzle.id, progress] as const;
    }),
  );
  return Object.fromEntries(entries.filter(([, p]) => p != null)) as Record<
    string,
    PuzzleProgress
  >;
}
