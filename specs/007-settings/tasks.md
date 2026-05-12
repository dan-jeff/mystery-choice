# 007 — Settings — Tasks

## Group A — Storage

- [ ] **T600** Confirm the `settings` table already exists from 001 (`database.js` `initSchema()`); add a migration *only* if the schema needs extension (current shape is sufficient).
- [ ] **T601** Extend `client/src/services/settings.js` (created in 001 T017) — already exposes `getSetting / setSetting / deleteSetting`. Add a `getAllSettings()` helper used by `useSettings()` to bulk-load on mount.
- [ ] **T602** Create `client/src/services/settings-defaults.js` per [plan §Storage strategy] — single `DEFAULTS` object covering engine + UI scalars.

## Group B — Hooks

- [ ] **T610** Create `client/src/hooks/useSettings.js` per [plan §Hooks]: React Query backed by `getAllSettings`; mutator wraps `setSetting`.
- [ ] **T611 [P]** Replace `useEngineSettings()` stub (004 T330) with a selector over `useSettings()` returning engine-only fields.
- [ ] **T612 [P]** Replace `useTheme()` (001 T015) with `useSettings().settings.theme`.

## Group C — Slider UI

- [ ] **T620** `WeightSlider.jsx` — single labelled slider with numeric value.
- [ ] **T621** `SpinnerSettings.jsx` with four `WeightSlider`s + the re-normalisation logic from [plan §Slider re-normalisation]. Unit-test the renormalisation function.
- [ ] **T622** `PresetButtons.jsx` — applies a preset by writing all four engine weights atomically.
- [ ] **T623** Toggle row + cooldown slider for `preventRepeat` and `cooldownHours`.

## Group D — Other settings

- [ ] **T630 [P]** `HistorySettings.jsx` — retention slider (10–1000). Writes to engine settings, retention enforced by 006.
- [ ] **T631 [P]** `ManageGames.jsx` — list of all detected apps with toggles; reuses `useGames().toggleIsGame` from 002.
- [ ] **T632 [P]** `AppearanceSettings.jsx` — theme picker, haptic toggle, sound toggle.
- [ ] **T633 [P]** `About.jsx` — version, link to privacy policy, link to constitution, slot for `<TipJarEntry />` (delivered by 010, T930).

## Group E — Theme

- [ ] **T640** Add `darkMode: 'class'` to `tailwind.config.js`.
- [ ] **T641** Create `<ThemeProvider>` in `client/src/context/ThemeContext.jsx` that adds `dark` / `neon` classes to `<html>` based on `usePreferences().theme`.
- [ ] **T642** Define CSS variables for the `neon` theme in `client/src/styles/themes.css`.

## Group F — Data settings

- [ ] **T650** `DataSettings.jsx` with "Export data" (hands off to 006's export sheet) and "Delete all data".
- [ ] **T651** "Delete all data" confirmation modal — hold-to-confirm.
- [ ] **T652** `deleteAllData()` in `settings.js` wipes the `settings`, `games`, `excluded_games` tables + calls 006's `clearAll()`, then routes back to `/permissions`.

## Group G — Routing & nav

- [ ] **T660** Add `/settings`, `/settings/spinner`, `/settings/history`, `/settings/games`, `/settings/data`, `/settings/appearance`, `/settings/about` routes.
- [ ] **T661** Add a bottom-nav or top-right gear icon entry from `SpinnerScreen`.

## Done when

- All AC pass.
- Round-trip: change a weight slider → kill app → reopen → setting persists → next spin reflects it.
