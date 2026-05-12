# 001 — Foundation — Tasks

Work top-to-bottom. Tasks tagged `[P]` within the same group may run in parallel.

## Group A — Repo root

- [ ] **T001** Create `.gitignore` covering `node_modules/`, `dist/`, `*.sqlite`, `client/android/.gradle/`, `client/android/app/build/`, `client/android/build/`, OS files.
- [ ] **T002** Initialise git repo (`git init`) and commit the scaffold once Group B completes.

## Group B — Client scaffold

- [ ] **T010** Run `npm create vite@latest client -- --template react`, then prune the boilerplate styles.
- [ ] **T011 [P]** Add Tailwind: install `tailwindcss postcss autoprefixer`, run `npx tailwindcss init -p`, configure `content: ['./index.html', './src/**/*.{js,jsx}']`, set up `src/styles/index.css` with `@tailwind base; @tailwind components; @tailwind utilities;`.
- [ ] **T012 [P]** Add runtime deps: `react-router-dom`, `@tanstack/react-query`, `@capacitor/core`, `@capacitor/cli`, `@capacitor/android`, `@capacitor-community/sqlite`.
- [ ] **T013 [P]** Create directory skeleton: `src/{components,context,hooks,services,utils,styles}/`.
- [ ] **T014 [P]** Create `src/context/AppContext.jsx` — empty `AppProvider` for now.
- [ ] **T015 [P]** Create `src/hooks/useTheme.js` returning `'dark'`.
- [ ] **T016** Create `src/services/database.js` per [plan §SQLite setup], including the `settings` table CREATE in `initSchema()`.
- [ ] **T017** Create `src/services/settings.js` with `getSetting`, `setSetting`, `deleteSetting` per [plan §SQLite setup].
- [ ] **T018** Create `src/services/capacitor-plugins.js` (empty for now; later features will export plugins from here).
- [ ] **T019** Create `src/components/BootCheck.jsx` that calls `getDb()`, runs `SELECT 1`, then round-trips a value via `setSetting/getSetting` to prove the infrastructure works. Renders "Storage: ok" / error.
- [ ] **T020** Replace `src/App.jsx` to render `<BootCheck />` inside a Tailwind-styled shell (`bg-slate-900 text-emerald-400`).

## Group C — Capacitor Android

- [ ] **T021** Create `client/capacitor.config.json` per [plan §Capacitor configuration].
- [ ] **T022** Run `npm run build` then `npx cap add android`. Verify `client/android/` exists.
- [ ] **T023** Apply `@capacitor-community/sqlite` Android setup — check its current README; may require registering the plugin in `MainActivity.java` and adding a `JsonConfig` directory. Document exactly what was added in the PR description.
- [ ] **T024** Run `npx cap sync android` to wire plugins.

## Group D — Verification

- [ ] **T030** `npm run dev` and confirm browser shows "Storage: ok".
- [ ] **T031** Open Android Studio on `client/android/`, run on an emulator → confirm same "Storage: ok" landing.
- [ ] **T032** Build a debug APK via `./gradlew assembleDebug`, install on a real device, confirm landing.

## Group E — Linting

- [ ] **T040 [P]** Add ESLint config to `client/` with `eslint:recommended` + `plugin:react/recommended` + `plugin:react-hooks/recommended`. Add `lint` script.
- [ ] **T041** Run `npm run lint` — must pass.

## Done when

- All Group A–E tasks checked off.
- Acceptance criteria 1–6 from `spec.md` all pass manually.
- First commit pushed to the repo.
