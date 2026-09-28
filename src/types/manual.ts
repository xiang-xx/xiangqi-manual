import type { ManualOpening } from '../data/openings';

export type SideToMemorize = 'red' | 'black' | 'both';

export type ManualMove = {
  /** 中文着法，如「炮二平五」 */
  san: string;
  /** ICCS/坐标着法，如「h2e2」，供引擎校验 */
  uci: string;
};

/**
 * 主变某步的旁路变例（仅记谱可浏览，不参与背谱）。
 * Manual.variations 的 key = 被替代的主变着法下标。
 */
export type ManualVariation = {
  id: string;
  /** 短标签，如「如改走马八进七」 */
  label: string;
  /** 可选说明 */
  comment?: string;
  /** 从分歧局面起的着法（含第一步改走） */
  moves: ManualMove[];
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
  /**
   * 变例：key = 主变着法下标（与 comments 一致）。
   * 仅记谱模式可进入浏览；背谱仍只校验主变。
   */
  variations?: Record<string, ManualVariation[]>;
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
