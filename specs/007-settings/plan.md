# 007 — Settings — Plan

References: HLD §5, §7, [`../004-weighted-random-engine/plan.md`](../004-weighted-random-engine/plan.md), [`../006-spin-history/plan.md`](../006-spin-history/plan.md).

## Storage strategy

Single store: the `settings` table introduced in 001 (`client/src/services/database.js`) backs every persisted scalar. Engine weights, history retention, theme, haptics, and one-shot flags (e.g. `permissions_acknowledged_v1`) all live as rows in that table, accessed via the `getSetting / setSetting / deleteSetting` helpers from `client/src/services/settings.js`.

Defaults live in `client/src/services/settings-defaults.js`:

```js
export const DEFAULTS = {
  // engine
  recencyWeight: 40,
  frequencyWeight: 30,
  durationWeight: 20,
  randomWeight: 10,
  preventRepeat: true,
  cooldownHours: 24,
  historyLength: 100,
  durationAvailable: false, // flipped true after PACKAGE_USAGE_STATS opt-in
  // UI
  theme: 'dark',           // 'dark' | 'light' | 'neon'
  hapticEnabled: true,
  soundEnabled: false,
};
```

Reads merge persisted rows with defaults; writes go to the table immediately. React Query holds the cache so component reads are synchronous after the first hydrate.

## Hooks

`useSettings()` is the single hook for all persisted settings. Returns `{ settings, setSetting, resetSetting }`:

- `settings` — merged with `DEFAULTS`, fully populated.
- `setSetting(key, value)` — optimistic write through React Query, then `setSetting` into SQLite.
- `resetSetting(key)` — deletes the override, falls back to default.

`useEngineSettings()` (replaces the stub from 004 T330) is a thin selector over `useSettings()` that returns just the engine-relevant fields.

`useTheme()` (replaces the 001 stub) returns `useSettings().settings.theme`.

## Slider re-normalisation

When the user drags slider X to value `v_x'`, the remaining three (`v_y, v_z, v_w`) scale proportionally to absorb the delta:

```js
const remaining = 100 - v_x_new;
const oldRemainingSum = v_y + v_z + v_w;
if (oldRemainingSum === 0) {
  // edge case: distribute remaining equally
  return { x: v_x_new, y: remaining/3, z: remaining/3, w: remaining/3 };
}
const scale = remaining / oldRemainingSum;
return { x: v_x_new, y: v_y * scale, z: v_z * scale, w: v_w * scale };
```

Round to integers at display time, but keep floats in state to avoid drift.

## Screens

```
client/src/components/settings/
├── SettingsScreen.jsx           — top-level navigation: Spinner / History / Data / About
├── SpinnerSettings.jsx          — sliders + presets + repeat + cooldown
├── WeightSlider.jsx             — single slider with label
├── PresetButtons.jsx            — Smart / Pure Random
├── HistorySettings.jsx          — retention slider
├── ManageGames.jsx              — list of all detected apps + isGame toggles
├── DataSettings.jsx             — export, delete-all (hands off to 006)
├── AppearanceSettings.jsx       — theme + haptics + sound
└── About.jsx                    — version, links
```

Route: `/settings/*` with sub-routes.

## Wiring to engine

`pickGame(games, settings, history, now)` from 004 already takes settings as a parameter. `useSpin` reads from `useEngineSettings()` and passes through.

## Delete-all

Calls `clearAll()` from 006 plus:

```sql
DELETE FROM settings;
DELETE FROM games;
DELETE FROM excluded_games;
```

Then route the user back to the permissions explainer (the explainer keys off `games.length === 0 && !getSetting('permissions_acknowledged_v1')`, both of which are now true).

## Risks

- **Slider drift.** Keep floats internally; integer-display can show 40 + 30 + 20 + 10 = 100, but floats could be 39.997 + 30.001 etc. Engine normalises anyway.
- **Theme transition.** Tailwind dark-mode toggle via `darkMode: 'class'`; "neon" needs custom CSS variables. Build out a `<ThemeProvider>` early.
