# 棋谱格式

内置棋谱为 JSON，放在 `src/data/manuals/`，并在 `src/data/manuals/index.ts` 中导出。

## Schema

```ts
type Manual = {
  id: string;                 // 稳定 ID，用于进度 key，勿随意改
  title: string;
  tags: string[];             // 分类标签：赛事 / 棋手 / 阶段等
  opening?: {                 // 先手 / 后手开局（粗粒度）
    red?: string;             // 如「中炮」「飞相」「仙人指路」
    black?: string;           // 如「屏风马」「顺炮」「中炮」
  };
  sideToMemorize: 'red' | 'black' | 'both'; // 默认 both
  defaultFlipped?: boolean;   // 首次进入是否黑方在下；未写时后手谱（black）默认 true
  startFen: string;           // 象棋 FEN
  moves: Array<{
    san: string;              // 中文着法展示，如「炮二平五」
    uci: string;              // ICCS 坐标着法，如「h2e2」
  }>;
  comments?: Record<string, string>; // key 为着法下标字符串
  source?: string;            // 书名 / 来源备注
};
```

展示用 tag 顺序见 `src/data/tags.ts`；开局词表见 `src/data/openings.ts`。
首页可分别选先手 / 后手开局（如「后手中炮」，或「先手中炮 + 后手屏风马」），再与分类 tag 取交集。

## 约定

- **内部比较用 `uci`（ICCS）**，与 `xiangqi.js` 一致。
- **界面展示用 `san`**。
- 第一期只支持 **线性主变**；变例以后用可选 `variations` 扩展，不破坏现有字段。
- `id` 一旦有进度数据就不要改；改标题不影响进度。
- 黑方中文着法按黑方己方右侧为「一路」理解；写入 `uci` 时用红方视角的 a–i / 0–9。

## 示例

见 `src/data/manuals/ycql/ycql-01.json` 或 `src/data/manuals/modern/`。

标准开局 FEN：

```
rnbakabnr/9/1c5c1/p1p1p1p1p/9/9/P1P1P1P1P/1C5C1/9/RNBAKABNR r - - 0 1
```

## 新增一局棋谱

1. 新建 `src/data/manuals/<id>.json`（或用导入脚本生成）
2. 填写 `tags`、中文 `san`、可选 `comments`
3. 在 `src/data/manuals/index.ts` 中 `import` 并加入 `manuals` 数组
4. 重启 Metro 后在首页可见

### 导入脚本

```bash
# ICCS 坐标着法
npm run import-pgn -- --id demo --title "演示" --moves "h2e2 h9g7"

# 东萍 DhtmlXQ 页面 / UBB
npm run import-dhtmlxq -- --url "http://www.dpxq.com/hldcg/search/view_u_68905.html" --id demo

# 《银川棋路》45 局（写入 src/data/manuals/ycql/）
npm run fetch-ycql

# AI 时代精选：个人赛 / 王天一·郑惟桐近年 / 碧桂园杯 2020–2021
npm run fetch-modern-ai

# 回填 opening（先手/后手），并去掉旧扁平开局 tag
npm run retag-openings

# 按布局补缺口：顺炮 / 列炮 / 单提马 / 三步虎 / 反宫马 / 仙人指路对飞象|中炮
npm run fetch-opening-gaps

# 过宫炮 + 引擎对战（楚河汉界 / 电脑软件赛）
npm run fetch-guogong-ai
```

内置分类 tag：`银川棋路`、`个人赛`、`碧桂园杯`、`王天一`、`郑惟桐` 等；开局写入 `opening`，由东萍 `open` 字段解析。

## 进度存储

```ts
// AsyncStorage key: progress:{manualId}
{
  maxReached: number;
  wrongCounts: Record<string, number>; // 着法下标 → 错误次数
  lastStudiedAt?: string;              // ISO 时间；用于「最近背谱」
  flipped?: boolean;                   // 该谱上次棋盘翻转；优先于 defaultFlipped
}
```

翻转优先级：`progress.flipped` → `manual.defaultFlipped` → `sideToMemorize === 'black'`。
