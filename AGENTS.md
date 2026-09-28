# Agent notes — xiangqi-manual

个人用 Android 象棋背棋谱 App（Expo）。产品与数据设计见 `docs/`。

## Expo has changed — do not trust your training data

Expo ships breaking changes every SDK release. Before writing code that touches Expo, EAS, or React Native APIs:

1. Read the major version of `expo` in `package.json` (currently SDK 57).
2. Fetch versioned docs: `https://docs.expo.dev/versions/v57.0.0/`
3. For corrections to common LLM misconceptions: https://docs.expo.dev/llms.txt

## Commands

```bash
npx expo install <package>  # ALWAYS use instead of npm add for native modules
npx expo start
npx tsc --noEmit
npx expo-doctor
npx expo install --fix
```

## Project rules

- Routes live in `src/app/`. Non-route code goes in `src/components`, `src/lib`, `src/data`, `src/types`.
- Prefer relative imports under `src/` (no `@/` path alias yet; TS 6 deprecates `baseUrl`).
- Manual JSON format: `docs/manual-format.md`. Do not invent a parallel schema.
- No backend. Progress is AsyncStorage only.
- Do not create or hand-edit `android/` / `ios/`; configure via `app.json`.
- Prefer Expo modules; use vendored `src/lib/vendor/xiangqi.js` for rules — do not hand-roll xiangqi legality.
- Manual schema uses `tags[]` (not single category); default `sideToMemorize` is `both`.
- Keep UI focused on board + practice; avoid dashboard clutter.
- Package name `com.xiang.xiangqimanual` is fixed for future store listing.

## Docs map

- `docs/architecture.md` — modules and flows
- `docs/manual-format.md` — chess manual JSON
- `docs/development.md` — local / device / APK
- `docs/roadmap.md` — MVP checklist
- `docs/publishing.md` — Play Store notes
