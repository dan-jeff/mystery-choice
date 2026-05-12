# 007 — Settings

**Status:** Draft
**Phase:** V1.0
**Depends on:** 002-game-detection, 004-weighted-random-engine, 006-spin-history

## Goal

Give users control over the weighted engine, history retention, theme, haptics, and the "is a game" manual overrides — all from one place.

## Why

Without a settings screen, the engine's preset is fixed at "Smart" and overrides land in dev-only tools. Settings is also where the GDPR data-export and delete-all entry points live (constitution §5).

## User stories

- **As a user**, I can adjust the four weight sliders and see them re-normalise as I move them.
- **As a user**, I can switch between "Smart" and "Pure Random" presets in one tap.
- **As a user**, I can toggle "Prevent immediate repeat" and set "Cooldown hours" (0–168).
- **As a user**, I can set history retention (10–1000 spins).
- **As a user**, I can toggle haptics and sound.
- **As a user**, I can pick a theme (dark / light / neon).
- **As a user**, I can manually mark/unmark apps as games.
- **As a user**, I can export all my data and delete all my data from here.

## Scope

In scope:

- Settings persistence via the single `settings` SQLite table (introduced in 001) — engine weights, UI scalars (haptics, theme, sound), and one-shot flags all live there.
- Weight slider UI — four sliders with live re-normalisation, a numeric label showing the percentage.
- Preset buttons.
- "Manage games" sub-page reusing the data from 002, with toggle switches and "Restore defaults" entries.
- Data export / delete-all entries that hand off to 006.

Out of scope:

- Cloud backup / cross-device settings sync.
- Per-game weight overrides (V1.1).

## Acceptance criteria

1. Adjusting any slider live-updates the others so the four always sum to 100.
2. Tapping "Smart" or "Pure Random" snaps all four sliders to the preset.
3. Settings persist across app restarts.
4. Changing `cooldownHours` immediately affects the next spin (engine re-reads settings).
5. Changing the theme updates the UI within 100 ms without restart.
6. Toggling a game's "is a game" override here is reflected in the spinner pool on the next spin.
7. "Delete all data" prompts for confirmation and wipes settings + spins + launches + games tables, then returns the user to the permissions explainer state.

## Open questions / NEEDS CLARIFICATION

- **NEEDS CLARIFICATION:** Re-normalisation feel — when the user drags one slider up, do the other three drop proportionally to their current values (preserving ratio) or equally? Default proposal: proportional.
- **NEEDS CLARIFICATION:** Theme palettes — does "neon" mean cyberpunk-bright or muted neon? Defer to mockups before T620.
