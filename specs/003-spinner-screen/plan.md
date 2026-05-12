# 003 — Spinner screen — Plan

References: [`../../constitution.md`](../../constitution.md), [`../002-game-detection/plan.md`](../002-game-detection/plan.md), [`../004-weighted-random-engine/plan.md`](../004-weighted-random-engine/plan.md).

## Component tree

```
<SpinnerScreen>
  <Background />               — full-bleed gradient (Tailwind)
  <SpinnerWheel
    games={visibleGames}
    spinningTo={winnerIndex}
    onSpinComplete={...} />
  <SpinButton
    state="idle" | "spinning" | "result"
    onClick={...} />
  <ResultCard               — shown when state === 'result'
    game={winner}
    onLaunch={...}
    onSpinAgain={...} />
  <EmptyState />            — when eligible.length === 0
  <SingleGameState />       — when eligible.length === 1
</SpinnerScreen>
```

All under `client/src/components/spinner/`.

## Animation

CSS transforms only — no Reanimated equivalent on the web side. The wheel is a `div` with a `transform: rotate(${angle}deg)` driven by `requestAnimationFrame`. The deceleration curve is a quadratic ease-out:

```js
const elapsed = (now - startTime) / durationMs;     // 0..1
const eased = 1 - (1 - elapsed) ** 2;               // ease-out-quad
const angle = startAngle + (targetAngle - startAngle) * eased;
```

`targetAngle` is computed from the winner's index so the pointer lands on that icon — plus 3–5 full rotations for drama:

```js
const slots = visibleGames.length;
const slotAngle = 360 / slots;
const winnerSlot = visibleGames.findIndex(g => g.packageName === winner.packageName);
const targetAngle = (FULL_ROTATIONS * 360) + (winnerSlot * slotAngle);
```

Default `durationMs = 2000`, `FULL_ROTATIONS = 4`. Both live in `client/src/components/spinner/config.js` so 007-settings can override them.

## Visible-game sampling

When `eligibleGames.length > 12`, sample 12 for the wheel — the winner is always one of them, plus 11 others chosen uniformly at random:

```js
function buildVisibleGames(eligible, winner) {
  if (eligible.length <= 12) return eligible;
  const pool = eligible.filter(g => g.packageName !== winner.packageName);
  const sample = shuffle(pool).slice(0, 11);
  return shuffle([winner, ...sample]);
}
```

Sampling matters for visual density only. The *selection* (handled by 004) operates on the full eligible pool.

## Data flow

```
useGames() ──┐
             │
             ▼
       eligibleGames  ──── (excludes/cooldown applied by 008/006 later — for 003, just pass through)
             │
             ▼
       useSpin(eligibleGames)
             │
             ├── pickGame() from 004 (synchronous, returns winner)
             ├── state machine: idle → spinning → result
             └── returns { state, winner, spin(), spinAgain() }
```

A `useSpin` hook (`client/src/hooks/useSpin.js`) wraps the engine call and the state transitions. The component just renders.

## State machine

```
idle ─[spin()]─▶ spinning ─[onAnimationEnd]─▶ result ─[spinAgain()]─▶ spinning
       ▲                                                    │
       └────────────[reset() — e.g. on launch]──────────────┘
```

## Empty / near-empty states

- `eligible.length === 0`: render `<EmptyState />` with copy "No games detected" and a single CTA "Rescan" that calls `rescan()` from 002, plus a secondary link to the permissions explainer.
- `eligible.length === 1`: render `<SingleGameState />` showing the one game and a "Launch <Name>" button (no spin animation).

## Haptics

Use `@capacitor/haptics` (add to deps). One short impact at spin start, one heavier impact at land. Respect a global toggle (`useSettings().hapticEnabled` — settings come from 007; for 003, default to `true`).

## Files to produce

```
client/src/
├── hooks/
│   └── useSpin.js
├── components/spinner/
│   ├── SpinnerScreen.jsx
│   ├── SpinnerWheel.jsx
│   ├── SpinButton.jsx
│   ├── ResultCard.jsx
│   ├── EmptyState.jsx
│   ├── SingleGameState.jsx
│   ├── Background.jsx
│   └── config.js
└── App.jsx                       — set `/` route to <SpinnerScreen />
```

## Risks

- **Sub-60-FPS on low-end devices.** CSS transforms are GPU-accelerated; this should be fine. Watch out for layout thrash if icons are large `<img>` elements — preload and decode them on mount.
- **Animation landing precision.** Floating-point rounding on `targetAngle` can land slightly off-centre. Snap to the nearest slot on `onAnimationEnd`.
