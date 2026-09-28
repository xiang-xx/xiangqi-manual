# 开发指南

## 环境

- Node.js **22**（推荐用 nvm；项目有 `.nvmrc`。Node 25 会触发 Expo config plugin 的 type-stripping 错误）
- 手机：Android + [Expo Go](https://expo.dev/go)
- 电脑与手机同一局域网

## 常用命令

```bash
npm install
npm start              # 启动 Metro，扫码用 Expo Go
npm run android        # 尝试打开 Android
npm run typecheck      # TypeScript 检查
npm run generate-assets
npm run import-pgn -- --id demo --title "演示" --moves "h2e2 h9g7"
npm run fetch-ycql          # 拉取《银川棋路》45 局
npm run import-dhtmlxq -- --url "…" --id demo
```

安装原生相关依赖时，优先：

```bash
npx expo install <package>
```

不要直接 `npm install` 随便选版本，以免和 SDK 57 不兼容。

## 项目注意点

- 路由在 `src/app/`，业务代码不要塞进路由文件过深。
- `react-native-reanimated` 插件必须放在 `babel.config.js` 的 plugins **最后一项**。
- 无 `android/` / `ios/` 目录是正常的（CNG）；原生配置改 `app.json`。

## 真机调试

1. `npm start`
2. Expo Go 扫终端二维码
3. 若连不上：确认防火墙、试 `npx expo start --tunnel`

## 打自用 APK（以后）

1. 安装并登录 EAS：`npx eas-cli@latest login`
2. `npx eas-cli@latest build:configure`
3. `npx eas-cli@latest build -p android --profile preview`（APK，方便侧载）

上架用 Play 时再打 AAB，见 [publishing.md](./publishing.md)。

## 文档与 Agent

根目录 `AGENTS.md` 面向 Cursor / 自动化助手，含 Expo SDK 使用约束。人工开发以本目录文档为准。
