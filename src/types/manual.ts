import type { ManualOpening } from '../data/openings';

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
  /** 分类标签：赛事 / 棋手 / 阶段等；开局用 opening */
  tags: string[];
  /**
   * 先手 / 后手开局（粗粒度），如 { red: '中炮', black: '屏风马' }
   */
  opening?: ManualOpening;
  sideToMemorize: SideToMemorize;
  /**
   * 首次进入时是否翻转棋盘（黑方在下）。
   * 未写时：`sideToMemorize === 'black'` 视为 true（后手谱默认翻转）。
   * 用户手动翻转后以本地 progress.flipped 为准。
   */
  defaultFlipped?: boolean;
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
  /** 该谱上次使用的棋盘翻转；有则优先于 defaultFlipped */
  flipped?: boolean;
};
