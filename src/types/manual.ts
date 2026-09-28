export type ManualCategory = 'opening' | 'middlegame' | 'endgame';
export type SideToMemorize = 'red' | 'black' | 'both';

export type ManualMove = {
  /** 中文着法，如「炮二平五」 */
  san: string;
  /** 坐标着法，如「h2e2」，供引擎校验 */
  uci: string;
};

export type Manual = {
  id: string;
  title: string;
  category: ManualCategory;
  sideToMemorize: SideToMemorize;
  /** 起始局面 FEN（象棋） */
  startFen: string;
  moves: ManualMove[];
  /** 按着法下标的注释，可选 */
  comments?: Record<string, string>;
};

export type ManualProgress = {
  maxReached: number;
  wrongCounts: Record<string, number>;
  lastStudiedAt?: string;
};
