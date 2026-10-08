import type { Puzzle, PuzzleProgress } from '../types/puzzle';
import {
  allLegalUcis,
  applyUci,
  createGame,
  givesCheck,
  legalMovesFrom,
  pieceAt,
  positionKey,
  turnFromFen,
  uciMatches,
} from './engine';
import { parseUci, type Square } from './squares';

export type PuzzleStatus = 'playing' | 'won' | 'lost' | 'draw';

export type PuzzleState = {
  fen: string;
  /** 自 startFen 起的 UCI（引擎历史 / 禁长将） */
  moves: string[];
  /** 与主变对齐的步数；偏离后不再推进（提示 / 看答案 / 无引擎回退用） */
  bookIndex: number;
  offBook: boolean;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  hintFrom: Square | null;
  hintTo: Square | null;
  status: PuzzleStatus;
  feedback: string | null;
  comment: string | null;
  attempts: number;
  fails: number;
  solved: boolean;
  thinking: boolean;
};

function clearInteraction(state: PuzzleState): PuzzleState {
  return {
    ...state,
    selected: null,
    legalTargets: [],
    hintFrom: null,
    hintTo: null,
  };
}

function commentFor(puzzle: Puzzle, bookIndex: number): string | null {
  return puzzle.comments?.[String(bookIndex)] ?? null;
}

function trackBook(
  puzzle: Puzzle,
  state: PuzzleState,
  uci: string,
): { bookIndex: number; offBook: boolean } {
  if (state.offBook) return { bookIndex: state.bookIndex, offBook: true };
  const expected = puzzle.solution[state.bookIndex]?.uci;
  if (expected && uciMatches(expected, uci)) {
    return { bookIndex: state.bookIndex + 1, offBook: false };
  }
  return { bookIndex: state.bookIndex, offBook: true };
}

function outcomeAfter(puzzle: Puzzle, fen: string): {
  status: PuzzleStatus;
  feedback: string | null;
} {
  const game = createGame(fen);
  if (!game.game_over()) {
    return { status: 'playing', feedback: null };
  }
  if (game.in_checkmate()) {
    const mated = turnFromFen(fen);
    const winner: 'red' | 'black' = mated === 'red' ? 'black' : 'red';
    const goalWin: 'red' | 'black' = puzzle.goal === 'red_win' ? 'red' : 'black';
    if (winner === goalWin) {
      return { status: 'won', feedback: '解题成功！' };
    }
    return { status: 'lost', feedback: '未能将杀' };
  }
  return { status: 'draw', feedback: '和棋' };
}

function finishCounts(
  state: PuzzleState,
  status: PuzzleStatus,
): Pick<PuzzleState, 'solved' | 'attempts' | 'fails'> {
  if (status === 'won') {
    return {
      solved: true,
      attempts: state.solved ? state.attempts : state.attempts + 1,
      fails: state.fails,
    };
  }
  if (status === 'lost' || status === 'draw') {
    return {
      solved: state.solved,
      attempts: state.attempts + 1,
      fails: state.fails + 1,
    };
  }
  return {
    solved: state.solved,
    attempts: state.attempts,
    fails: state.fails,
  };
}

function applyPly(
  puzzle: Puzzle,
  state: PuzzleState,
  uci: string,
  opts: { reveal?: boolean; commentFromBook?: boolean } = {},
): PuzzleState {
  if (state.status !== 'playing') return state;

  const applied = applyUci(state.fen, uci);
  if (!applied) {
    return {
      ...clearInteraction(state),
      thinking: false,
      feedback: '不合法的着法',
    };
  }

  const book = trackBook(puzzle, state, uci);
  const outcome = outcomeAfter(puzzle, applied.fen);
  const counts = finishCounts(state, outcome.status);

  let feedback = outcome.feedback;
  if (!feedback && opts.reveal && turnFromFen(state.fen) === puzzle.sideToMove) {
    const san = puzzle.solution[state.bookIndex]?.san;
    feedback = san ? `答案：${san}` : null;
  }

  return {
    ...clearInteraction(state),
    fen: applied.fen,
    moves: [...state.moves, uci.toLowerCase()],
    bookIndex: book.bookIndex,
    offBook: book.offBook,
    lastMove: parseUci(uci),
    comment:
      opts.commentFromBook || !book.offBook
        ? commentFor(puzzle, state.bookIndex)
        : state.comment,
    status: outcome.status,
    feedback,
    thinking: false,
    ...counts,
  };
}

