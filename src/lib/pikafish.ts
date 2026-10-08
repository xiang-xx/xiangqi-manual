/**
 * Pikafish UCI 会话：找最佳着、难度档位。
 * FEN 侧：引擎用 w/b，本项目 xiangqi.js 用 r/b。
 */

import {
  addPikafishErrorListener,
  addPikafishLineListener,
  isPikafishAvailable,
  sendPikafish,
  startPikafish,
  stopPikafish,
} from 'pikafish-engine';

export type AiDifficulty = '入门' | '初级' | '中级' | '高级' | '大师';

export const AI_DIFFICULTIES: AiDifficulty[] = ['入门', '初级', '中级', '高级', '大师'];

const DIFFICULTY_OPTS: Record<AiDifficulty, { movetime: number; hash: number }> = {
  入门: { movetime: 200, hash: 16 },
  初级: { movetime: 500, hash: 16 },
  中级: { movetime: 1500, hash: 32 },
  高级: { movetime: 3000, hash: 64 },
  大师: { movetime: 8000, hash: 64 },
};

/** xiangqi.js FEN (r/b) → Pikafish FEN (w/b) */
export function toPikafishFen(fen: string): string {
  const parts = fen.trim().split(/\s+/);
  if (parts[1] === 'r') parts[1] = 'w';
  return parts.join(' ');
}

export function difficultyLabel(d: AiDifficulty): string {
  const { movetime } = DIFFICULTY_OPTS[d];
  if (movetime < 1000) return `${d} · ${movetime}ms`;
  return `${d} · ${(movetime / 1000).toFixed(movetime % 1000 === 0 ? 0 : 1)}s`;
}

type Waiter = {
  resolve: (line: string) => void;
  reject: (err: Error) => void;
  match: (line: string) => boolean;
};

let started = false;
let waiters: Waiter[] = [];
let lineSub: { remove: () => void } | null = null;
let errSub: { remove: () => void } | null = null;

function onLine(line: string) {
  const pending = [...waiters];
  for (const w of pending) {
    if (w.match(line)) {
      waiters = waiters.filter((x) => x !== w);
      w.resolve(line);
    }
  }
}

function waitFor(match: (line: string) => boolean, ms = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      waiters = waiters.filter((w) => w.resolve !== resolve);
      reject(new Error('引擎超时'));
    }, ms);
    waiters.push({
      match,
      resolve: (line) => {
        clearTimeout(timer);
        resolve(line);
      },
      reject,
    });
  });
}

function attachListeners() {
  if (lineSub) return;
  lineSub = addPikafishLineListener(onLine);
  errSub = addPikafishErrorListener((msg) => {
    const err = new Error(msg);
    for (const w of waiters) w.reject(err);
    waiters = [];
  });
}

export async function ensureEngine(): Promise<void> {
  if (!isPikafishAvailable()) {
    throw new Error('当前环境无法使用 Pikafish（需要 Android 开发构建）');
  }
  attachListeners();
  if (!started) {
    const ready = waitFor((l) => l.trim() === 'readyok', 60_000);
    await startPikafish();
    await ready;
    started = true;
  }
}

export async function shutdownEngine(): Promise<void> {
  waiters = [];
  started = false;
  lineSub?.remove();
  errSub?.remove();
  lineSub = null;
  errSub = null;
  await stopPikafish();
}

export type FindMoveOpts = {
  /** 与 moves 一起用：让引擎看到完整路径（重复/长将） */
  startFen?: string;
  moves?: string[];
  /** 限制搜索着法（排除长将等） */
  searchmoves?: string[];
};

export async function findBestMove(
  fen: string,
  difficulty: AiDifficulty,
  opts?: FindMoveOpts,
): Promise<string> {
  const d = DIFFICULTY_OPTS[difficulty];
  return findBestMoveTimed(fen, d.movetime, d.hash, opts);
}

/** 复盘等场景：自定义思考时间（毫秒） */
export async function findBestMoveTimed(
  fen: string,
  movetime: number,
  hash = 32,
  opts?: FindMoveOpts,
): Promise<string> {
  await ensureEngine();
  await sendPikafish(`setoption name Hash value ${hash}`);
  await sendPikafish('setoption name Threads value 1');

  const startFen = opts?.startFen;
  const moves = opts?.moves;
  const positionCmd =
    startFen && moves && moves.length > 0
      ? `position fen ${toPikafishFen(startFen)} moves ${moves.map((m) => m.toLowerCase()).join(' ')}`
      : startFen && moves
        ? `position fen ${toPikafishFen(startFen)}`
        : `position fen ${toPikafishFen(fen)}`;
  await sendPikafish(positionCmd);

  const search = opts?.searchmoves?.filter(Boolean).map((m) => m.toLowerCase()) ?? [];
  const goCmd =
    search.length > 0
      ? `go movetime ${movetime} searchmoves ${search.join(' ')}`
      : `go movetime ${movetime}`;

  const bestPromise = waitFor((l) => l.startsWith('bestmove '), movetime + 15_000);
  await sendPikafish(goCmd);
  const line = await bestPromise;
  const parts = line.trim().split(/\s+/);
  const move = parts[1];
  if (!move || move === '(none)' || move === '0000') {
    throw new Error('引擎无着可走');
  }
  return move.toLowerCase();
}

export { isPikafishAvailable };
