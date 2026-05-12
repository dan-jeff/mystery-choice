# 009 — Category detection — Plan

References: HLD §6, [`../002-game-detection/plan.md`](../002-game-detection/plan.md).

## Schema additions

Add to `games` table (migration, not a fresh init):

```sql
ALTER TABLE games ADD COLUMN detected_category TEXT;
ALTER TABLE games ADD COLUMN user_category TEXT;
```

Effective category:

```sql
COALESCE(user_category, detected_category, 'OTHER') AS category
```

## Native side

Extend the `GameDetector` plugin (002):

- Map `ApplicationInfo.category` constants:
  - `CATEGORY_GAME_ACTION` → `ACTION`
  - `CATEGORY_GAME_PUZZLE` → `PUZZLE`
  - `CATEGORY_GAME_RPG` → `RPG`
  - `CATEGORY_GAME_STRATEGY` → `STRATEGY`
  - `CATEGORY_GAME_RACING` → `RACING`
  - `CATEGORY_GAME_SPORTS` → `SPORTS`
  - `CATEGORY_GAME_CARD` → `CARD_BOARD`
  - `CATEGORY_GAME_CASUAL` → `CASUAL`
  - `CATEGORY_GAME_EDUCATIONAL` → `OTHER` (no separate bucket in v1)
  - any other → `null` (let the keyword heuristic decide)
- Return `category: <string|null>` per game.

Note: `ApplicationInfo.category` was added in API 26. Min SDK is 26 (constitution §2), so always available.

## Keyword heuristic

`client/src/services/category-detection.js`:

```js
const KEYWORDS = {
  ACTION:    ['action', 'shooter', 'fps', 'battle', 'arena', 'combat'],
  RPG:       ['rpg', 'role', 'fantasy', 'adventure', 'quest', 'kingdom'],
  PUZZLE:    ['puzzle', 'brain', 'logic', 'match', 'tile', 'sudoku'],
  STRATEGY:  ['strategy', 'tactics', 'empire', 'civilization', 'tower defense'],
  RACING:    ['racing', 'race', 'drive', 'car', 'moto', 'kart'],
  SPORTS:    ['sports', 'football', 'soccer', 'basketball', 'tennis', 'golf'],
  CARD_BOARD:['card', 'board', 'chess', 'checkers', 'mahjong', 'solitaire'],
  CASUAL:    ['casual', 'arcade', 'fun', 'simple', 'idle'],
};

export function inferCategory(label) {
  const lower = label.toLowerCase();
  for (const [cat, words] of Object.entries(KEYWORDS)) {
    if (words.some(w => lower.includes(w))) return cat;
  }
  return 'OTHER';
}
```

After native scan, `services/game-detection.js`'s `rescan()` runs:

```js
const category = nativeCategory ?? inferCategory(appName);
```

…and writes to `games.detected_category` *only* (never touches `user_category`).

## Hook & filter

`useCategoryFilter()` — list of active category strings, persisted in the `settings` table under key `category_filter_v1` via the `settings.js` helpers from 001.

`useEligibleGames()` (from 008) becomes:

```js
return games
  .filter(g => !exclusions.has(g.packageName))
  .filter(g => filter.length === 0 || filter.includes(effectiveCategory(g)));
```

## UI

- Category badge component used in `ManageGames`, history rows, result card.
- Category chips bar on `SpinnerScreen`: 9 chips, toggle each, "All" to clear.
- Override picker in `ManageGames` row.

## Risks

- **Locale-only labels.** A French-named app may not match English keywords. Acceptable for v1; users can override. Reconsider in V1.1 if Play Store reviews complain.
- **Keyword false positives** (e.g. an app called "Battle Notes" → ACTION). Heuristic order matters less than coverage; users can override.
