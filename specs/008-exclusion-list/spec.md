# 008 — Exclusion list

**Status:** Draft
**Phase:** V1.0
**Depends on:** 002-game-detection, 003-spinner-screen

## Goal

Let users opt individual games out of the spinner pool without uninstalling them.

## Why

Most users have a few games they want installed but never want to play (e.g. a kid's game on a shared device, a game they're saving for later, a benchmark app). Without exclusions, the spinner keeps picking them, the user loses trust, and they abandon the app.

## User stories

- **As a user**, I can open a "Games" screen and toggle each game in/out of the spinner.
- **As a user**, an excluded game is greyed out in the list and never picked by the spinner.
- **As a user**, the spinner respects exclusions silently — I don't get an error or a "spin failed" prompt.
- **As a user**, I can re-include a game with one tap.
- **As a user**, an exclusion reason (free text or preset: "Too long", "Not in mood", "Other") is optional but useful.

## Scope

In scope:

- `excluded_games` table on-device with `package_name`, `reason`, `excluded_at_ms`.
- A "Games" screen showing all detected games (`isGame = true`) with an exclusion toggle and an optional reason picker.
- `useEligibleGames()` hook that returns games minus exclusions; consumed by `useSpin`.
- Bulk operations: exclude / include all in a category (depends on 009; soft-depend, just leave a slot).

Out of scope:

- "Snooze for N days" — could be a V1.1 feature.
- Category-based exclusions — wait for 009.

## Acceptance criteria

1. Toggling exclusion is reflected on the next spin.
2. Excluded games render with reduced opacity and a "Excluded" badge in the Games screen.
3. With *all* games excluded, the spinner shows an empty state with a clear pointer to "Manage Games".
4. Exclusions persist across app restarts.
5. The exclusion reason field is optional; UI doesn't block toggle when empty.

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** Should an excluded game still appear in *history* if previously spun? Default: yes (history is a record, not the pool).
- **NEEDS CLARIFICATION:** Should the spinner show excluded games as faded on the wheel, or omit them entirely? Default: omit entirely.
