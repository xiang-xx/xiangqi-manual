# 上架说明

当前以个人自用为主。技术栈（Expo）支持后续上架，无需重写。

## Google Play（优先）

1. 注册 Google Play 开发者账号（一次性费用）
2. `app.json` 中 `android.package` 保持 `com.xiang.xiangqimanual`
3. EAS 打 **AAB**：`eas build -p android --profile production`
4. 准备：应用图标与截图、简短介绍、隐私政策 URL
5. 数据安全问卷：如实填写「仅本地存储、无账号、无收集」

隐私政策至少说明：

- 棋谱为 App 内置
- 学习进度仅存在本机
- 不上传个人数据

## 国内应用商店

华为 / 小米 / 应用宝等通常对资质、软著要求更高，适合作为 Google Play 之后的第二步，不必为此改技术栈。

## 版权

公开发布前确认棋谱来源：公共领域、自编、或已获授权。个人自用侧载 APK 风险较低，上架分发需更谨慎。

## iOS（可选）

同一仓库可打 IPA，需 Apple 开发者账号。Android 稳定后再考虑。
