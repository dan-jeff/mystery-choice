# Specs

Spec Kit-style feature specifications. Each folder contains:

- `spec.md` — what & why (implementation-agnostic)
- `plan.md` — how (architecture, data model)
- `tasks.md` — numbered, executable implementation tasks

See [`../constitution.md`](../constitution.md) for project-wide rules that all specs inherit.

## Feature index

### MVP (HLD §12.2 — Sprint 1 & 2, 4–6 weeks)

| # | Feature | Summary |
|---|---------|---------|
| [001](./001-foundation/spec.md) | Foundation | Scaffold `client/`; Vite + Tailwind + Capacitor + on-device SQLite |
| [002](./002-game-detection/spec.md) | Game detection | Query installed games via PackageManager (Capacitor plugin); cache locally |
| [003](./003-spinner-screen/spec.md) | Spinner screen | Animated wheel-of-icons spinner, spin trigger, result reveal |
| [004](./004-weighted-random-engine/spec.md) | Weighted random engine | Compute selection probabilities; default favours neglected games |
| [005](./005-game-launch/spec.md) | Game launch | Launch the winning game via Android Intent; error handling and fallback |

### V1.0 (HLD §12.2 — Sprint 3, 8–10 weeks)

| # | Feature | Summary |
|---|---------|---------|
| [006](./006-spin-history/spec.md) | Spin history | Record each spin; view past spins; export; stats |
| [007](./007-settings/spec.md) | Settings | Weight sliders, prevent-repeat toggle, cooldown, theme, haptic |
| [008](./008-exclusion-list/spec.md) | Exclusion list | Toggle individual games in/out of the spinner pool |
| [009](./009-category-detection/spec.md) | Category detection | Auto-detect categories from metadata; manual override; category filter |
| [010](./010-tip-jar/spec.md) | Tip jar | Optional "Support development" one-time purchase via Google Play Billing |

### V1.1 (out of scope for initial spec write-up)

Analytics, image/CSV export, theme variants (dark/light/neon), polish. To be specced when V1.0 nears completion.

## Working with specs

1. Pick a feature folder.
2. Read `spec.md` first — the *what* is technology-agnostic.
3. Read `plan.md` for the *how*. If anything is marked `NEEDS CLARIFICATION:`, resolve it before proceeding.
4. Work through `tasks.md` linearly. Tasks marked `[P]` can be done in parallel with other `[P]` tasks in the same group.

Tasks reference files by path. When implementation lands, the path is the authoritative source — tasks may go out of date, the code does not.
