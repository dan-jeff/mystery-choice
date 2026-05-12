package com.mysterychoice.app;

import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.BitmapDrawable;
import android.graphics.drawable.Drawable;
import android.os.Build;
import android.util.Base64;

import androidx.annotation.NonNull;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import org.json.JSONException;

import java.io.ByteArrayOutputStream;
import java.util.List;

/**
 * GameDetector — reads PackageManager and returns every installed app that
 * looks like a game, plus everything else (so the JS layer can let the user
 * override). Implements the heuristic from spec 002:
 *
 *   1. ApplicationInfo.category == CATEGORY_GAME (API 26+)
 *   2. ApplicationInfo.flags & FLAG_IS_GAME (deprecated, still set by many)
 *   3. Intent filter declares android.intent.category.GAME
 *
 * Returns base64-encoded launcher icons (capped at ~20 KB each).
 */
@CapacitorPlugin(name = "GameDetector")
public class GameDetector extends Plugin {

    // Primary encode size. Smaller than 144 keeps PNGs comfortably inside the
    // cap for most icons while still being readable at the spinner's 32-unit
    // tile size.
    private static final int ICON_SIZE_PX = 96;
    // If a 96 px PNG exceeds this, we retry at FALLBACK_ICON_SIZE_PX. If
    // that still exceeds it, we drop the icon and the JS layer falls back
    // to initials. 80 KB raw → ~107 KB base64 string. At 100 games that's
    // ~10 MB of SQLite, which is fine.
    private static final int MAX_ICON_BYTES = 80 * 1024;
    private static final int FALLBACK_ICON_SIZE_PX = 64;

    @PluginMethod
    public void getInstalledGames(PluginCall call) {
        PackageManager pm = getContext().getPackageManager();
        JSArray games = new JSArray();
        long scannedAt = System.currentTimeMillis();

        List<PackageInfo> packages = pm.getInstalledPackages(0);

        for (PackageInfo pkg : packages) {
            if (pkg.applicationInfo == null) continue;
            // Skip ourselves so we don't appear in the spinner pool.
            if ("com.mysterychoice.app".equals(pkg.packageName)) continue;
            // Must be user-launchable.
            if (pm.getLaunchIntentForPackage(pkg.packageName) == null) continue;

            JSObject row = new JSObject();
            row.put("packageName", pkg.packageName);
            row.put("appName", pm.getApplicationLabel(pkg.applicationInfo).toString());
            row.put("isGame", classifyAsGame(pm, pkg.applicationInfo));
            row.put("category", mapCategory(pkg.applicationInfo));
            row.put("firstInstallTime", pkg.firstInstallTime);
            row.put("lastUpdateTime", pkg.lastUpdateTime);

            String iconBase64 = loadIconBase64(pm, pkg.applicationInfo);
            if (iconBase64 != null) row.put("iconBase64", iconBase64);

            games.put(row);
        }

        JSObject ret = new JSObject();
        try {
            ret.put("games", games);
            ret.put("scannedAt", scannedAt);
        } catch (Exception e) {
            // JSObject.put rarely throws for primitives; surface as a plugin error.
            call.reject("Failed to assemble result: " + e.getMessage(), e);
            return;
        }
        call.resolve(ret);
    }

    // ---------- heuristic ----------

    private boolean classifyAsGame(PackageManager pm, ApplicationInfo info) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                && info.category == ApplicationInfo.CATEGORY_GAME) {
            return true;
        }
        // FLAG_IS_GAME was deprecated in API 26 but many existing APKs still set it.
        @SuppressWarnings("deprecation")
        int flagsValue = info.flags & ApplicationInfo.FLAG_IS_GAME;
        if (flagsValue != 0) {
            return true;
        }
        return hasGameIntentCategory(pm, info.packageName);
    }

    private boolean hasGameIntentCategory(PackageManager pm, String packageName) {
        Intent probe = new Intent(Intent.ACTION_MAIN);
        probe.addCategory("android.intent.category.GAME");
        probe.setPackage(packageName);
        List<ResolveInfo> matches = pm.queryIntentActivities(probe, 0);
        return matches != null && !matches.isEmpty();
    }

    /**
     * Returns one of the spec's enum strings or null when ApplicationInfo
     * doesn't declare a useful category. The JS keyword heuristic (009)
     * fills in the rest.
     */
    private String mapCategory(ApplicationInfo info) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return null;
        switch (info.category) {
            case ApplicationInfo.CATEGORY_GAME:        return null; // generic — let JS keyword infer
            // The specific game sub-categories were added in API 26 but use the
            // same CATEGORY_GAME for them all on older targets. We could map
            // additional Android Q+ categories here, but Android does not
            // currently expose game sub-categories at the ApplicationInfo level.
            default:                                    return null;
        }
    }

    // ---------- icon encoding ----------

    private String loadIconBase64(PackageManager pm, ApplicationInfo info) {
        try {
            Drawable d = pm.getApplicationIcon(info);

            byte[] png = encodePng(drawableToBitmap(d, ICON_SIZE_PX));
            if (png != null && png.length <= MAX_ICON_BYTES) {
                return Base64.encodeToString(png, Base64.NO_WRAP);
            }

            // Big / complex icons (gradient-heavy adaptive icons especially)
            // can still exceed the cap at 96 px. Retry smaller before giving up.
            png = encodePng(drawableToBitmap(d, FALLBACK_ICON_SIZE_PX));
            if (png != null && png.length <= MAX_ICON_BYTES) {
                return Base64.encodeToString(png, Base64.NO_WRAP);
            }

            return null;
        } catch (Throwable t) {
            return null;
        }
    }

    private Bitmap drawableToBitmap(@NonNull Drawable d, int size) {
        if (d instanceof BitmapDrawable && ((BitmapDrawable) d).getBitmap() != null) {
            return Bitmap.createScaledBitmap(((BitmapDrawable) d).getBitmap(), size, size, true);
        }
        Bitmap bm = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(bm);
        d.setBounds(0, 0, size, size);
        d.draw(c);
        return bm;
    }

    private byte[] encodePng(Bitmap bm) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        if (!bm.compress(Bitmap.CompressFormat.PNG, 100, out)) return null;
        return out.toByteArray();
    }
}
