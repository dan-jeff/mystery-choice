# 010 — Tip jar

**Status:** Draft
**Phase:** V1.0
**Depends on:** 001-foundation

## Goal

Let users who enjoy the app optionally pay a one-time "Support development" amount via Google Play Billing. The app remains fully functional whether or not they buy.

## Why

The constitution (§1.2) commits to a free-forever, tip-jar model: no paywalls, no ads, no subscriptions. The tip jar gives motivated users a single, friction-free way to express thanks and modestly fund development.

## User stories

- **As a user**, the entire app works without ever encountering a paywall.
- **As a user**, I can find a "Support development" entry in Settings; tapping it opens Play Billing and lets me pay a small fixed amount.
- **As a user**, after paying I see a thank-you message; the home screen optionally shows a small "Supporter" badge.
- **As a user**, my support status persists across restarts and on a fresh install with the same Play account.
- **As a user**, if I never pay, nothing in the app shames, nags, or interrupts me.

## Scope

In scope:

- One Google Play in-app product: `com.mysterychoice.app.support` (Managed product, one-time, regional pricing per HLD §8.1: £0.40 / $0.50 / €0.45).
- Capacitor integration via `@capgo/capacitor-purchases`.
- "Support development" entry in `Settings → About`.
- Thank-you modal on first successful purchase.
- Optional "Supporter" badge on the spinner screen (subtle — small chip, theme-aware).
- "Restore purchase" button for users who reinstall.
- On-device purchase-state cache so the badge survives offline launches.

Out of scope:

- Multiple tiers, recurring tips, custom amounts. One product, one price.
- Promo codes, gifting, referral bonuses.
- Any feature gating — the constitution forbids paywalls. Paying does NOT unlock features.
- Server-side verification — constitution mandates no backend.
- iOS / App Store.

## Acceptance criteria

1. A brand-new install with no purchase history can spin, launch, and use every feature with no prompt to buy.
2. Tapping "Support development" in Settings opens the Play Billing sheet for `com.mysterychoice.app.support`.
3. On successful purchase, a thank-you modal appears once; the "Supporter" badge appears on the spinner screen.
4. Force-stopping and reopening the app preserves the badge / supporter state.
5. Fresh install on the same Play account: "Restore purchase" reinstates the supporter state within 5 seconds online.
6. With no network and a previously-purchased install, the cached supporter state continues to apply (no re-prompt, no badge disappearing).
7. The Settings entry shows a friendly "Already supporting — thanks!" state once purchased, not the buy button.

## Non-goals (explicit)

- **No nags.** The app must not prompt the user to consider supporting at any point unprompted. The only place the tip jar appears is in `Settings → About`.
- **No piracy concerns.** There is nothing to pirate. A modified APK that reports `supporter=true` to itself harms no one.

## Open questions / NEEDS CLARIFICATION

All resolved in question round 8:

- Trial structure: **unlimited free with optional tip jar** (no spin counter, no gate).
- Billing library: **`@capgo/capacitor-purchases`**.
- Piracy defence: **none required** (tip jar means nothing to protect).
