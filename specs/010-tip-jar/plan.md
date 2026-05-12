# 010 — Tip jar — Plan

References: HLD §8, [`../../constitution.md`](../../constitution.md).

## Decision log

| Decision | Choice |
|----------|--------|
| Trial structure | Unlimited free; tip jar only |
| Billing library | `@capgo/capacitor-purchases` |
| Server-side verification | None — pure on-device |
| Product type | One-time Managed product |
| Price | £0.40 / $0.50 / €0.45 (regional) |

## Native side

Add `@capgo/capacitor-purchases` to `client/package.json`. Follow its Android setup: configure the product ID in Google Play Console, ensure the billing library is on the Android classpath (plugin auto-adds in current versions).

Product configuration in Play Console:
- ID: `com.mysterychoice.app.support`
- Type: Managed product (one-time)
- Price: £0.40 base, regional pricing for US / EU per HLD §8.1.

## React layer

`client/src/services/tip-jar.js`:

```js
import { registerPlugin } from '@capacitor/core';
import { getSetting, setSetting } from './settings.js';

const Purchases = registerPlugin('Purchases');
const PRODUCT_ID = 'com.mysterychoice.app.support';
const CACHE_KEY = 'tip_jar_state_v1';

export async function getSupporterState() {
  // Read cached state first for offline render
  return (await getSetting(CACHE_KEY)) ?? { supporter: false };
}

export async function refresh() {
  try {
    const { purchases } = await Purchases.getPurchases();
    const owned = purchases.some(p => p.productId === PRODUCT_ID);
    const state = { supporter: owned, checkedAt: Date.now() };
    await setSetting(CACHE_KEY, state);
    return state;
  } catch (e) {
    return getSupporterState(); // network/Play error → trust the cache
  }
}

export async function support() {
  const r = await Purchases.purchase({ productId: PRODUCT_ID });
  if (r.success) return refresh();
  return getSupporterState();
}

export async function restore() {
  await Purchases.restorePurchases();
  return refresh();
}
```

Cache shape:
```json
{ "supporter": true, "checkedAt": 1715520000000 }
```

No expiry. The cache is for offline render; we never *demote* a supporter offline. The next online refresh corrects any drift.

## Hook

`client/src/hooks/useTipJar.js`:

```js
export function useTipJar() {
  const qc = useQueryClient();
  const { data } = useQuery({
    queryKey: ['tip-jar'],
    queryFn: getSupporterState,
    initialData: { supporter: false },
  });

  useEffect(() => {
    // refresh from Play on mount; ignore errors
    refresh().then(d => qc.setQueryData(['tip-jar'], d));
  }, []);

  return {
    isSupporter: data.supporter,
    support: () => support().then(d => qc.setQueryData(['tip-jar'], d)),
    restore: () => restore().then(d => qc.setQueryData(['tip-jar'], d)),
  };
}
```

## UI

```
client/src/components/tip-jar/
├── TipJarEntry.jsx           — row inside Settings → About
├── ThanksForSupporting.jsx   — one-shot modal after successful purchase
└── SupporterBadge.jsx        — small chip on SpinnerScreen header
```

### `TipJarEntry` behaviour

- Not supporter → row reads "Support development — £0.40" with a buy CTA. Tapping invokes `support()`.
- Supporter → row reads "Already supporting — thanks!" with a subtle ❤ icon. No CTA.
- Below the row: a "Restore purchase" text link (always visible — needed for cross-device reinstalls even when not currently a supporter).

### `ThanksForSupporting`

Shown once, ever. We track "already shown" via the `settings` table key `tip_jar_thanks_shown_v1`. Triggered by a successful `support()` resolve where the previous state was not supporter.

### `SupporterBadge`

Subtle chip in the top-right of `SpinnerScreen`, only when `isSupporter === true`. Theme-aware. Tap → goes to `Settings → About`.

## Wiring into 007 Settings

Add `<TipJarEntry />` to `About.jsx` (007 T633). 007's tasks need to include this — add a follow-up note here.

## Risks

- **Play Console setup** is a manual prerequisite (developer account, app entry, product, license testers). Documented in tasks.md as manual checklist.
- **Plugin lifecycle.** `@capgo/capacitor-purchases` connects to Google Play asynchronously on Android — the first `getPurchases()` after a cold start may take a beat. The `useTipJar` hook handles this by returning cached state immediately and refreshing in the background.
- **Refund / revoked purchases.** If Google refunds a purchase later, `getPurchases()` will no longer include it. The next `refresh()` will demote the user silently. Acceptable behaviour for a tip jar.
