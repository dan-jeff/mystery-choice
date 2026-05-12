# Mystery Choice — Project Constitution

**Status:** Draft v2
**Last Updated:** 2026-05-11

The constitution captures non-negotiable project-wide principles. Specs and plans inherit these — if a feature spec contradicts the constitution, the constitution wins (or the constitution gets amended via PR with an ADR-style entry below).

---

## 1. Product Principles

1. **Pure on-device app.** All user data (installed-game list, spin history, settings, exclusions) lives on the device. There is no server, no cloud sync, no remote account.
2. **Free forever, with a tip jar.** The app is free to download and use without limits. A one-time in-app "Support development" purchase via Google Play Billing is optional. No ads, no subscriptions, no paywalls.
3. **Spinner-first UX.** The default screen on launch is the spinner. Every other surface (game list, settings, history) is one tap away. Time-to-first-spin should be under 3 seconds on a warm start.
4. **Transparent randomness.** The weighting model is user-configurable and surfaced in the UI. A "Pure Random" preset must always be one tap away. The default model nudges users toward neglected games — never the opposite.
5. **Fail soft, never block the spin.** If game detection partially fails, the spinner uses whatever games it has. If a launch Intent fails, surface a clear error and offer a fallback (Intent chooser, manual launch).

## 2. Tech Stack (binding)

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Mobile shell | **Capacitor 8+** wrapping a web build | Reuse web stack; ship Android binary; access PackageManager/Intent via Capacitor plugins |
| Frontend framework | **React 18 + Vite 5** | Match reference architecture (`jellyfin-monitor`); fast dev loop |
| UI styling | **Tailwind CSS 3** + small component layer | Match reference; minimal custom CSS |
| Client state | **React Query** + Context for app-wide settings | Predictable caching for async work; matches reference |
| On-device DB | **SQLite via `@capacitor-community/sqlite`** | Single store for games, spins, settings, exclusions, UI scalars |
| Min Android | **API 26 (Android 8.0)**; Target API 34 (Android 14) | Per HLD §12.1 |

**Non-goals / explicitly excluded:**
- React Native, native Java/Kotlin modules beyond what a Capacitor plugin requires.
- Any server, backend service, or cloud sync. No Node.js, no Express, no Docker.
- User accounts, login systems, multi-device data sync.
- Any data store on the device other than the single SQLite database.

## 3. Code Conventions

- **ES modules everywhere** (`"type": "module"` in `client/package.json`).
- **Client file layout**: `client/src/{App.jsx, main.jsx, components/, context/, hooks/, services/, utils/, styles/}`.
- **Snake_case** for SQL column names; **camelCase** for JS variables and JSON-shaped objects. Map at the service boundary.
- **One default export per React component file**, named the same as the file (`Spinner.jsx` exports `Spinner`).
- **Schema is forward-only.** Initial v1 tables go in `client/src/services/database.js` `initSchema()` as `CREATE TABLE IF NOT EXISTS`. Once shipped, additive migrations live in `client/src/services/migrations/NNN-description.sql` and are applied in lexical order.
- **No comments that restate the code.** Inline comments only for non-obvious *why*: a workaround, a constraint, an invariant.
- **Errors are caught at the UI boundary.** Services throw; hooks expose `{ data, error, isLoading }`; components render error states.

## 4. Permissions Policy

The app requests the **minimum permissions** required for each feature.

| Permission | Required by | Reviewed against |
|------------|-------------|------------------|
| `QUERY_ALL_PACKAGES` | Game detection | High Play Store scrutiny — must be justified in store listing and in-app permissions explainer (HLD §13) |
| `INTERNET` | Google Play Billing (tip jar) | Standard |
| `VIBRATE` | Haptic on spin result | Standard |
| `PACKAGE_USAGE_STATS` | Optional duration-weighting | **Opt-in only**, never required for core spinner |

Removing a permission is preferred over adding one. New permission requests require an ADR.

## 5. Privacy & Data

- No PII ever leaves the device. Period.
- No telemetry. If telemetry is ever added, it must be opt-in with a clear toggle in Settings — and given §1.1 this is unlikely.
- Users can export and delete all their data from Settings (GDPR).
- Tip-jar purchases are recorded by Google Play; we read the purchase state on-device only.

## 6. Quality Gates

- **Lint:** ESLint with `eslint:recommended` + `plugin:react/recommended` + `plugin:react-hooks/recommended`. Lint must pass before merge.
- **Unit tests:** Vitest. Weighted-random engine and category-detection logic must have unit tests with ≥ 80% line coverage. UI components are unit-tested via React Testing Library for behaviour, not snapshots.
- **Manual test matrix:** Every release is smoke-tested on at least one device per major Android version listed in HLD §14 (8.0, 10, 11, 12, 13, 14).
- **Performance:** Cold start < 2s on a Pixel 4a class device. Spinner animation steady at 60 FPS.
- **Security:** No secrets committed. No web-facing surface — there is no server to attack.

## 7. Spec Workflow

Specs live under `specs/NNN-feature-name/` and follow the [Spec Kit](https://github.com/github/spec-kit) layout:

```
specs/NNN-feature-name/
  spec.md     — what & why; user stories, acceptance criteria, out of scope
  plan.md     — how; architecture, data model, file list
  tasks.md    — numbered, executable implementation tasks with [P] parallel markers
```

Rules:

1. **`spec.md` is implementation-agnostic.** It must not mention React, SQLite, or any other technology. It describes *user-visible behavior*.
2. **`plan.md` is implementation-specific** and references this constitution for stack decisions.
3. **`tasks.md` is executable** — a developer (or agent) can work through it linearly. Tasks marked `[P]` can run in parallel with other `[P]` tasks in the same group.
4. **`NEEDS CLARIFICATION:`** markers in specs block implementation. They must be resolved (and the marker removed) before that feature's `tasks.md` is started.
5. **One feature per spec folder.** Cross-cutting concerns live in this constitution or in a dedicated `specs/000-architecture/` folder.

## 8. Amendments (ADR-style log)

| Date       | Change | Rationale |
|------------|--------|-----------|
| 2026-05-11 | Initial constitution drafted | Reconciles HLD intent (RN+Java) with chosen stack (React+Vite+Capacitor + Node/Express) |
| 2026-05-11 | v2: **Dropped Node/Express server entirely.** App is now pure on-device. | Mystery Choice has no remote data source to talk to and no shared-state needs; jellyfin-monitor's server model doesn't apply. |
| 2026-05-11 | v2: **Replaced paywall with tip-jar model.** Free forever; optional purchase. | Aligns better with impulse-priced indie market; removes piracy concern entirely. |
