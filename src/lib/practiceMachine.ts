import type { Manual, ManualProgress } from '../types/manual';
import { applyUci, fenAfterMoves, legalMovesFrom, pieceAt, uciMatches } from './engine';
import { parseUci, type Square } from './squares';

/** 记谱 = 浏览学习；背谱 = 自己走子校验 */
export type StudyMode = 'study' | 'practice';

export type PracticeState = {
  mode: StudyMode;
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

function baseState(
  manual: Manual,
  extras: Partial<PracticeState> & Pick<PracticeState, 'mode' | 'wrongCounts' | 'maxReached'>,
): PracticeState {
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
    ...extras,
  };
}

export function initialPracticeState(
  manual: Manual,
  progress?: ManualProgress | null,
  mode: StudyMode = 'study',
): PracticeState {
  return baseState(manual, {
    mode,
    wrongCounts: { ...(progress?.wrongCounts ?? {}) },
    maxReached: progress?.maxReached ?? 0,
  });
}

function expectedUci(manual: Manual, stepIndex: number): string | null {
  return manual.moves[stepIndex]?.uci ?? null;
}

function commentFor(manual: Manual, stepIndex: number): string | null {
  return manual.comments?.[String(stepIndex)] ?? null;
}

function clearInteraction(state: PracticeState): PracticeState {
  return {
    ...state,
    selected: null,
    legalTargets: [],
    hintFrom: null,
    hintTo: null,
    feedback: null,
  };
}

/** 跳到已走出 stepIndex 手之后的局面（0 = 开局）。 */
export function goToStep(manual: Manual, state: PracticeState, stepIndex: number): PracticeState {
  const clamped = Math.max(0, Math.min(stepIndex, manual.moves.length));
  const fen = fenAtStep(manual, clamped);
  const complete = clamped >= manual.moves.length;
  const lastPlayed = clamped > 0 ? parseUci(manual.moves[clamped - 1].uci) : null;

  return {
    ...clearInteraction(state),
    fen,
    stepIndex: clamped,
    lastMove: lastPlayed,
    status: complete ? 'complete' : 'playing',
    comment: clamped > 0 ? commentFor(manual, clamped - 1) : null,
  };
}

export function goNext(manual: Manual, state: PracticeState): PracticeState {
  if (state.mode !== 'study') return state;
  if (state.stepIndex >= manual.moves.length) return state;

  const uci = expectedUci(manual, state.stepIndex);
  if (!uci) return state;
  const applied = applyUci(state.fen, uci);
  if (!applied) return state;

  const parsed = parseUci(uci)!;
  const nextIndex = state.stepIndex + 1;
  const complete = nextIndex >= manual.moves.length;
  return {
    ...clearInteraction(state),
    fen: applied.fen,
    stepIndex: nextIndex,
    lastMove: parsed,
    status: complete ? 'complete' : 'playing',
    comment: commentFor(manual, state.stepIndex),
    feedback: complete ? '本谱已看完' : null,
  };
}

export function goPrev(manual: Manual, state: PracticeState): PracticeState {
  if (state.mode !== 'study') return state;
  if (state.stepIndex <= 0) return state;

  const undone = parseUci(manual.moves[state.stepIndex - 1].uci);
  const prevIndex = state.stepIndex - 1;
  const fen = fenAtStep(manual, prevIndex);

  return {
    ...clearInteraction(state),
    fen,
    stepIndex: prevIndex,
    // 反向飞子：从落点回到起点
    lastMove: undone ? { from: undone.to, to: undone.from } : null,
    status: 'playing',
    comment: prevIndex > 0 ? commentFor(manual, prevIndex - 1) : null,
  };
}

export function switchMode(
  manual: Manual,
  state: PracticeState,
  mode: StudyMode,
): PracticeState {
  if (state.mode === mode) return state;

  if (mode === 'practice') {
    // 背谱从头开始，保留错题统计
    return baseState(manual, {
      mode: 'practice',
      wrongCounts: state.wrongCounts,
      maxReached: state.maxReached,
    });
  }

  // 记谱：停在当前局面，便于对照着法
  return clearInteraction({
    ...state,
    mode: 'study',
    status: state.stepIndex >= manual.moves.length ? 'complete' : 'playing',
  });
}

export function selectSquare(manual: Manual, state: PracticeState, square: Square): PracticeState {
  if (state.mode !== 'practice') return state;
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
  if (state.mode !== 'practice') return state;
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
    ...initialPracticeState(manual, undefined, 'practice'),
    wrongCounts: { ...(keepWrong ?? {}) },
  };
}

export function toProgress(state: PracticeState, flipped: boolean): ManualProgress {
  return {
    maxReached: state.maxReached,
    wrongCounts: state.wrongCounts,
    lastStudiedAt: new Date().toISOString(),
    flipped,
  };
}

/** Rebuild fen after `stepIndex` moves have been played. */
export function fenAtStep(manual: Manual, stepIndex: number): string {
  if (stepIndex <= 0) return manual.startFen;
  return fenAfterMoves(
    manual.startFen,
    manual.moves.slice(0, stepIndex).map((m) => m.uci),
  );
}
