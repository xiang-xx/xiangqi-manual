export type XiangqiColor = 'r' | 'b';

export type XiangqiPiece = {
  type: string;
  color: XiangqiColor;
};

export type XiangqiMoveVerbose = {
  color: XiangqiColor;
  from: string;
  to: string;
  flags: string;
  piece: string;
  iccs: string;
  captured?: string;
};

export type XiangqiInstance = {
  load: (fen: string) => boolean;
  reset: () => void;
  fen: () => string;
  turn: () => XiangqiColor;
  board: () => Array<Array<XiangqiPiece | null>>;
  moves: (options?: { verbose?: boolean; square?: string }) => string[] | XiangqiMoveVerbose[];
  move: (
    move: string | { from: string; to: string },
    options?: { sloppy?: boolean },
  ) => XiangqiMoveVerbose | null;
  undo: () => XiangqiMoveVerbose | null;
  get: (square: string) => XiangqiPiece | null;
  validate_fen: (fen: string) => { valid: boolean; error_number: number; error: string };
  in_check: () => boolean;
  in_checkmate: () => boolean;
  in_stalemate: () => boolean;
  game_over: () => boolean;
};

export const Xiangqi: {
  new (fen?: string): XiangqiInstance;
};
