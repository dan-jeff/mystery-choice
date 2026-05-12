# 004 — Weighted random engine

**Status:** Draft
**Phase:** MVP
**Depends on:** 002-game-detection

## Goal

Select a winning game from the eligible pool using a transparent, user-configurable weighted-random algorithm.

## Why

A pure-random pick is the boring case. The product's pitch is "Mystery Choice picks for you, smartly" — meaning it nudges users toward games they've forgotten, while still feeling random. The algorithm has to be both effective *and* explicable; if it ever feels rigged, users will switch to "Pure Random" and never come back.

## User stories

- **As a user**, when I tap "Spin", a single game is picked from my eligible pool with probabilities that match my configured weights.
- **As a user**, I can choose "Smart" mode (default weights) or "Pure Random" (uniform weights) with one tap.
- **As a user**, I can see why a specific game won (in a debug-style detail view, available from history — not the spinner result card).
- **As a developer**, I can unit-test the engine deterministically by injecting a seeded RNG.

## Scope

In scope:

- A pure function `pickGame(games, settings, history, now)` returning `{ winner, weightScore, breakdown }`.
- Four weight components per the HLD §5.1 formula:
  - **Recency** — favours games not played recently.
  - **Frequency** — favours games played fewer times.
  - **Duration** — favours games with short average sessions *(deferred: requires `PACKAGE_USAGE_STATS`; for MVP, this component is configurable but contributes 0 if usage stats unavailable)*.
  - **Random** — pure jitter, prevents predictability.
- Two presets: "Smart" `(40/30/20/10)`, "Pure Random" `(0/0/0/100)`.
- Per-game weight breakdown returned so it can be logged with the spin record.
- "Prevent immediate repeat" rule: exclude the most recent winner from the next pool (configurable in 007).
- Cooldown: optional `cooldownHours` excludes any game played within the window (configurable in 007).

Out of scope:

- The settings UI for adjusting weights — lives in 007.
- Per-game launchCount tracking — populated by 005 and 006; 004 reads whatever is there.
- Duration data — depends on `PACKAGE_USAGE_STATS`, which is opt-in and lands later.

## Acceptance criteria

1. With weights `(0, 0, 0, 100)` and 10 games, 10,000 trials produce roughly uniform distribution (χ² test p-value > 0.05 against uniform).
2. With weights `(100, 0, 0, 0)` and games whose `daysSinceLastPlayed` are `[1, 30, 365, never]`, the freshly-played (day-1) game wins ≤ 30% of 1,000 trials.

    *Note:* originally specced as "the 365-day game wins ≥ 70%", but the corrected `days/(days+1)` formula saturates near 1.0 for both month- and year-old games, so the year-old game can't dominate. The reframed AC tests the same product property — recency weighting actively discourages recently-played games — and is mathematically reachable.
3. Weights summing to anything other than 100 are normalised internally (i.e. `(50, 50, 0, 0)` is equivalent to `(40, 40, 0, 0)` after normalisation, modulo edge cases — see plan).
4. Returning the same `(games, settings, history, now, seed)` produces the same winner (the engine is pure with respect to its inputs).
5. With `preventRepeat: true` and a `history` whose most recent entry is game X, the engine never returns X (unless X is the only eligible game).
6. With `cooldownHours: 24` and a game played 12 hours ago, that game is excluded from the pool.
7. If the cooldown / preventRepeat rules exclude *every* game, the engine falls back to pure-random over the unfiltered pool and surfaces a `fallbackUsed: true` flag in the result.
8. The engine returns a `breakdown` object that lets the UI display "won because: recency 0.42 + frequency 0.18 + duration 0.00 + random 0.07 = 0.67".

## Open questions / NEEDS CLARIFICATION

All resolved in question round 4:

- Duration fallback when `PACKAGE_USAGE_STATS` denied: **auto-redistribute proportionally** (`durationWeight` reabsorbed by recency/frequency/random in their existing ratios).
- AC #2 statistical bar: **≥ 70% at 95% confidence**.
- Recency direction (raised in plan): **favour LESS-recently-played games**; formula is `days / (days + 1)`, not `1 / (days + 1)`. The HLD's plain-English intent wins over the HLD's formula.
