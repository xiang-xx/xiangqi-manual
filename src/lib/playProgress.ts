import AsyncStorage from '@react-native-async-storage/async-storage';

import type { AiDifficulty } from './pikafish';
import type { PlaySide, PlayStatus } from './playMachine';

const STORAGE_KEY = 'play:games';
const MAX_GAMES = 40;

export type PlayGameRecord = {
  id: string;
  humanSide: PlaySide;
  difficulty: AiDifficulty;
  moves: string[];
  status: PlayStatus;
  /** 认负（局面未必将死） */
  resigned?: boolean;
  createdAt: number;
  updatedAt: number;
};

function newId(): string {
  return `pg_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export async function listPlayGames(): Promise<PlayGameRecord[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const list = JSON.parse(raw) as PlayGameRecord[];
    if (!Array.isArray(list)) return [];
    return list.sort((a, b) => b.updatedAt - a.updatedAt);
  } catch {
    return [];
  }
}

async function writeAll(games: PlayGameRecord[]): Promise<void> {
  const trimmed = games
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, MAX_GAMES);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export async function getPlayGame(id: string): Promise<PlayGameRecord | null> {
  const list = await listPlayGames();
  return list.find((g) => g.id === id) ?? null;
}

export async function createPlayGame(input: {
  humanSide: PlaySide;
  difficulty: AiDifficulty;
}): Promise<PlayGameRecord> {
  const now = Date.now();
  const record: PlayGameRecord = {
    id: newId(),
    humanSide: input.humanSide,
    difficulty: input.difficulty,
    moves: [],
    status: 'playing',
    createdAt: now,
    updatedAt: now,
  };
  const list = await listPlayGames();
  await writeAll([record, ...list]);
  return record;
}

export async function savePlayGame(
  id: string,
  patch: {
    moves: string[];
    status: PlayStatus;
    resigned?: boolean;
  },
): Promise<void> {
  const list = await listPlayGames();
  const idx = list.findIndex((g) => g.id === id);
  if (idx < 0) return;
  const next: PlayGameRecord = {
    ...list[idx],
    moves: patch.moves,
    status: patch.status,
    resigned: patch.resigned ?? false,
    updatedAt: Date.now(),
  };
  list[idx] = next;
  await writeAll(list);
}

export async function deletePlayGame(id: string): Promise<void> {
  const list = await listPlayGames();
  await writeAll(list.filter((g) => g.id !== id));
}

export function playGameSummary(game: PlayGameRecord): string {
  const side = game.humanSide === 'red' ? '红' : '黑';
  const round = Math.ceil(game.moves.length / 2);
  if (game.status === 'playing') {
    return `${side} · ${game.difficulty}${round > 0 ? ` · ${round} 回` : ''}`;
  }
  const result =
    game.status === 'won' ? '胜' : game.status === 'lost' ? (game.resigned ? '认负' : '负') : '和';
  return `${side} · ${game.difficulty} · ${result}`;
}

export function formatPlayUpdatedAt(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
