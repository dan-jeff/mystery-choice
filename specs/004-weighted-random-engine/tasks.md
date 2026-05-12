# 004 — Weighted random engine — Tasks

## Group A — Core engine

- [ ] **T300** Create `client/src/services/engine-presets.js` with `PRESETS.smart` and `PRESETS.pureRandom` per [plan §Presets].
- [ ] **T301** Create `client/src/services/random-engine.js` exporting `pickGame(games, settings, history, now, rand?)` per [plan §Algorithm].
  - Implements steps 1–7.
  - Returns `{ winner, weightScore, breakdown, fallbackUsed }`.
  - Uses `recencyScore = days / (days + 1)` (favours neglected games — see [plan §Algorithm — note]).

## Group B — Helpers

- [ ] **T310 [P]** Implement `daysSinceLastPlayed(game, history, now)` — returns `Infinity` if no entry exists for the package.
- [ ] **T311 [P]** Implement `launchCount(game, history)` — counts entries in history.
- [ ] **T312 [P]** Implement `avgSessionMinutes(game)` — stub returning `0` until usage stats land. Document.
- [ ] **T313 [P]** Implement `weightedSample(items, weights, rand)` — cumulative-sum lookup.
- [ ] **T314 [P]** Implement `normaliseWeights(settings)` — handles the `durationAvailable=false` redistribution.
- [ ] **T315 [P]** Create `client/src/services/seeded-rng.js` — mulberry32 seeded RNG.

## Group C — Tests

- [ ] **T320 [P]** `random-engine.test.js`:
  - Uniform distribution under `pureRandom` over 10,000 trials (χ²). AC #1.
  - 365-day game wins ≥ 70% of 1,000 trials under `(100,0,0,0)` weights. AC #2.
  - Same inputs + seed produce same winner. AC #4.
  - `preventRepeat` excludes the most recent winner. AC #5.
  - `cooldownHours` excludes recently-played games. AC #6.
  - Fallback path when filters wipe the pool. AC #7.
  - `breakdown` sums to `weightScore` for the winner. AC #8.
  - Single-game eligible pool short-circuits cleanly.
- [ ] **T321** χ² helper inline in the test file (don't add a stats dependency).

## Group D — Integration

- [ ] **T330** Add `useEngineSettings()` hook in `client/src/hooks/useEngineSettings.js` that returns `PRESETS.smart` for now (replaced by 007).
- [ ] **T331** Add `useHistory()` hook in `client/src/hooks/useHistory.js` returning `[]` for now (replaced by 006).
- [ ] **T332** Replace the `() => games[0]` stub in `useSpin` (003 T210) with `pickGame(eligible, settings, history, Date.now())`.
- [ ] **T333** Add a "Reroll with Pure Random" affordance under the spin button when the user has the smart preset active (low priority — confirms transparency principle from constitution §1.4).

## Group E — Lint & docs

- [ ] **T340 [P]** Lint passes.
- [ ] **T341 [P]** Add a one-page `client/src/services/random-engine.README.md` summarising the algorithm and how to interpret a `breakdown` (links to HLD §5 + this plan).

## Done when

- Acceptance criteria 1–8 from `spec.md` are green.
- The engine is referenced by `useSpin` and the spinner picks correctly.
- The algorithm interpretation note is documented in source.
