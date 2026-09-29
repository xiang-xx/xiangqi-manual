export type PuzzleSide = 'red' | 'black';

export type PuzzleGoal = 'red_win' | 'black_win';

export type PuzzleMove = {
  /** 中文着法 */
  san: string;
  /** ICCS 坐标着法 */
  uci: string;
};

export type Puzzle = {
  id: string;
  title: string;
  /** 分类：入门 / 中级 / 车类 / 马类 / 兵类 / 趣味 … */
  tags: string[];
  difficulty: 1 | 2 | 3 | 4 | 5;
  sideToMove: PuzzleSide;
  goal: PuzzleGoal;
  /** 展示用，如「红先胜」 */
  goalLabel: string;
  startFen: string;
  /**
   * 主杀法：从 sideToMove 起双方交替；
   * 偶数下标（0,2,4…）为解题方，奇数下标为对方（自动走出）。
   */
  solution: PuzzleMove[];
  comments?: Record<string, string>;
  source?: string;
  /** 首次进入是否黑方在下；未写时黑先默认 true */
  defaultFlipped?: boolean;
};

export type PuzzleProgress = {
  solved: boolean;
  attempts: number;
  fails: number;
  lastStudiedAt?: string;
  flipped?: boolean;
};
