# 001 — Foundation

**Status:** Draft
**Phase:** MVP
**Depends on:** —

## Goal

Lay down the bare repository skeleton, build pipeline, and on-device persistence so that all later features can be developed and shipped without infrastructure rework.

## Why

Every other feature spec depends on this. Without it there is no place to put a React component, no SQLite database, and no Android build target.

## User stories

- **As a developer**, I can clone the repo, run `npm install && npm run dev` in `client/`, and have the app running with hot reload.
- **As a developer**, I can produce a debug APK with one documented command.
- **As a developer**, I can open the app in an Android emulator and see a styled placeholder screen confirming the runtime is healthy.
- **As a contributor**, I can read a top-level README and understand the layout and how to add a new feature spec.

## Scope

In scope:

- Repo root: `README.md` (exists), `.gitignore`, `constitution.md` (exists).
- `client/`: web app scaffold that builds with Vite, styles with Tailwind, and wraps with Capacitor for Android.
- On-device SQLite via `@capacitor-community/sqlite` set up to open / create the app database on first run with an empty `initSchema()` (later features add tables).
- A "boot OK" landing screen that: opens the SQLite DB, writes + reads back a sanity-check row, and renders the result. Proves the runtime is wired.
- Capacitor Android project generated and buildable.

Out of scope (deferred to later features):

- Any game-related logic, UI, or database tables.
- Capacitor plugins for PackageManager/Intent (land in 002 / 005).
- Any server, API, or remote anything (the constitution forbids these; nothing to scaffold).

## Acceptance criteria

1. `npm install` in `client/` completes without errors.
2. `npm run dev` starts Vite on a documented port, and the landing route shows "Storage: ok" after the SQLite sanity check succeeds.
3. `npx cap add android` (run once) and `npx cap sync android` succeed, producing an Android project under `client/android/`.
4. A debug APK built via `./gradlew assembleDebug` (in `client/android/`) installs and runs on an emulator, showing the same "Storage: ok" landing.
5. Tailwind utility classes (e.g. `bg-slate-900 text-emerald-400`) render correctly on the landing page.
6. ESLint runs without errors on the scaffolded code.

## Open questions / NEEDS CLARIFICATION

None — all resolved in question round 1.
