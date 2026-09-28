import type { BoardPiece } from './pieces';
import { parseUci, squareFromIndices, type Square } from './squares';
import type { XiangqiMoveVerbose, XiangqiPiece } from './vendor/xiangqi';

// Metro resolves the adjacent .js; types come from xiangqi.d.ts
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { Xiangqi } = require('./vendor/xiangqi.js') as {
  Xiangqi: new (fen?: string) => {
    fen: () => string;
    board: () => Array<Array<XiangqiPiece | null>>;
    moves: (options?: { verbose?: boolean; square?: string }) => string[] | XiangqiMoveVerbose[];
    move: (move: string) => XiangqiMoveVerbose | null;
    get: (square: string) => XiangqiPiece | null;
  };
};

export type BoardGrid = Array<Array<BoardPiece | null>>;

function toBoardPiece(piece: XiangqiPiece | null): BoardPiece | null {
  if (!piece) return null;
  return {
    type: piece.type.toLowerCase() as BoardPiece['type'],
    color: piece.color,
  };
}

export function createGame(fen?: string) {
  return fen ? new Xiangqi(fen) : new Xiangqi();
}

export function boardFromFen(fen: string): BoardGrid {
  const game = createGame(fen);
  return game.board().map((row) => row.map(toBoardPiece));
}

export function fenAfterMoves(startFen: string, ucis: string[]): string {
  const game = createGame(startFen);
  for (const uci of ucis) {
    const result = game.move(uci);
    if (!result) {
      throw new Error(`Illegal move in line: ${uci} (fen ${game.fen()})`);
    }
  }
  return game.fen();
}

export function isLegalMove(fen: string, uci: string): boolean {
  const game = createGame(fen);
  return game.move(uci) != null;
}

export function legalMovesFrom(fen: string, from: Square): string[] {
  const game = createGame(fen);
  const moves = game.moves({ verbose: true, square: from }) as XiangqiMoveVerbose[];
  return moves.map((m) => m.iccs);
}

export function applyUci(
  fen: string,
  uci: string,
): { fen: string; move: XiangqiMoveVerbose } | null {
  const game = createGame(fen);
  const move = game.move(uci);
  if (!move) return null;
  return { fen: game.fen(), move };
}

export function pieceAt(fen: string, square: Square): BoardPiece | null {
  const game = createGame(fen);
  return toBoardPiece(game.get(square));
}

export function squareAt(file: number, rankIndex: number): Square {
  return squareFromIndices(file, rankIndex);
}

export function uciMatches(expected: string, actual: string): boolean {
  const a = parseUci(expected);
  const b = parseUci(actual);
  if (!a || !b) return expected.toLowerCase() === actual.toLowerCase();
  return a.from === b.from && a.to === b.to;
}
