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

`solution[]` 仍来自谱本主变，供 **提示 / 看答案**，以及 **无 Pikafish 时**对方回退走谱。有引擎时对方由 AI 应着，不强制跟谱。

## Schema

```ts
type Puzzle = {
  id: string;
  title: string;
  tags: string[];              // 中级 / 高级 / 车类 / 马类 / 炮类 / 兵类 …
  difficulty: 1 | 2 | 3 | 4 | 5;
  sideToMove: 'red' | 'black';
  goal: 'red_win' | 'black_win';
  goalLabel: string;           // 「红先胜」
  startFen: string;
  solution: Array<{ san: string; uci: string }>;
  // 参考主变：偶数 = 解题方；奇数 = 对方
  comments?: Record<string, string>;
  source?: string;
  defaultFlipped?: boolean;    // 黑先默认 true
};
```

## 交互约定

- **只走解题方**：用户走 `sideToMove`；对方由 Pikafish（固定「入门」弱档）应着。
- **胜负**：将杀且符合 `goal` → 解题成功；被将杀 / 和棋 → 失败（可重来）。
- **不报对错**：不提示「是不是此路」、不显示剩余步数；合法着即可落子。
- **无引擎（Expo Go）**：对方回退走 `solution` 主变；用户也须跟主变（静默，无对错文案）。
- **提示 / 看答案**：仍用 `solution[]`；偏离主变后提示「已偏离参考着法」。
- 合法着用 `xiangqi.js` 校验。

## 进度

AsyncStorage `puzzle:{id}`：

```ts
{ solved, attempts, fails, lastStudiedAt?, flipped? }
```