/** 已出现过的局面键（含起点） */
function seenPositionKeys(startFen: string, moves: string[]): Set<string> {
  const keys = new Set<string>([positionKey(startFen)]);
  if (moves.length === 0) return keys;
  let fen = startFen;
  for (const u of moves) {
    const next = applyUci(fen, u);
    if (!next) break;
    fen = next.fen;
    keys.add(positionKey(fen));
  }
  return keys;
}

/**
 * 将军后回到已出现过的局面 → 长将循环，残棋对方不允许。
 * （非将军的重复着不在此拦，留给引擎/规则层。）
 */
export function isRepeatingCheckMove(
  startFen: string,
  moves: string[],
  fen: string,
  uci: string,
): boolean {
  if (!givesCheck(fen, uci)) return false;
  const applied = applyUci(fen, uci);
  if (!applied) return false;
  return seenPositionKeys(startFen, moves).has(positionKey(applied.fen));
}

/** 对方可选着：排除长将循环 */
export function allowedOpponentMoves(
  startFen: string,
  moves: string[],
  fen: string,
): string[] {
  return allLegalUcis(fen).filter((u) => !isRepeatingCheckMove(startFen, moves, fen, u));
}

/** 对方只剩长将循环 → 判负，解题成功 */
export function applyOpponentPerpetualCheckLoss(state: PuzzleState): PuzzleState {
  if (state.status !== 'playing') return state;
  const counts = finishCounts(state, 'won');
  return {
    ...clearInteraction(state),
    thinking: false,
    status: 'won',
    feedback: '对方长将，解题成功！',
    ...counts,
  };
}

/** 解题方行棋（FEN 轮到 sideToMove，且未在思考） */
export function isSolverTurn(puzzle: Puzzle, state: PuzzleState): boolean {
  if (state.status !== 'playing' || state.thinking) return false;
  return turnFromFen(state.fen) === puzzle.sideToMove;
}

export function isOpponentTurn(puzzle: Puzzle, state: PuzzleState): boolean {
  if (state.status !== 'playing' || state.thinking) return false;
  return turnFromFen(state.fen) !== puzzle.sideToMove;
}

/** 无引擎时：对方按主变走出一手（已偏离主变则无法续） */
export function playOpponentReply(puzzle: Puzzle, state: PuzzleState): PuzzleState {
  if (!isOpponentTurn(puzzle, state)) return state;
  if (state.offBook) {
    return {
      ...state,
      feedback: '此变需引擎续弈',
    };
  }
  const uci = puzzle.solution[state.bookIndex]?.uci;
  if (!uci) {
    return {
      ...state,
      feedback: '无谱可续',
    };
  }
  return applyPly(puzzle, state, uci, { commentFromBook: true });
}

export function beginOpponentThink(state: PuzzleState): PuzzleState {
  if (state.status !== 'playing') return state;
  return {
    ...clearInteraction(state),
    thinking: true,
    feedback: null,
  };
}

/** 引擎对方着法 */
export function applyOpponentMove(puzzle: Puzzle, state: PuzzleState, uci: string): PuzzleState {
  if (state.status !== 'playing') return state;
  return applyPly(puzzle, state, uci, { commentFromBook: true });
}

export function initialPuzzleState(
  puzzle: Puzzle,
  progress?: PuzzleProgress | null,
): PuzzleState {
  const turn = turnFromFen(puzzle.startFen);
  if (turn !== puzzle.sideToMove) {
    console.warn(
      `Puzzle ${puzzle.id}: sideToMove=${puzzle.sideToMove} but fen turn=${turn}`,
    );
  }

  return {
    fen: puzzle.startFen,
    moves: [],
    bookIndex: 0,
    offBook: false,
    selected: null,
    legalTargets: [],
    lastMove: null,
    hintFrom: null,
    hintTo: null,
    status: 'playing',
    feedback: null,
    comment: null,
    attempts: progress?.attempts ?? 0,
    fails: progress?.fails ?? 0,
    solved: progress?.solved ?? false,
    thinking: false,
  };
}

export function restartPuzzle(puzzle: Puzzle, state: PuzzleState): PuzzleState {
  return {
    ...initialPuzzleState(puzzle, {
      solved: state.solved,
      attempts: state.attempts,
      fails: state.fails,
    }),
  };
}

