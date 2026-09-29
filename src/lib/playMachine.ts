import {
  applyUci,
  createGame,
  legalMovesFrom,
  pieceAt,
  turnFromFen,
} from './engine';
import { parseUci, type Square } from './squares';

export type PlaySide = 'red' | 'black';

export type PlayStatus = 'playing' | 'won' | 'lost' | 'draw';

export type PlayState = {
  fen: string;
  humanSide: PlaySide;
  selected: Square | null;
  legalTargets: Square[];
  lastMove: { from: Square; to: Square } | null;
  status: PlayStatus;
  feedback: string | null;
  thinking: boolean;
};

function clearSelection(state: PlayState): PlayState {
  return { ...state, selected: null, legalTargets: [] };
}

function outcomeAfter(fen: string, humanSide: PlaySide): Pick<PlayState, 'status' | 'feedback'> {
  const game = createGame(fen);
  if (!game.game_over()) {
    return { status: 'playing', feedback: null };
  }
  if (game.in_checkmate()) {
    // 被将死的一方 = 当前应走方
    const mated = turnFromFen(fen);
    if (mated === humanSide) {
      return { status: 'lost', feedback: '你被将死了' };
    }
    return { status: 'won', feedback: '将死！你赢了' };
  }
  return { status: 'draw', feedback: '和棋' };
}

export function initialPlayState(humanSide: PlaySide): PlayState {
  const fen = createGame().fen();
  return {
    fen,
    humanSide,
    selected: null,
    legalTargets: [],
    lastMove: null,
    status: 'playing',
    feedback: humanSide === 'black' ? '引擎先手…' : '请走棋',
    thinking: false,
  };
}

export function isHumanTurn(state: PlayState): boolean {
  if (state.status !== 'playing' || state.thinking) return false;
  return turnFromFen(state.fen) === state.humanSide;
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
      return { ...state, selected: square, legalTargets: targets, feedback: null };
    }
    return clearSelection(state);
  }

  if (!piece || piece.color !== color) return state;
  const targets = legalMovesFrom(state.fen, square).map((m) => parseUci(m)!.to);
  return { ...state, selected: square, legalTargets: targets, feedback: null };
}

export function applyHumanMove(state: PlayState, uci: string): PlayState {
  if (!isHumanTurn(state)) return state;
  const applied = applyUci(state.fen, uci);
  if (!applied) {
    return { ...clearSelection(state), feedback: '非法着法' };
  }
  const outcome = outcomeAfter(applied.fen, state.humanSide);
  return {
    ...clearSelection(state),
    fen: applied.fen,
    lastMove: parseUci(uci),
    status: outcome.status,
    feedback: outcome.feedback ?? '引擎思考中…',
    thinking: outcome.status === 'playing',
  };
}

export function beginAiThink(state: PlayState): PlayState {
  if (state.status !== 'playing') return state;
  return {
    ...clearSelection(state),
    thinking: true,
    feedback: '引擎思考中…',
  };
}

export function applyAiMove(state: PlayState, uci: string): PlayState {
  if (state.status !== 'playing') return state;
  const applied = applyUci(state.fen, uci);
  if (!applied) {
    return {
      ...state,
      thinking: false,
      feedback: `引擎着法非法：${uci}`,
    };
  }
  const outcome = outcomeAfter(applied.fen, state.humanSide);
  return {
    ...clearSelection(state),
    fen: applied.fen,
    lastMove: parseUci(uci),
    status: outcome.status,
    feedback: outcome.feedback ?? '请走棋',
    thinking: false,
  };
}

export function resign(state: PlayState): PlayState {
  if (state.status !== 'playing') return state;
  return {
    ...clearSelection(state),
    status: 'lost',
    thinking: false,
    feedback: '你认输了',
  };
}
