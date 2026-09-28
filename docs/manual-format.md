# 棋谱格式

内置棋谱为 JSON，放在 `src/data/manuals/`，并在 `src/data/manuals/index.ts` 中导出。

## Schema

```ts
type Manual = {
  id: string;                 // 稳定 ID，用于进度 key，勿随意改
  title: string;
  category: 'opening' | 'middlegame' | 'endgame';
  sideToMemorize: 'red' | 'black' | 'both';
  startFen: string;           // 象棋 FEN
  moves: Array<{
    san: string;              // 中文着法展示，如「炮二平五」
    uci: string;              // 坐标着法，如「h2e2」
  }>;
  comments?: Record<string, string>; // key 为着法下标字符串
};
```

## 约定

- **内部比较用 `uci`**，避免中文着法歧义。
- **界面展示用 `san`**。
- 第一期只支持 **线性主变**；变例以后用可选 `variations` 扩展，不破坏现有字段。
- `id` 一旦有进度数据就不要改；改标题不影响进度。

## 示例

见 `src/data/manuals/zhongpao-pingfengma-short.json`。

标准开局 FEN：

```
rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1
```

## 新增一局棋谱

1. 新建 `src/data/manuals/<id>.json`
2. 在 `src/data/manuals/index.ts` 中 `import` 并加入 `manuals` 数组
3. 重启 Metro（必要时）后在首页可见

## 进度存储

```ts
// AsyncStorage key: progress:{manualId}
{
  maxReached: number;
  wrongCounts: Record<string, number>; // 着法下标 → 错误次数
  lastStudiedAt?: string;              // ISO 时间
}
```