export function selectSquare(
  puzzle: Puzzle,
  state: PuzzleState,
  square: Square,
  opts: { requireBook?: boolean } = {},
): PuzzleState {
  if (!isSolverTurn(puzzle, state)) return state;

  if (state.selected) {
    const uci = `${state.selected}${square}`;
    if (state.selected === square) {
      return { ...state, selected: null, legalTargets: [], feedback: null };
    }

    if (state.legalTargets.includes(square)) {
      // 无引擎回退：必须跟主变，否则静默收回（不提示对错）
      if (opts.requireBook) {
        const expected = puzzle.solution[state.bookIndex]?.uci;
        if (!expected || !uciMatches(expected, uci)) {
          return {
            ...state,
            selected: null,
            legalTargets: [],
            hintFrom: null,
            hintTo: null,
            feedback: null,
          };
        }
      }
      return applyPly(puzzle, state, uci);
    }

    const piece = pieceAt(state.fen, square);
    if (piece) {
      const solverColor = puzzle.sideToMove === 'red' ? 'r' : 'b';
      if (piece.color === solverColor) {
        const targets = legalMovesFrom(state.fen, square).map((m) => parseUci(m)!.to);
        return {
          ...state,
          selected: square,
          legalTargets: targets,
          feedback: null,
          hintFrom: null,
          hintTo: null,
        };
      }
    }
    return { ...state, feedback: '不合法的着法', selected: null, legalTargets: [] };
  }

  const piece = pieceAt(state.fen, square);
  if (!piece) return { ...state, selected: null, legalTargets: [], feedback: null };
  const solverColor = puzzle.sideToMove === 'red' ? 'r' : 'b';
  if (piece.color !== solverColor) {
    return { ...state, feedback: '请走解题一方的棋子', selected: null, legalTargets: [] };
  }

  const targets = legalMovesFrom(state.fen, square).map((m) => parseUci(m)!.to);
  if (targets.length === 0) {
    return { ...state, selected: null, legalTargets: [], feedback: '该子无合法着' };
  }
  return {
    ...state,
    selected: square,
    legalTargets: targets,
    feedback: null,
    hintFrom: null,
    hintTo: null,
  };
}

export function showHint(puzzle: Puzzle, state: PuzzleState): PuzzleState {
  if (state.status !== 'playing') return state;
  if (!isSolverTurn(puzzle, state)) return state;
  if (state.offBook) {
    return { ...state, feedback: '已偏离参考着法', selected: null, legalTargets: [] };
  }
  const expected = puzzle.solution[state.bookIndex]?.uci;
  if (!expected) {
    return { ...state, feedback: '无参考着法', selected: null, legalTargets: [] };
  }
  const parsed = parseUci(expected);
  if (!parsed) return state;
  return {
    ...state,
    hintFrom: parsed.from,
    hintTo: parsed.to,
    feedback: `提示：${puzzle.solution[state.bookIndex].san}`,
    selected: null,
    legalTargets: [],
  };
}

/** 看答案：走出下一步参考着（对方仍由 UI / 引擎续） */
export function revealNext(puzzle: Puzzle, state: PuzzleState): PuzzleState {
  if (state.status !== 'playing') return state;
  if (isOpponentTurn(puzzle, state)) {
    return playOpponentReply(puzzle, state);
  }
  if (!isSolverTurn(puzzle, state)) return state;
  if (state.offBook) {
    return { ...state, feedback: '已偏离参考着法' };
  }
  const uci = puzzle.solution[state.bookIndex]?.uci;
  if (!uci) {
    return { ...state, feedback: '无参考着法' };
  }
  return applyPly(puzzle, state, uci, { reveal: true, commentFromBook: true });
}

export function toPuzzleProgress(state: PuzzleState, flipped: boolean): PuzzleProgress {
  return {
    solved: state.solved,
    attempts: state.attempts,
    fails: state.fails,
    lastStudiedAt: new Date().toISOString(),
    flipped,
  };
}

export function resolvePuzzleFlipped(
  puzzle: Puzzle,
  progress?: PuzzleProgress | null,
): boolean {
  if (progress?.flipped != null) return progress.flipped;
  if (puzzle.defaultFlipped != null) return puzzle.defaultFlipped;
  return puzzle.sideToMove === 'black';
}
