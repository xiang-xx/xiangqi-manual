# 架构说明

## 目标

做一款 **Android 离线背棋谱** App：浏览内置棋谱、按 tag 筛选、双方背谱练习、本地记录进度。无账号、无后端。

## 分层

```
┌─────────────────────────────────────┐
│  UI（Expo Router 页面）               │
│  首页（最近 + tags） / 背谱练习         │
├─────────────────────────────────────┤
│  practice 状态机                      │
│  当前步、选子、对错、提示、注释         │
├─────────────────────────────────────┤
│  Board（SVG 木纹盘 + 棋子）            │
│  engine（vendored xiangqi.js）        │
├─────────────────────────────────────┤
│  manuals（内置 JSON + tags）          │
│  progress（AsyncStorage）             │
└─────────────────────────────────────┘
```

## 目录约定

| 路径 | 职责 |
|------|------|
| `src/app/` | 路由页面；不要放业务组件 |
| `src/components/` | 棋盘、Tag 筛选等 UI |
| `src/data/manuals/` | 内置棋谱；新增一局 = 加 JSON + index 注册 |
| `src/data/tags.ts` | Tag 展示顺序 |
| `src/lib/` | 引擎封装、背谱状态机、进度 |
| `src/lib/vendor/xiangqi.js` | lengyanyu258/xiangqi.js（BSD-2-Clause） |
| `assets/board/` `assets/pieces/` | 棋盘/棋子 SVG 源文件 |
| `scripts/` | 资产生成、PGN/ICCS 导入 |
| `docs/` | 设计文档 |

## 关键交互

1. **首页**：最近背谱（按 `lastStudiedAt`）；多选 tag 取交集筛选列表。
2. **背谱**：默认红黑均由用户走子；与谱着 `uci` 比对；错误提示并重试；正确则展示该步 `comments`（若有）。
3. **进度**：`progress:{manualId}` 存 `maxReached`、各步错误次数、`lastStudiedAt`。

## 不做什么（当前阶段）

- 在线对弈、云同步、账号体系
- AI 分析 / 引擎算杀
- 完整 XQF 图形编辑器
- 复杂变例树编辑（第二期再考虑分支）

## 包名

Android / iOS 包名已定为 `com.xiang.xiangqimanual`（见 `app.json`）。上架后勿轻易修改。
