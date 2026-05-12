# 010 — Tip jar — Tasks

## Group A — Play Console (manual prerequisite)

- [ ] **T900** Create a Google Play developer account (one-time $25). *Manual.*
- [ ] **T901** Create the app entry in Play Console with package name `com.mysterychoice.app`. *Manual.*
- [ ] **T902** Create the in-app product `com.mysterychoice.app.support` (Managed product, one-time, regional pricing per HLD §8.1). *Manual.*
- [ ] **T903** Add 2–3 license testers (own Gmail accounts) to the Play Console. *Manual.*

## Group B — Client billing service

- [ ] **T910** Add `@capgo/capacitor-purchases` to `client/package.json`. Configure per its README (any required Gradle additions auto-applied; verify by building).
- [ ] **T911** Register `Purchases` in `client/src/services/capacitor-plugins.js`.
- [ ] **T912** Create `client/src/services/tip-jar.js` per [plan §React layer]: `getSupporterState`, `refresh`, `support`, `restore`. Cached via the `settings` table key `tip_jar_state_v1` using `settings.js` helpers.
- [ ] **T913** Create `client/src/hooks/useTipJar.js` per [plan §Hook].
- [ ] **T914** Unit-test `tip-jar.js`: cached read short-circuits offline; `refresh` updates cache; failure falls back to cache.

## Group C — UI

- [ ] **T920** Create `client/src/components/tip-jar/TipJarEntry.jsx` per [plan §UI / TipJarEntry behaviour]. Two states (buy CTA vs "already supporting"); always-visible "Restore purchase" text link.
- [ ] **T921** Create `client/src/components/tip-jar/ThanksForSupporting.jsx` — one-shot modal. Track "shown" via the `settings` table key `tip_jar_thanks_shown_v1`.
- [ ] **T922** Create `client/src/components/tip-jar/SupporterBadge.jsx` — small chip; tap → `/settings/about`.
- [ ] **T923** Wire `<SupporterBadge />` into `SpinnerScreen` header (003), conditionally rendered on `useTipJar().isSupporter`.

## Group D — Integrate with Settings (007)

- [ ] **T930** Add `<TipJarEntry />` into `About.jsx` (007 T633). Add a follow-up checklist item in 007's tasks.md referencing this T930.

## Group E — Verification

- [ ] **T940** End-to-end test with a license tester account:
  - Fresh install → all features work without prompt. AC #1.
  - Tap "Support development" → Play sheet appears → buy → thank-you modal → badge appears. AC #2, #3.
  - Force-stop + reopen → badge still there. AC #4.
  - Uninstall + reinstall (same Play account) → no badge initially → tap "Restore purchase" → badge returns. AC #5.
  - Airplane mode + previously supporter → badge persists. AC #6.
  - Re-open Settings → entry shows "Already supporting — thanks!". AC #7.
- [ ] **T941** Manual: confirm no nag, no prompt, no banner anywhere else in the app.

## Done when

- All AC pass.
- Play Console manual checklist done.
- No code path in the codebase displays the tip jar outside of `Settings → About` (and the optional supporter badge for users who already paid).
