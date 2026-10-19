# Jasmine’s Odyssey · 寧寧要回家

A complete browser game about a little girl, a magical lantern, and finding the way home. Ten fixed, hand-authored forest mazes reward exploration, memory, and well-timed light. English is the default; Traditional Chinese is available throughout the interface.

Built against the supplied **Jasmine’s Odyssey GDD v1.0**. A full text extraction is retained in [docs/GDD-v1.0.txt](docs/GDD-v1.0.txt).

## Run

Requires Node.js 22.12+ (validated with Node 24) and npm. No database, account, API key, or backend is required.

```sh
npm ci
npm run dev
```

Vite prints the address and uses port 5173 by default. Use the existing checkout; a separate Git worktree is unnecessary.

For a production build:

```sh
npm run build
npm run preview
```

Deploy the contents of `dist/` to any static HTTPS host. All game art, fonts, and sound are provided locally; the running game does not use third-party services. A service worker/offline-install experience is outside v1.0; serving the built files still requires a web server.

## Deployment

The `Deploy game to GitHub Pages` workflow tests and builds the game on every push to `main`, then publishes `dist/` using GitHub Pages. In repository **Settings → Pages**, the source must be **GitHub Actions**. The deployment environment reports the live game URL after a successful publish.

The workflow sets `BASE_PATH=/jasmine-odyssey/` so scripts, fonts, and icons work on the GitHub project site. Local development continues to use `/`. For another host or project path, set `BASE_PATH` when building.

繁體中文：執行 `npm ci` 安裝依賴，再以 `npm run dev` 啟動。點選右上角「繁中」即可切換語言；遊戲進度不會重設。不需要帳號、金鑰或資料庫。

## Play

- Move with **WASD**, **arrow keys**, or the on-screen direction pad.
- **Space** or the lantern button reveals a circle through the trees for **one second**. Recharge takes **five seconds from activation**. Movement continues throughout.
- Explored areas remain dimly visible until the next attempt. There is no time limit, and every maze can be completed without the lantern.
- Reach the cottage to stop the clock. Each maze keeps its five fastest local records; lantern usage never affects ranking. Equal times retain arrival order, and a tie at a full board’s cutoff does not displace an earlier run.
- A successful journey with zero lantern activations earns **No Lantern Run / 無燈挑戰**.
- Pause, switching tabs, losing window focus, or a frame gap longer than one second suspends movement, the stopwatch, and lantern timing. Resume explicitly. An unfinished attempt does not survive page reload.
- Sound is off by default. Settings include optional chimes and gentle light; the OS reduced-motion preference is respected on first use. Reduced effects preserve the exact reveal information.

Records and preferences are local to this browser/origin. Corrupt record data is preserved rather than overwritten; clear records explicitly to reset it. If storage is unavailable, the game works with records kept for the current visit. Local records are editable and are not tamper-proof.

## Verify

```sh
npm test                 # 40 core/geometry/data tests
npm run build            # strict TypeScript check + production bundle
npm run test:browser      # 19 Chromium integration tests
```

Browser tests use `/usr/bin/chromium` when available, or the standard Playwright Chromium installation otherwise. On a machine without Chromium, run `npx playwright install chromium` once. A custom executable can be set with `CHROMIUM_PATH`.

The browser suite drives actual keyboard input through all ten mazes, injects actual touch events, saves/reloads/clears records, switches languages, and exercises failure handling and responsive layouts. A read-only development probe lets tests observe state; the production bundle excludes it. Screenshots and failure traces are generated in ignored `test-results/`.

See [the verification report](docs/verification.md) for acceptance coverage and remaining human/device checks. See [maze curation](docs/maze-curation.md) for design intentions, metrics, and a **spoiler** contact sheet.

## Architecture

| Module                                           | Responsibility                                                                                   |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------ |
| `src/core/mazes.ts`, `types.ts`, `validation.ts` | Immutable, versioned maze data, world objects, coordinates, and graph validation                 |
| `src/core/movement.ts`                           | Continuous circle/tile collision, sliding, diagonal normalization, exact home-entry intersection |
| `src/core/visibility.ts`                         | Persistent exploration at 8×8 subcells per tile, independent of rendering                        |
| `src/core/lantern.ts`                            | Successful activation count, one-second flash, five-second recharge                              |
| `src/core/session.ts`                            | Attempt state, clock, bounded simulation steps, pause, completion                                |
| `src/core/records.ts`, `achievements.ts`         | Five time-ranked records per maze, storage validation, independent achievement predicates        |
| `src/ui/renderer.ts`, `art.ts`                   | Canvas forest/character/fog and original vector storybook illustrations                          |
| `src/ui/i18n.ts`, `preferences.ts`, `audio.ts`   | Centralized bilingual text, preferences, optional synthesized chimes                             |
| `src/main.ts`, `style.css`                       | Screens, native dialogs, input, accessibility labels, responsive layout                          |

The core has no DOM, Canvas, audio, or framework dependencies. For a Godot adaptation, port the explicit ASCII maze data and world-unit constants, circle collision and destination entry rules, session clock, lantern state, and explored subcells. Presentation and platform storage adapters can be replaced independently. World objects and achievement predicates have their own boundaries; no collectibles, inventories, extra modes, or speculative plugin systems are implemented.

## Limits

Chromium desktop and emulated mobile layouts/input have been validated. Real iOS/Android devices, Firefox/WebKit, subjective audio quality, and first-time child/family playtesting remain unverified. Browser walkthroughs and visual inspection establish basic readability and solvability; they do not establish broad enjoyment or final difficulty balance. The canvas maze has labeled keyboard/touch controls but no dedicated nonvisual spatial navigation mode.

Art is original code-drawn vector/Canvas work. Bundled Fraunces and DM Sans fonts are distributed under the SIL Open Font License; see [third-party notices](docs/third-party-notices.md).
