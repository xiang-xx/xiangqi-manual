import {
  applyUci,
  createGame,
  fenAfterMoves,
  legalMovesFrom,
  pieceAt,
  turnFromFen,
} from './engine';
import { parseUci, type Square } from './squares';

export type PlaySide = 'red' | 'black';

export type PlayStatus = 'playing' | 'won' | 'lost' | 'draw';

export type PlayState = {
  fen: string;
  /** 本局起点（标准开局或演变切入局面） */
  startFen: string;
  humanSide: PlaySide;
  /** 自 startFen 起的 UCI 序列 */
  moves: string[];
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  status: PlayStatus;
  /** 仅异常/终局短讯；常态文案由 UI 从状态推导 */
  note: string | null;
  thinking: boolean;
};

export type PlayTone =
  | { kind: 'your-move'; title: string; hint: string }
  | { kind: 'waiting'; title: string; hint: string }
  | { kind: 'ended'; title: string; hint: string; tone: 'win' | 'lose' | 'draw' }
  | { kind: 'error'; title: string; hint: string };

function clearSelection(state: PlayState): PlayState {
  return { ...state, selected: null, legalTargets: [] };
}

function outcomeAfter(fen: string, humanSide: PlaySide): {
  status: PlayStatus;
  note: string | null;
} {
  const game = createGame(fen);
  if (!game.game_over()) {
    return { status: 'playing', note: null };
  }
  if (game.in_checkmate()) {
    const mated = turnFromFen(fen);
    if (mated === humanSide) {
      return { status: 'lost', note: '将死' };
    }
    return { status: 'won', note: '将死' };
  }
  return { status: 'draw', note: '双方无子可动' };
}

function rebuild(
  humanSide: PlaySide,
  moves: string[],
  startFen: string,
  noteOverride?: string | null,
): PlayState {
  const fen = moves.length === 0 ? startFen : fenAfterMoves(startFen, moves);
  const lastUci = moves[moves.length - 1];
  const outcome = outcomeAfter(fen, humanSide);
  // 认负等非局面终局：保留 noteOverride
  const resigned = noteOverride === '认负';
  return {
    fen,
    startFen,
    humanSide,
    moves,
    selected: null,
    legalTargets: [],
    lastMove: lastUci ? parseUci(lastUci) : null,
    status: resigned ? 'lost' : outcome.status,
    note: resigned ? '认负' : outcome.note,
    thinking: false,
  };
}

export function initialPlayState(humanSide: PlaySide, startFen?: string): PlayState {
  return rebuild(humanSide, [], startFen ?? createGame().fen());
}

/** 从存档着法恢复（终局可继续悔棋） */
export function restorePlayState(
  humanSide: PlaySide,
  moves: string[],
  opts?: { resigned?: boolean; startFen?: string },
): PlayState {
  return rebuild(
    humanSide,
    moves,
    opts?.startFen ?? createGame().fen(),
    opts?.resigned ? '认负' : undefined,
  );
}

export function isHumanTurn(state: PlayState): boolean {
  if (state.status !== 'playing' || state.thinking) return false;
  return turnFromFen(state.fen) === state.humanSide;
}

/** 顶部状态条文案（避免「请走棋 / 引擎思考中」直白口吻） */
export function playTone(state: PlayState, difficultyLabel: string): PlayTone {
  if (state.note && state.status === 'playing' && !state.thinking) {
    // 非法着等瞬时提示
    if (state.note.length > 0 && !['将死', '双方无子可动'].includes(state.note)) {
      return { kind: 'error', title: state.note, hint: '换一手试试' };
    }
  }

  if (state.status === 'won') {
    return {
      kind: 'ended',
      title: '胜',
      hint: state.note === '将死' ? '对手无路可走' : '本局结束',
      tone: 'win',
    };
  }
  if (state.status === 'lost') {
    return {
      kind: 'ended',
      title: state.note === '将死' ? '负' : '认负',
      hint: state.note === '将死' ? '无路可走' : '再战一局？',
      tone: 'lose',
    };
  }
  if (state.status === 'draw') {
    return { kind: 'ended', title: '和', hint: state.note ?? '本局结束', tone: 'draw' };
  }

  if (state.thinking || turnFromFen(state.fen) !== state.humanSide) {
    return {
      kind: 'waiting',
      title: '对方落子',
      hint: `${difficultyLabel} · 推演中`,
    };
  }

  const ply = state.moves.length;
  return {
    kind: 'your-move',
    title: ply === 0 ? '开局' : '轮到你了',
    hint: ply === 0 ? '点选己方棋子' : '续弈',
  };
}

export function selectPlaySquare(state: PlayState, square: Square): PlayState {
  if (!isHumanTurn(state)) return state;

  const color = state.humanSide === 'red' ? 'r' : 'b';
  const piece = pieceAt(state.fen, square);

  if (state.selected) {
    if (state.legalTargets.includes(square)) {
      const uci = `${state.selected}${square}`;
      return applyHumanMove(state, uci);
    }
    if (piece && piece.color === color) {
      const targets = legalMovesFrom(state.fen, square).map((m) => parseUci(m)!.to);
      return { ...state, selected: square, legalTargets: targets, note: null };
    }
    return clearSelection(state);
  }

  if (!piece || piece.color !== color) return state;
  const targets = legalMovesFrom(state.fen, square).map((m) => parseUci(m)!.to);
  return { ...state, selected: square, legalTargets: targets, note: null };
}

export function applyHumanMove(state: PlayState, uci: string): PlayState {
  if (!isHumanTurn(state)) return state;
  const applied = applyUci(state.fen, uci);
  if (!applied) {
    return { ...clearSelection(state), note: '此着不成' };
  }
  const moves = [...state.moves, uci];
  const outcome = outcomeAfter(applied.fen, state.humanSide);
  return {
    ...clearSelection(state),
    fen: applied.fen,
    moves,
    lastMove: parseUci(uci),
    status: outcome.status,
    note: outcome.note,
    thinking: outcome.status === 'playing',
  };
}

export function beginAiThink(state: PlayState): PlayState {
  if (state.status !== 'playing') return state;
  return {
    ...clearSelection(state),
    thinking: true,
    note: null,
  };
}

export function applyAiMove(state: PlayState, uci: string): PlayState {
  if (state.status !== 'playing') return state;
  const applied = applyUci(state.fen, uci);
  if (!applied) {
    return {
      ...state,
      thinking: false,
      note: '引擎着法异常',
    };
  }
  const moves = [...state.moves, uci];
  const outcome = outcomeAfter(applied.fen, state.humanSide);
  return {
    ...clearSelection(state),
    fen: applied.fen,
    moves,
    lastMove: parseUci(uci),
    status: outcome.status,
    note: outcome.note,
    thinking: false,
  };
}

export function resign(state: PlayState): PlayState {
  if (state.status !== 'playing') return state;
  return {
    ...clearSelection(state),
    status: 'lost',
    thinking: false,
    note: '认负',
  };
}

/**
 * 悔棋：
 * - 对方思考中：撤回刚走的一手
 * - 己方行棋 / 终局：连撤「我方 + 对方」两手（若不足则撤一手）
 */
export function canUndo(state: PlayState): boolean {
  return state.moves.length > 0;
}

export function undoPlay(state: PlayState): PlayState {
  if (!canUndo(state)) return state;
  const take =
    state.thinking || state.moves.length === 1
      ? 1
      : 2;
  return rebuild(state.humanSide, state.moves.slice(0, -take), state.startFen);
}
