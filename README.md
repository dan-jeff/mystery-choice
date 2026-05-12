# Mystery Choice

Gamified random game launcher for Android. Detects installed games, presents a spinner, and launches a winning game with optional weighting that nudges toward neglected games.

## Status

Pre-implementation. Architecture and feature specs only. See [`constitution.md`](./constitution.md) and [`specs/`](./specs/).

## Stack

- **App:** React 18 + Vite 5 + Tailwind 3 wrapped via Capacitor 8 for Android
- **On-device data:** SQLite via `@capacitor-community/sqlite` (single store for games, spins, settings, exclusions, UI scalars)
- **No server.** No backend, no Docker, no cloud. The reference app (`jellyfin-monitor`) informs the client architecture only.

## Business model

Free forever. Optional one-time "Support development" purchase via Google Play Billing (tip jar). No ads, no subscriptions, no paywalls.

## Repo layout (target)

```
mystery_choice/
├── constitution.md          — project-wide principles
├── README.md                — this file
├── specs/                   — Spec Kit features (spec.md + plan.md + tasks.md)
└── client/                  — React + Vite + Capacitor app
    ├── android/             — Capacitor Android wrapper
    ├── src/{components,context,hooks,services,utils,styles}/
    └── capacitor.config.json
```
