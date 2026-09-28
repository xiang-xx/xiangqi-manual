export type SideToMemorize = 'red' | 'black' | 'both';

export type ManualMove = {
  /** 中文着法，如「炮二平五」 */
  san: string;
  /** ICCS/坐标着法，如「h2e2」，供引擎校验 */
  uci: string;
};

export type Manual = {
  id: string;
  title: string;
  /** 多标签分类，如 开局 / 中炮 / 屏风马 */
  tags: string[];
  sideToMemorize: SideToMemorize;
  /** 起始局面 FEN（象棋） */
  startFen: string;
  moves: ManualMove[];
  /** 按着法下标的注释，可选 */
  comments?: Record<string, string>;
  /** 书名或来源备注 */
  source?: string;
};

export type ManualProgress = {
  maxReached: number;
  wrongCounts: Record<string, number>;
  lastStudiedAt?: string;
};
