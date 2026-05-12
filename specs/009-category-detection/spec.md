# 009 — Category detection

**Status:** Draft
**Phase:** V1.0
**Depends on:** 002-game-detection

## Goal

Tag each detected game with a category (Action, RPG, Puzzle, Strategy, Racing, Sports, Card/Board, Casual, Other), let users override, and use it as a filter on the spinner.

## Why

"Spin a random RPG" is a far more interesting prompt than "spin a random game" once a user has 60 titles installed. Categories are the primary axis users think along when they're deciding what to play.

## User stories

- **As a user**, every game I see has a category badge.
- **As a user**, I can filter the spinner to one or more categories.
- **As a user**, I can change a game's category if the auto-detection got it wrong.
- **As a user**, the spinner respects the active category filter.

## Scope

In scope:

- Auto-detection priority chain per HLD §6.1:
  1. App's declared `ApplicationInfo.category` (`CATEGORY_GAME_*` enum on API 26+).
  2. Heuristic keyword match on the app label / package name (HLD §6.2 keyword list).
  3. Default to "Other".
- `category` column on the on-device `games` table.
- `user_category` override column.
- UI: category badge on each game row; category multi-select chips on the spinner screen.
- Re-detection runs on every rescan (in case the user changes locale or the label changes).

Out of scope:

- Querying Google Play Store API for canonical categories (deferred; risks Play Store-policy concerns and adds a network dependency).
- Per-user-popular category sorting (V1.1).

## Acceptance criteria

1. The detection heuristic correctly classifies ≥ 80% of a curated 30-game test set (10 action, 10 puzzle, 10 RPG).
2. User overrides survive rescans.
3. Filter chips on the spinner screen narrow the eligible pool atomically; clearing chips restores the full pool.
4. With no games matching the active filter, the spinner shows an empty state pointing to the chips.
5. Categories appear in the language of the device locale (or English fallback for the keyword set).

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** Should keyword matching be case-sensitive? Default: no — lowercase the label and the keyword.
- **NEEDS CLARIFICATION:** Is "Other" a real category the user can filter to, or a fallback bucket hidden from filter chips? Default: real filter, last in the chip list.
- **NEEDS CLARIFICATION:** Do we want sub-categories (e.g. RPG → Tactical RPG, JRPG)? Default: no for V1.0.
