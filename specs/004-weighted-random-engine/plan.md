# 004 — Weighted random engine — Plan

References: HLD §5 (formula), [`../002-game-detection/plan.md`](../002-game-detection/plan.md), [`../006-spin-history/plan.md`](../006-spin-history/plan.md).

## Module shape

`client/src/services/random-engine.js`:

```js
/**
 * @param {Game[]} games               eligible games from useGames()
 * @param {EngineSettings} settings    user-configured weights + rules
 * @param {Spin[]} history             recent spin records (most recent first)
 * @param {number} now                 epoch ms — injected for testability
 * @param {() => number} rand          0..1 RNG — injected for testability (default Math.random)
 * @returns {SpinResult}
 */
export function pickGame(games, settings, history, now, rand = Math.random) { ... }
```

Types (informal JSDoc, no TS in MVP):

```ts
type EngineSettings = {
  recencyWeight: number;       // 0..100
  frequencyWeight: number;     // 0..100
  durationWeight: number;      // 0..100
  randomWeight: number;        // 0..100
  preventRepeat: boolean;
  cooldownHours: number;       // 0..168
  durationAvailable: boolean;  // false when PACKAGE_USAGE_STATS denied
};

type SpinResult = {
  winner: Game;
  weightScore: number;
  breakdown: { recency: number; frequency: number; duration: number; random: number; total: number };
  fallbackUsed: boolean;
};
```

## Algorithm

```
1. Filter games:
   - Drop the most recent winner if settings.preventRepeat.
   - Drop games whose lastPlayed (from history) is within settings.cooldownHours.
   → eligible

2. If eligible is empty:
   - Fall back to the unfiltered games list.
   - fallbackUsed = true.

3. If only one eligible game:
   - Return it with breakdown set to all zeros, weightScore = 1.

4. Normalise weights:
   - If !settings.durationAvailable, set durationWeight = 0 and redistribute its share proportionally across recency/frequency/random (preserving their ratios).
   - Then divide each by their sum to get fractions that sum to 1.

5. For each game g, compute components in [0, 1]:
   - daysSince = daysSinceLastPlayed(g, history, now)            // Infinity for never-played
   - recencyScore = daysSince / (daysSince + 1)                  // asymptote to 1 for old, 0 for fresh
   - frequencyScore = 1 / (launchCount(g, history) + 1)          // higher score for less-played
   - durationScore = settings.durationAvailable
                       ? 1 / (avgSessionMinutes(g) + 1)
                       : 0                                       // higher score for short sessions
   - randomScore = rand()

6. Combine:
   weightScore(g) = recencyScore * fRecency
                  + frequencyScore * fFrequency
                  + durationScore * fDuration
                  + randomScore * fRandom

7. Choose g by weighted sampling (cumulative-sum + rand() lookup).
```

`launchCount(g, history)` = number of entries in `history` whose `packageName === g.packageName`. `daysSinceLastPlayed` = `(now - mostRecentSpin.timestamp) / 86_400_000`, or `Infinity` if never played (which makes `recencyScore → 1` — never-played games are maximally favoured, as the product intends).

> **Recency formula direction.** The HLD §5.1 formula `1 / (days + 1)` was inverted relative to the HLD's plain-English description ("higher = played longer ago"). Resolved 2026-05-11: we follow the English intent and use `days / (days + 1)`. This favours neglected games — the core product pitch (constitution §1.4). Document the resolution inline in the source so a future reader doesn't re-read the HLD and "fix" it back.

## Determinism

`pickGame` takes `rand` as a parameter (default `Math.random`). Tests inject a seeded RNG (use `seedrandom` or a tiny hand-rolled mulberry32) so the χ² and "365-day wins ≥ 70%" criteria can run reliably.

## Presets

```js
// client/src/services/engine-presets.js
export const PRESETS = {
  smart:       { recencyWeight: 40, frequencyWeight: 30, durationWeight: 20, randomWeight: 10 },
  pureRandom:  { recencyWeight: 0,  frequencyWeight: 0,  durationWeight: 0,  randomWeight: 100 },
};
```

## Files to produce

```
client/src/services/
├── random-engine.js
├── engine-presets.js
├── random-engine.test.js
└── seeded-rng.js                    — mulberry32; only used by tests
```

## Integration

`useSpin` from 003 calls `pickGame()` directly. Settings come from `useSettings()` (the hook returns defaults from `engine-presets.js` until 007 lands). History is read from a `useHistory()` hook (stub returning `[]` until 006 lands).

## Risks

- **Statistical AC stability.** Setting AC #1 too tight makes the test flaky; too loose makes it useless. Plan implements with 10,000 trials and 95% confidence band; reduce trial count if test runtime exceeds 100 ms.
- **HLD formula ambiguity.** Noted above. Document the interpretation in the source.
