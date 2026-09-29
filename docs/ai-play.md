# AI 对弈设计（Pikafish）

## 目标

在 App 内 **离线** 与强力象棋引擎对战，可选难度。不改动背谱 / 残棋（残棋对方仍走谱着）。

## 引擎

- **Pikafish**（UCI，GPL-3.0），Android **arm64-v8a** 可执行文件 + `pikafish.nnue`
- 通过 **Expo 本地模块** `modules/pikafish-engine` 用 `Process` 喂 UCI（stdin/stdout），不阻塞 JS 线程
- 合法着仍用现有 `xiangqi.js`；引擎只负责算招
- FEN：xiangqi.js 用 `r`/`b`，发给引擎前转为 `w`/`b`（`toPikafishFen`）

## 难度（用户可选）

映射为 UCI `go movetime`（Threads=1，Hash 随难度略增）：

| 档位 | movetime | Hash |
|------|----------|------|
| 入门 | 200 ms | 16 MB |
| 初级 | 500 ms | 16 MB |
| 中级 | 1500 ms | 32 MB |
| 高级 | 3000 ms | 64 MB |
| 大师 | 8000 ms | 64 MB |

（皮卡鱼无稳定 Skill Level；限时是移动端最稳的控力方式。）

## 界面

- 底部 Tab **「对弈」**：选执红/执黑、难度 → 开始
- 对局页 `/play/game`：木纹棋盘 + 思考提示 + 认输 / 再来一局
- 人走子用点选；轮到 AI 时禁用点选，走完后延迟约 0.3s 再刷新
- Expo Go **不含** 原生模块；需 `npx expo run:android` 开发构建

## 包体与资源

- `libpikafish.so`（arm64）→ `modules/pikafish-engine/android/src/main/jniLibs/arm64-v8a/`
- `pikafish.nnue` → `android/src/main/assets/`（gitignore，首次启动拷到 `filesDir`，UCI `EvalFile`）
- 拉取：`npm run fetch-pikafish-assets`

## 构建

```bash
npm run fetch-pikafish-assets   # 若尚无 so / nnue
npx expo prebuild --platform android   # 若尚未生成原生工程
npx expo run:android
```

## 明确不做（本期）

- iOS 引擎（先 Android）
- 残棋里用引擎验杀 / 分析面板
- 联网对弈、云库算招
