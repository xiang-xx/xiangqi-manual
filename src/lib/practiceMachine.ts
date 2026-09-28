import type { Manual, ManualProgress } from '../types/manual';
import { applyUci, fenAfterMoves, legalMovesFrom, pieceAt, uciMatches } from './engine';
import { parseUci, type Square } from './squares';

export type PracticeState = {
  fen: string;
  stepIndex: number;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  hintFrom: Square | null;
  hintTo: Square | null;
  status: 'playing' | 'complete';
  feedback: string | null;
  comment: string | null;
  wrongCounts: Record<string, number>;
  maxReached: number;
};

export function initialPracticeState(manual: Manual, progress?: ManualProgress | null): PracticeState {
  return {
    fen: manual.startFen,
    stepIndex: 0,
    selected: null,
    legalTargets: [],
    lastMove: null,
    hintFrom: null,
    hintTo: null,
    status: manual.moves.length === 0 ? 'complete' : 'playing',
    feedback: null,
    comment: null,
    wrongCounts: { ...(progress?.wrongCounts ?? {}) },
    maxReached: progress?.maxReached ?? 0,
  };
}

function expectedUci(manual: Manual, stepIndex: number): string | null {
  return manual.moves[stepIndex]?.uci ?? null;
}

function commentFor(manual: Manual, stepIndex: number): string | null {
  return manual.comments?.[String(stepIndex)] ?? null;
}

export function selectSquare(manual: Manual, state: PracticeState, square: Square): PracticeState {
  if (state.status === 'complete') return state;

  const expected = expectedUci(manual, state.stepIndex);
  if (!expected) return state;

  // Second click: attempt move
  if (state.selected) {
    const uci = `${state.selected}${square}`;
    if (state.selected === square) {
      return { ...state, selected: null, legalTargets: [], feedback: null };
    }

    const applied = applyUci(state.fen, uci);
    if (!applied) {
      // Illegal — if tapping own piece, reselect
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
      const key = String(state.stepIndex);
      const wrongCounts = {
        ...state.wrongCounts,
        [key]: (state.wrongCounts[key] ?? 0) + 1,
      };
      return {
        ...state,
        fen: state.fen, // do not advance position — undo by not applying
        selected: null,
        legalTargets: [],
        feedback: `不对，谱着是 ${manual.moves[state.stepIndex].san}`,
        wrongCounts,
        hintFrom: null,
        hintTo: null,
      };
    }

    // Correct — apply and advance
    const parsed = parseUci(uci)!;
    const nextIndex = state.stepIndex + 1;
    const complete = nextIndex >= manual.moves.length;
    return {
      ...state,
      fen: applied.fen,
      stepIndex: nextIndex,
      selected: null,
      legalTargets: [],
      lastMove: parsed,
      hintFrom: null,
      hintTo: null,
      status: complete ? 'complete' : 'playing',
      feedback: complete ? '本谱已背完' : null,
      comment: commentFor(manual, state.stepIndex),
      maxReached: Math.max(state.maxReached, nextIndex),
    };
  }

  // First click: select own piece with legal moves
  const piece = pieceAt(state.fen, square);
  if (!piece) {
    return { ...state, selected: null, legalTargets: [], feedback: null };
  }

  const moves = legalMovesFrom(state.fen, square);
  if (moves.length === 0) {
    return { ...state, selected: null, legalTargets: [], feedback: '该子无合法着' };
  }

  return {
    ...state,
    selected: square,
    legalTargets: moves.map((m) => parseUci(m)!.to),
    feedback: null,
    hintFrom: null,
    hintTo: null,
  };
}

export function showHint(manual: Manual, state: PracticeState): PracticeState {
  const expected = expectedUci(manual, state.stepIndex);
  if (!expected || state.status === 'complete') return state;
  const parsed = parseUci(expected);
  if (!parsed) return state;
  return {
    ...state,
    hintFrom: parsed.from,
    hintTo: parsed.to,
    feedback: `提示：${manual.moves[state.stepIndex].san}`,
    selected: null,
    legalTargets: [],
  };
}

export function restartPractice(manual: Manual, keepWrong?: Record<string, number>): PracticeState {
  return {
    ...initialPracticeState(manual),
    wrongCounts: { ...(keepWrong ?? {}) },
  };
}

export function toProgress(state: PracticeState): ManualProgress {
  return {
    maxReached: state.maxReached,
    wrongCounts: state.wrongCounts,
    lastStudiedAt: new Date().toISOString(),
  };
}

/** Rebuild fen for a given step (for future review mode). */
export function fenAtStep(manual: Manual, stepIndex: number): string {
  if (stepIndex <= 0) return manual.startFen;
  return fenAfterMoves(
    manual.startFen,
    manual.moves.slice(0, stepIndex).map((m) => m.uci),
  );
}
