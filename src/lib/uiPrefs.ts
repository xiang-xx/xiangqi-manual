import AsyncStorage from '@react-native-async-storage/async-storage';

import { allOpenings, allTags } from '../data/manuals';
import { allPuzzleTags } from '../data/puzzles';
import { AI_DIFFICULTIES, type AiDifficulty } from './pikafish';
import type { PlaySide } from './playMachine';

const MANUAL_KEY = 'prefs:manualFilters';
const PUZZLE_KEY = 'prefs:puzzleFilters';
const PLAY_KEY = 'prefs:playSetup';

export type ManualFilterPrefs = {
  tags: string[];
  redOpening: string | null;
  blackOpening: string | null;
};

export type PuzzleFilterPrefs = {
  tags: string[];
};

export type PlaySetupPrefs = {
  side: PlaySide;
  difficulty: AiDifficulty;
};

const DEFAULT_MANUAL: ManualFilterPrefs = {
  tags: [],
  redOpening: null,
  blackOpening: null,
};

const DEFAULT_PUZZLE: PuzzleFilterPrefs = { tags: [] };

const DEFAULT_PLAY: PlaySetupPrefs = {
  side: 'red',
  difficulty: '中级',
};

function sanitizeManual(raw: Partial<ManualFilterPrefs> | null): ManualFilterPrefs {
  const knownTags = new Set(allTags());
  const reds = new Set(allOpenings('red'));
  const blacks = new Set(allOpenings('black'));
  const tags = (raw?.tags ?? []).filter((t) => knownTags.has(t));
  const redOpening =
    raw?.redOpening && reds.has(raw.redOpening) ? raw.redOpening : null;
  const blackOpening =
    raw?.blackOpening && blacks.has(raw.blackOpening) ? raw.blackOpening : null;
  return { tags, redOpening, blackOpening };
}

function sanitizePuzzle(raw: Partial<PuzzleFilterPrefs> | null): PuzzleFilterPrefs {
  const known = new Set(allPuzzleTags());
  return { tags: (raw?.tags ?? []).filter((t) => known.has(t)) };
}

function sanitizePlay(raw: Partial<PlaySetupPrefs> | null): PlaySetupPrefs {
  const side: PlaySide = raw?.side === 'black' ? 'black' : 'red';
  const difficulty =
    raw?.difficulty && (AI_DIFFICULTIES as string[]).includes(raw.difficulty)
      ? raw.difficulty
      : DEFAULT_PLAY.difficulty;
  return { side, difficulty };
}

async function readJson<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function loadManualFilterPrefs(): Promise<ManualFilterPrefs> {
  return sanitizeManual(await readJson<Partial<ManualFilterPrefs>>(MANUAL_KEY));
}

export async function saveManualFilterPrefs(prefs: ManualFilterPrefs): Promise<void> {
  await AsyncStorage.setItem(MANUAL_KEY, JSON.stringify(sanitizeManual(prefs)));
}

export async function loadPuzzleFilterPrefs(): Promise<PuzzleFilterPrefs> {
  return sanitizePuzzle(await readJson<Partial<PuzzleFilterPrefs>>(PUZZLE_KEY));
}

export async function savePuzzleFilterPrefs(prefs: PuzzleFilterPrefs): Promise<void> {
  await AsyncStorage.setItem(PUZZLE_KEY, JSON.stringify(sanitizePuzzle(prefs)));
}

export async function loadPlaySetupPrefs(): Promise<PlaySetupPrefs> {
  return sanitizePlay(await readJson<Partial<PlaySetupPrefs>>(PLAY_KEY));
}

export async function savePlaySetupPrefs(prefs: PlaySetupPrefs): Promise<void> {
  await AsyncStorage.setItem(PLAY_KEY, JSON.stringify(sanitizePlay(prefs)));
}

export { DEFAULT_MANUAL, DEFAULT_PUZZLE, DEFAULT_PLAY };
