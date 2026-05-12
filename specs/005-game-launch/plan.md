# 005 — Game launch — Plan

References: [`../../constitution.md`](../../constitution.md), [`../002-game-detection/plan.md`](../002-game-detection/plan.md).

## Capacitor plugin: extend `GameDetector` (or add `Launcher`)

Decision: add a new `Launcher` plugin rather than overloading `GameDetector`. Keeps responsibilities clean and lets us evolve them independently.

`client/android/app/src/main/java/com/mysterychoice/app/Launcher.java`:

```java
@CapacitorPlugin(name = "Launcher")
public class Launcher extends Plugin {
  @PluginMethod
  public void launch(PluginCall call) {
    String packageName = call.getString("packageName");
    // 1. getLaunchIntentForPackage
    // 2. fallback: query CATEGORY_GAME activities
    // 3. fallback: resolve(success=false, error="...")
  }
}
```

### Tier 1: standard launch

```java
Intent i = getContext().getPackageManager().getLaunchIntentForPackage(packageName);
if (i != null) {
  i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
  try { getContext().startActivity(i); call.resolve(ok()); return; }
  catch (Exception e) { /* fall through */ }
}
```

### Tier 2: CATEGORY_GAME

```java
Intent probe = new Intent(Intent.ACTION_MAIN).addCategory("android.intent.category.GAME").setPackage(packageName);
ResolveInfo r = pm.resolveActivity(probe, 0);
if (r != null) {
  Intent i = new Intent().setComponent(new ComponentName(packageName, r.activityInfo.name));
  i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
  startActivity(i);
  call.resolve(ok());
  return;
}
```

### Tier 3: error

```java
call.resolve(fail("Could not find a launchable activity for " + packageName));
```

Helper builders:
```java
private JSObject ok() { JSObject o = new JSObject(); o.put("success", true); return o; }
private JSObject fail(String msg) { JSObject o = new JSObject(); o.put("success", false); o.put("error", msg); return o; }
```

Register in `MainActivity.java`: `registerPlugin(Launcher.class);`.

## React service

`client/src/services/launcher.js`:

```js
import { registerPlugin } from '@capacitor/core';
import { recordLaunch } from './history.js';

const Launcher = registerPlugin('Launcher');

export async function launchGame(game) {
  const { success, error } = await Launcher.launch({ packageName: game.packageName });
  if (success) await recordLaunch(game);
  return { success, error };
}
```

`client/src/services/history.js` (precursor — 006 will flesh this out):

```js
import { getDb } from './database.js';
export async function recordLaunch(game) {
  const db = await getDb();
  await db.run(
    `INSERT INTO launches (package_name, app_name, launched_at_ms) VALUES (?, ?, ?)`,
    [game.packageName, game.appName, Date.now()]
  );
}
```

## DB schema addition

Add to `database.js` schema init:

```sql
CREATE TABLE IF NOT EXISTS launches (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  package_name    TEXT NOT NULL,
  app_name        TEXT NOT NULL,
  launched_at_ms  INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_launches_package_time ON launches(package_name, launched_at_ms);
```

006 will add a richer `spins` table; `launches` is the launch-event log, which is conceptually distinct (a user could launch without spinning, e.g. tap the result twice).

## UI integration

In `ResultCard.jsx` (from 003 T204):

```jsx
const onLaunchClick = async () => {
  setBusy(true);
  const { success, error } = await launchGame(game);
  setBusy(false);
  if (!success) setLaunchError(error);
};
```

Render an inline error banner with "Pick another" CTA when `launchError` is set.

## Risks

- **OEM intercept toasts** (Xiaomi/MIUI especially) — can't suppress; document in HLD §13 risks and live with it.
- **Background-launch restrictions** on Android 10+: the user has to be foreground (which they are — they just tapped Launch). Should be fine.
- **Race against uninstall:** the game detected at scan time may be gone by launch time. The Tier-1 `null` return is the signal — error path handles it.
