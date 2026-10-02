# AI 对弈设计（Pikafish）

## 目标

在 App 内 **离线** 与强力象棋引擎对战，可选难度。背谱仍走谱着；**残棋对方在 Android 开发构建下用引擎弱档应着**（见 `docs/puzzle-format.md`）。

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

- 底部 Tab **「对弈」**：选执红/执黑、难度 → 开始（对局写入 `play:games`）
- 对局页 `/play/game`：木纹棋盘 + 思考提示 + 认输 / 再来一局
- **记谱 / 背谱** 底栏 **「演变」**（仅 Android 开发构建有引擎时显示）：以**当前局面**切入对局，执走子方，默认 **高级**；**不写入**对局历史；点 **回原局**（或系统返回）回到切入前的记谱/背谱进度，方便试走演变
- 人走子用点选；轮到 AI 时禁用点选，走完后延迟约 0.3s 再刷新
- Expo Go **不含** 原生模块；需 `npx expo run:android` 开发构建

## 包体与资源

- `libpikafish.so`（arm64）→ `jniLibs/arm64-v8a/`，并开启 `useLegacyPackaging` 解压到 `nativeLibraryDir` 再执行（`filesDir` 在小米等机型常为 noexec）
- `pikafish` + `pikafish.nnue` 仍放 `assets/`（nnue gitignore；二进制作 fallback）
- 拉取：`npm run fetch-pikafish-assets`

## 构建

```bash
npm run fetch-pikafish-assets   # 若尚无 so / nnue
npx expo prebuild --platform android   # 若尚未生成原生工程
npx expo run:android
```

## 明确不做（本期）

- iOS 引擎（先 Android）
- 残棋分析面板 / 多变例验杀讲解
- 联网对弈、云库算招
