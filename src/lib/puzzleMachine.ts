import type { Puzzle, PuzzleProgress } from '../types/puzzle';
import { applyUci, legalMovesFrom, pieceAt, turnFromFen, uciMatches } from './engine';
import { parseUci, type Square } from './squares';

export type PuzzleState = {
  fen: string;
  /** 已走出的 solution 步数 */
  stepIndex: number;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  hintFrom: Square | null;
  hintTo: Square | null;
  status: 'playing' | 'complete';
  feedback: string | null;
  comment: string | null;
  attempts: number;
  fails: number;
  solved: boolean;
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

function commentFor(puzzle: Puzzle, stepIndex: number): string | null {
  return puzzle.comments?.[String(stepIndex)] ?? null;
}

/** solution 偶数下标 = 解题方 */
export function isSolverTurn(stepIndex: number): boolean {
  return stepIndex % 2 === 0;
}

function expectedUci(puzzle: Puzzle, stepIndex: number): string | null {
  return puzzle.solution[stepIndex]?.uci ?? null;
}

/**
 * 走出一步 solution[stepIndex]（解题方或对方，只走一手）。
 * reveal=true 时用于「看答案」，反馈文案不同。
 */
function playSolutionPly(
  puzzle: Puzzle,
  state: PuzzleState,
  opts: { reveal?: boolean } = {},
): PuzzleState {
  if (state.status === 'complete') return state;
  if (state.stepIndex >= puzzle.solution.length) return state;

  const uci = expectedUci(puzzle, state.stepIndex);
  if (!uci) return state;

  const applied = applyUci(state.fen, uci);
  if (!applied) {
    throw new Error(`Illegal solution move ${uci} at ${state.fen}`);
  }

  const stepIndex = state.stepIndex + 1;
  const complete = stepIndex >= puzzle.solution.length;
  const wasSolver = isSolverTurn(state.stepIndex);

  let feedback = state.feedback;
  if (opts.reveal && wasSolver) {
    feedback = `答案：${puzzle.solution[state.stepIndex].san}`;
  }
  if (complete) feedback = '解题成功！';

  return {
    ...clearInteraction(state),
    fen: applied.fen,
    stepIndex,
    lastMove: parseUci(uci),
    comment: commentFor(puzzle, state.stepIndex),
    status: complete ? 'complete' : 'playing',
    feedback,
    solved: complete ? true : state.solved,
    attempts: complete && !state.solved ? state.attempts + 1 : state.attempts,
  };
}

/** 对方按主变走出一手（由 UI 延迟调用） */
export function playOpponentReply(puzzle: Puzzle, state: PuzzleState): PuzzleState {
  if (state.status === 'complete') return state;
  if (isSolverTurn(state.stepIndex)) return state;
  return playSolutionPly(puzzle, state);
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
    stepIndex: 0,
    selected: null,
    legalTargets: [],
    lastMove: null,
    hintFrom: null,
    hintTo: null,
    status: puzzle.solution.length === 0 ? 'complete' : 'playing',
    feedback: null,
    comment: null,
    attempts: progress?.attempts ?? 0,
    fails: progress?.fails ?? 0,
    solved: progress?.solved ?? false,
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

export function selectSquare(puzzle: Puzzle, state: PuzzleState, square: Square): PuzzleState {
  if (state.status === 'complete') return state;
  if (!isSolverTurn(state.stepIndex)) return state;

  const expected = expectedUci(puzzle, state.stepIndex);
  if (!expected) return state;

  if (state.selected) {
    const uci = `${state.selected}${square}`;
    if (state.selected === square) {
      return { ...state, selected: null, legalTargets: [], feedback: null };
    }

    const applied = applyUci(state.fen, uci);
    if (!applied) {
      const piece = pieceAt(state.fen, square);
      if (piece) {
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
      return { ...state, feedback: '不合法的着法', selected: null, legalTargets: [] };
    }

    if (!uciMatches(expected, uci)) {
      return {
        ...state,
        selected: null,
        legalTargets: [],
        feedback: '不是此路',
        fails: state.fails + 1,
        hintFrom: null,
        hintTo: null,
      };
    }

    // 正确：只走出用户着；对方由 UI 延迟自动走
    const afterUser: PuzzleState = {
      ...clearInteraction(state),
      fen: applied.fen,
      stepIndex: state.stepIndex + 1,
      lastMove: parseUci(uci),
      comment: commentFor(puzzle, state.stepIndex),
      feedback: null,
      status: 'playing',
    };

    if (afterUser.stepIndex >= puzzle.solution.length) {
      return {
        ...afterUser,
        status: 'complete',
        feedback: '解题成功！',
        solved: true,
        attempts: state.solved ? state.attempts : state.attempts + 1,
      };
    }

    return afterUser;
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
  if (state.status === 'complete') return state;
  if (!isSolverTurn(state.stepIndex)) return state;
  const expected = expectedUci(puzzle, state.stepIndex);
  if (!expected) return state;
  const parsed = parseUci(expected);
  if (!parsed) return state;
  return {
    ...state,
    hintFrom: parsed.from,
    hintTo: parsed.to,
    feedback: `提示：${puzzle.solution[state.stepIndex].san}`,
    selected: null,
    legalTargets: [],
  };
}

/** 看答案：走出下一步解题方着法（对方由 UI 延迟自动走） */
export function revealNext(puzzle: Puzzle, state: PuzzleState): PuzzleState {
  if (state.status === 'complete') return state;
  if (!isSolverTurn(state.stepIndex)) {
    return playOpponentReply(puzzle, state);
  }
  return playSolutionPly(puzzle, state, { reveal: true });
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
