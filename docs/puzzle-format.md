# 残棋格式

内置残棋为 JSON，放在 `src/data/puzzles/`，由 `src/data/puzzles/index.ts` 导出。

## 题库来源

**不要**用引擎手搓局面。当前题库来自经典公开谱：

| 源 | 路径 | 说明 |
|---|---|---|
| 天天象棋「残局挑战」 | `scripts/vendor/ttxq-chuangguan/*.pgn` | 谱着导入；≥三步杀 |
| 《适情雅趣》551 局 | `scripts/vendor/shiqingyaqu/` | 用经典局面；主变由规则引擎搜强制杀（≥三步） |

标签按局面子力自动打：`中级`/`高级`、`车类`/`马类`/`炮类`/`兵类`（不再使用「趣味」）。

重新生成：

```bash
npm run import-classic-puzzles
```

**不需要 AI**：着法来自谱本主变；合法着用 `xiangqi.js` 校验。对方自动走的是谱着，不是引擎算杀。

## Schema

```ts
type Puzzle = {
  id: string;
  title: string;
  tags: string[];              // 中级 / 高级 / 车类 / 马类 / 兵类 / 趣味 …
  difficulty: 1 | 2 | 3 | 4 | 5;
  sideToMove: 'red' | 'black';
  goal: 'red_win' | 'black_win';
  goalLabel: string;           // 「红先胜」
  startFen: string;
  solution: Array<{ san: string; uci: string }>;
  // 偶数下标 = 解题方；奇数下标 = 对方（自动走出）
  comments?: Record<string, string>;
  source?: string;
  defaultFlipped?: boolean;    // 黑先默认 true
};
```

## 交互约定

- **只走解题方**：用户走 `sideToMove`；对方着法取自 `solution` 自动走出。
- **不接引擎算杀**：自动走的是预写主变，不是 AI。
- 合法着校验用 `xiangqi.js`；对错比对 `uci`。

## 进度

AsyncStorage `puzzle:{id}`：

```ts
{ solved, attempts, fails, lastStudiedAt?, flipped? }
```
