import type { Manual, ManualMove, ManualProgress, ManualVariation } from '../types/manual';
import { applyUci, fenAfterMoves, legalMovesFrom, pieceAt, uciMatches } from './engine';
import { parseUci, type Square } from './squares';

/** 记谱 = 浏览学习；背谱 = 自己走子校验 */
export type StudyMode = 'study' | 'practice';

/** 记谱模式下进入的旁路变例 */
export type VariationCursor = {
  /** 被替代的主变着法下标 */
  atMove: number;
  variationId: string;
  /** 变例内已走步数 */
  stepIndex: number;
};

export type PracticeState = {
  mode: StudyMode;
  fen: string;
  /** 主变已走步数；在变例内仍表示进入变例前的主变进度（atMove） */
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
  /** 非空 = 正在浏览变例（仅 study） */
  variation: VariationCursor | null;
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
    variation: null,
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

export function variationsAt(manual: Manual, moveIndex: number): ManualVariation[] {
  return manual.variations?.[String(moveIndex)] ?? [];
}

/** 当前说明对应的主变着法下标（刚走出的那手）；开局为 null */
export function commentedMoveIndex(state: PracticeState): number | null {
  if (state.variation) return state.variation.atMove;
  if (state.stepIndex <= 0) return null;
  return state.stepIndex - 1;
}

export function getActiveVariation(
  manual: Manual,
  state: PracticeState,
): ManualVariation | null {
  if (!state.variation) return null;
  const list = variationsAt(manual, state.variation.atMove);
  return list.find((v) => v.id === state.variation!.variationId) ?? null;
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

function fenOnMain(manual: Manual, stepIndex: number): string {
  if (stepIndex <= 0) return manual.startFen;
  return fenAfterMoves(
    manual.startFen,
    manual.moves.slice(0, stepIndex).map((m) => m.uci),
  );
}

function fenOnVariation(manual: Manual, atMove: number, moves: ManualMove[], varStep: number): string {
  const base = fenOnMain(manual, atMove);
  if (varStep <= 0) return base;
  return fenAfterMoves(
    base,
    moves.slice(0, varStep).map((m) => m.uci),
  );
}

/** 跳到已走出 stepIndex 手之后的局面（0 = 开局）。退出变例。 */
export function goToStep(manual: Manual, state: PracticeState, stepIndex: number): PracticeState {
  const clamped = Math.max(0, Math.min(stepIndex, manual.moves.length));
  const fen = fenOnMain(manual, clamped);
  const complete = clamped >= manual.moves.length;
  const lastPlayed = clamped > 0 ? parseUci(manual.moves[clamped - 1].uci) : null;

  return {
    ...clearInteraction(state),
    fen,
    stepIndex: clamped,
    lastMove: lastPlayed,
    status: complete ? 'complete' : 'playing',
    comment: clamped > 0 ? commentFor(manual, clamped - 1) : null,
    variation: null,
  };
}

export function goNext(manual: Manual, state: PracticeState): PracticeState {
  if (state.mode !== 'study') return state;

  if (state.variation) {
    const variation = getActiveVariation(manual, state);
    if (!variation) return exitVariation(manual, state);
    if (state.variation.stepIndex >= variation.moves.length) return state;

    const move = variation.moves[state.variation.stepIndex];
    const applied = applyUci(state.fen, move.uci);
    if (!applied) return state;
    const nextVarStep = state.variation.stepIndex + 1;
    const complete = nextVarStep >= variation.moves.length;
    return {
      ...clearInteraction(state),
      fen: applied.fen,
      lastMove: parseUci(move.uci),
      status: complete ? 'complete' : 'playing',
      comment: variation.comment ?? null,
      feedback: complete ? '变例已看完' : null,
      variation: { ...state.variation, stepIndex: nextVarStep },
    };
  }

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

  if (state.variation) {
    const variation = getActiveVariation(manual, state);
    if (!variation) return exitVariation(manual, state);
    if (state.variation.stepIndex <= 0) {
      // 回到分歧局面，仍留在变例入口（未走出第一步）
      return {
        ...clearInteraction(state),
        fen: fenOnMain(manual, state.variation.atMove),
        lastMove:
          state.variation.atMove > 0
            ? parseUci(manual.moves[state.variation.atMove - 1].uci)
            : null,
        status: 'playing',
        comment: variation.comment ?? null,
        feedback: null,
        variation: { ...state.variation, stepIndex: 0 },
      };
    }

    const undone = parseUci(variation.moves[state.variation.stepIndex - 1].uci);
    const prevVarStep = state.variation.stepIndex - 1;
    return {
      ...clearInteraction(state),
      fen: fenOnVariation(manual, state.variation.atMove, variation.moves, prevVarStep),
      lastMove: undone ? { from: undone.to, to: undone.from } : null,
      status: 'playing',
      comment: variation.comment ?? null,
      variation: { ...state.variation, stepIndex: prevVarStep },
    };
  }

  if (state.stepIndex <= 0) return state;

  const undone = parseUci(manual.moves[state.stepIndex - 1].uci);
  const prevIndex = state.stepIndex - 1;
  const fen = fenOnMain(manual, prevIndex);

  return {
    ...clearInteraction(state),
    fen,
    stepIndex: prevIndex,
    lastMove: undone ? { from: undone.to, to: undone.from } : null,
    status: 'playing',
    comment: prevIndex > 0 ? commentFor(manual, prevIndex - 1) : null,
  };
}

/** 进入变例：局面回到分歧点（主变 atMove 手前） */
export function enterVariation(
  manual: Manual,
  state: PracticeState,
  atMove: number,
  variationId: string,
): PracticeState {
  if (state.mode !== 'study') return state;
  const variation = variationsAt(manual, atMove).find((v) => v.id === variationId);
  if (!variation || variation.moves.length === 0) return state;

  return {
    ...clearInteraction(state),
    fen: fenOnMain(manual, atMove),
    stepIndex: atMove,
    lastMove: atMove > 0 ? parseUci(manual.moves[atMove - 1].uci) : null,
    status: 'playing',
    comment: variation.comment ?? null,
    feedback: `变例：${variation.label}`,
    variation: { atMove, variationId, stepIndex: 0 },
  };
}

/** 返回主变，停在刚看完该步说明的位置（atMove + 1） */
export function exitVariation(manual: Manual, state: PracticeState): PracticeState {
  if (!state.variation) return state;
  const returnStep = Math.min(state.variation.atMove + 1, manual.moves.length);
  return goToStep(manual, state, returnStep);
}

export function switchMode(
  manual: Manual,
  state: PracticeState,
  mode: StudyMode,
): PracticeState {
  if (state.mode === mode) return state;

  if (mode === 'practice') {
    return baseState(manual, {
      mode: 'practice',
      wrongCounts: state.wrongCounts,
      maxReached: state.maxReached,
    });
  }

  const mainStep = state.variation ? state.variation.atMove : state.stepIndex;
  return goToStep(
    manual,
    {
      ...state,
      mode: 'study',
      wrongCounts: state.wrongCounts,
      maxReached: state.maxReached,
    },
    mainStep,
  );
}

export function selectSquare(manual: Manual, state: PracticeState, square: Square): PracticeState {
  if (state.mode !== 'practice') return state;
  if (state.status === 'complete') return state;

  const expected = expectedUci(manual, state.stepIndex);
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
      const key = String(state.stepIndex);
      const wrongCounts = {
        ...state.wrongCounts,
        [key]: (state.wrongCounts[key] ?? 0) + 1,
      };
      return {
        ...state,
        fen: state.fen,
        selected: null,
        legalTargets: [],
        feedback: `不对，谱着是 ${manual.moves[state.stepIndex].san}`,
        wrongCounts,
        hintFrom: null,
        hintTo: null,
      };
    }

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
      variation: null,
    };
  }

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

/** Rebuild fen after `stepIndex` moves have been played on the main line. */
export function fenAtStep(manual: Manual, stepIndex: number): string {
  return fenOnMain(manual, stepIndex);
}
