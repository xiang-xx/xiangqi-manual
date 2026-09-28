# 棋谱格式

内置棋谱为 JSON，放在 `src/data/manuals/`，并在 `src/data/manuals/index.ts` 中导出。

## Schema

```ts
type Manual = {
  id: string;                 // 稳定 ID，用于进度 key，勿随意改
  title: string;
  tags: string[];             // 多标签，如 ["开局","中炮","屏风马"]
  sideToMemorize: 'red' | 'black' | 'both'; // 默认 both
  startFen: string;           // 象棋 FEN
  moves: Array<{
    san: string;              // 中文着法展示，如「炮二平五」
    uci: string;              // ICCS 坐标着法，如「h2e2」
  }>;
  comments?: Record<string, string>; // key 为着法下标字符串
  source?: string;            // 书名 / 来源备注
};
```

展示用 tag 顺序见 `src/data/tags.ts`。

## 约定

- **内部比较用 `uci`（ICCS）**，与 `xiangqi.js` 一致。
- **界面展示用 `san`**。
- 第一期只支持 **线性主变**；变例以后用可选 `variations` 扩展，不破坏现有字段。
- `id` 一旦有进度数据就不要改；改标题不影响进度。
- 黑方中文着法按黑方己方右侧为「一路」理解；写入 `uci` 时用红方视角的 a–i / 0–9。

## 示例

见 `src/data/manuals/zhongpao-pingfengma-short.json`。

标准开局 FEN：

```
rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1
```

## 新增一局棋谱

1. 新建 `src/data/manuals/<id>.json`（或用 `npx tsx scripts/import-pgn.ts` 生成模板）
2. 填写 `tags`、中文 `san`、可选 `comments`
3. 在 `src/data/manuals/index.ts` 中 `import` 并加入 `manuals` 数组
4. 重启 Metro 后在首页可见

## 进度存储

```ts
// AsyncStorage key: progress:{manualId}
{
  maxReached: number;
  wrongCounts: Record<string, number>; // 着法下标 → 错误次数
  lastStudiedAt?: string;              // ISO 时间；用于「最近背谱」
}
```
