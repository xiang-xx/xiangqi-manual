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

背谱 / 残棋可用 Expo Go。**对弈（Pikafish）必须用开发客户端**（含原生引擎模块）。

```bash
npm run fetch-pikafish-assets   # 若尚无 so / nnue
npx expo run:android            # 安装「象棋背谱」开发客户端
npm start                       # expo start --dev-client
```

然后从手机桌面打开 **「象棋背谱」**（不要扫码进 Expo Go）。

若 App 提示连不上 `198.18.x.x:8081`（Clash/Surge 等 VPN 假网卡）：USB 调试时用本机端口转发，让手机走 `127.0.0.1`：

```bash
adb reverse tcp:8081 tcp:8081
adb shell am start -a android.intent.action.VIEW \
  -d 'exp+xiangqi-manual://expo-development-client/?url=http%3A%2F%2F127.0.0.1%3A8081'
```

或关掉 VPN / 用 `REACT_NATIVE_PACKAGER_HOSTNAME=10.x.x.x npm start` 指定真实局域网 IP。

若只调试背谱/残棋：

1. `npx expo start`（不加 `--dev-client`）
2. Expo Go 扫终端二维码
3. 若连不上：确认防火墙、试 `npx expo start --tunnel`

对弈细节见 [ai-play.md](./ai-play.md)。

## 打自用 APK（以后）

1. 安装并登录 EAS：`npx eas-cli@latest login`
2. `npx eas-cli@latest build:configure`
3. `npx eas-cli@latest build -p android --profile preview`（APK，方便侧载）

上架用 Play 时再打 AAB，见 [publishing.md](./publishing.md)。

## 文档与 Agent

根目录 `AGENTS.md` 面向 Cursor / 自动化助手，含 Expo SDK 使用约束。人工开发以本目录文档为准。
