# 006 — Spin history

**Status:** Draft
**Phase:** V1.0
**Depends on:** 002-game-detection, 004-weighted-random-engine, 005-game-launch

## Goal

Record every spin (and its outcome), let users browse their history, see stats, and export it.

## Why

History serves two purposes: it powers the weighted-random engine (recency/frequency), and it gives users a satisfying "I've launched 47 games this month" feeling — the kind of stat that makes them open the app one more time.

## User stories

- **As a user**, I can open a "History" screen and see every spin: timestamp, game, whether I launched it.
- **As a user**, I see stats: most-spun game, least-spun, total spins, streaks.
- **As a user**, I can export my history as a JSON or CSV file (share sheet).
- **As a user**, I can clear my history (with a confirmation).
- **As a user**, I can filter history by date range and (later) by category.

## Scope

In scope:

- `spins` table on-device.
- Recording each spin from `useSpin` after the result is determined: `{ packageName, appName, winnerIndex, weightScore, breakdown, fallbackUsed, spunAt, launched (bool, updated by 005) }`.
- "History" screen with infinite scroll.
- Stats sub-page: top-N most spun, top-N least spun, total count, last-7-days count.
- Export: share-sheet integration via `@capacitor/share` and `@capacitor/filesystem`.
- Clear-all with explicit confirmation modal.

Out of scope:

- Server-side sync of history.
- Category filtering (depends on 009).
- Sharing as a generated image (V1.1).

## Acceptance criteria

1. Every spin produces exactly one row in `spins`, written within 50 ms of result determination.
2. The history screen loads the first 50 rows in under 200 ms with 10,000 rows in the table.
3. Stats compute in under 100 ms on a 10,000-row table (use indexed queries).
4. JSON export contains the full row contents in chronological order. CSV export has the columns `timestamp, package_name, app_name, weight_score, launched`.
5. Clear-all wipes both `spins` and `launches`, requires the user to type the word "DELETE" or hold a button for 2 seconds.
6. After clearing, the weighted-random engine immediately reflects the empty history (recency/frequency components reset).

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** Default retention — keep forever, or rotate at the configured `historyLength` (HLD §7.1 defaults to 100)? Default proposal: rotate at the configured limit; user can raise it in settings (007).
- **NEEDS CLARIFICATION:** Should we record spins that the user *cancelled* before the animation finished? Default proposal: no — only record on `state === 'result'`.
