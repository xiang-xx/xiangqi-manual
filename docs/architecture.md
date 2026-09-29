# 架构说明

## 目标

做一款 **Android 离线背棋谱 + 解残棋 + AI 对弈** App：浏览内置棋谱、按 tag 筛选、双方背谱练习、残棋杀法练习、与 Pikafish 人机对战、本地记录进度。无账号、无后端。

## 分层

```
┌─────────────────────────────────────┐
│  UI（Expo Router）                    │
│  Tabs：背谱 / 残棋 / 对弈              │
│  Stack：记谱·背谱 / 解题 / 人机对局    │
├─────────────────────────────────────┤
│  practiceMachine / puzzleMachine      │
│  playMachine + pikafish（UCI 算招）   │
│  背谱校验谱着；残棋对方走谱；对弈走合法着 │
├─────────────────────────────────────┤
│  Board（SVG 木纹盘 + 棋子）            │
│  engine（vendored xiangqi.js）        │
│  pikafish-engine（Android Process）   │
├─────────────────────────────────────┤
│  manuals / puzzles（内置 JSON）       │
│  progress / puzzleProgress / playGames │
└─────────────────────────────────────┘
```

## 目录约定

| 路径 | 职责 |
|------|------|
| `src/app/` | 路由页面；不要放业务组件 |
| `src/app/(tabs)/` | 底部 Tab：背谱、残棋、对弈 |
| `src/app/play/` | 人机对局页 |
| `src/components/` | 棋盘、Tag 筛选等 UI |
| `src/data/manuals/` | 内置棋谱；新增一局 = 加 JSON + index 注册 |
| `src/data/puzzles/` | 内置残棋；格式见 `docs/puzzle-format.md` |
| `src/data/tags.ts` | 棋谱 Tag 展示顺序 |
| `src/data/puzzleTags.ts` | 残棋 Tag 展示顺序 |
| `src/lib/` | 引擎封装、背谱/残棋/对弈状态机、进度 |
| `src/lib/vendor/xiangqi.js` | lengyanyu258/xiangqi.js（BSD-2-Clause） |
| `modules/pikafish-engine/` | Pikafish UCI 本地模块（见 `docs/ai-play.md`） |
| `assets/board/` `assets/pieces/` | 棋盘/棋子 SVG 源文件 |
| `scripts/` | 资产生成、PGN/ICCS 导入、经典残棋导入、引擎资源 |
| `docs/` | 设计文档 |

## 关键交互

1. **背谱 Tab**：最近背谱；先手/后手开局筛选 + 多选分类 tag 取交集。只筛后手进谱时默认黑在下、只背黑；只筛先手则红在下、只背红。
2. **记谱**：上一步 / 下一步自动走子；展示该步 `comments`；有 `variations` 时可点进旁路浏览，再返回主变；棋盘不可手走。
3. **背谱**：用户走子；与谱着 `uci` 比对；错误提示并重试；正确则展示注释（不背变例）。可选只背红/黑（`progress.practiceSide`，默认双方），对方自动走出主变。
4. **残棋 Tab**：按题材/难度筛选；解题页只走解题方，对方着法取自题库主变自动走出（**不是引擎算杀**）。
5. **对弈 Tab**：选执红/黑与难度开新局；未完可续弈，终局可载入悔棋（`play:games` AsyncStorage）。
6. **进度**：`progress:{manualId}` / `puzzle:{id}` / `play:games` 存本地 AsyncStorage。
7. **翻转**：首次用默认；之后记住该谱/该题上次翻转；对弈按执棋方自动翻转。

## 不做什么（当前阶段）

- 在线对弈、云同步、账号体系
- 残棋引擎验杀 / 分析面板（对弈引擎 ≠ 残棋对方）
- 完整 XQF 图形编辑器
- 复杂变例树编辑（第二期再考虑分支）
- iOS 引擎

## 包名

Android / iOS 包名已定为 `com.xiang.xiangqimanual`（见 `app.json`）。上架后勿轻易修改。
