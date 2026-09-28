# 象棋背谱（xiangqi-manual）

个人用的 Android 象棋背棋谱 App：本地内置棋谱、按 tag 筛选、双方离线背谱，类似天天象棋的背棋谱模式，不需要后端。

## 技术栈

- Expo SDK 57 + React Native + TypeScript
- Expo Router（`src/app/`）
- AsyncStorage（学习进度）
- [xiangqi.js](https://github.com/lengyanyu258/xiangqi.js)（走子校验，vendored）
- react-native-svg（木纹棋盘）

## 快速开始

```bash
cd ~/apps/xiangqi-manual
npm install
npm start
```

手机安装 [Expo Go](https://expo.dev/go)，与电脑同一 Wi‑Fi 后扫码即可调试。

```bash
npm run android   # 若已连接模拟器 / 设备
npm run typecheck
npm run generate-assets   # 重新生成棋盘/棋子 SVG
npm run import-pgn -- --id demo --title "演示" --moves "h2e2 h9g7"
```

## 目录

```
src/
  app/                 # 页面路由
  components/          # 棋盘、Tag 筛选
  data/manuals/        # 内置棋谱 JSON
  lib/                 # 引擎、背谱状态机、进度
  types/               # 类型定义
assets/board|pieces/   # 棋盘与棋子 SVG
scripts/               # 资产与导入脚本
docs/                  # 设计与开发文档
```

## 文档

- [架构说明](docs/architecture.md)
- [棋谱格式](docs/manual-format.md)
- [开发指南](docs/development.md)
- [路线图](docs/roadmap.md)
- [上架说明](docs/publishing.md)

## 许可证

个人项目；棋谱内容请自行确认版权后再公开发布。`xiangqi.js` 为 BSD-2-Clause。
