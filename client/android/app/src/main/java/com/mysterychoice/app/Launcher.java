package com.mysterychoice.app;

import android.content.ComponentName;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Launcher — starts an installed game's main activity. Implements the
 * three-tier fallback from spec 005:
 *
 *   Tier 1: getLaunchIntentForPackage()
 *   Tier 2: query for an activity with category android.intent.category.GAME
 *   Tier 3: surface an error
 */
@CapacitorPlugin(name = "Launcher")
public class Launcher extends Plugin {

    @PluginMethod
    public void launch(PluginCall call) {
        String packageName = call.getString("packageName");
        if (packageName == null || packageName.isEmpty()) {
            call.resolve(fail("Missing packageName"));
            return;
        }

        PackageManager pm = getContext().getPackageManager();

        // Tier 1: the standard launcher Intent.
        Intent launch = pm.getLaunchIntentForPackage(packageName);
        if (launch != null) {
            launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(launch);
                call.resolve(ok());
                return;
            } catch (Exception e) {
                // fall through to Tier 2
            }
        }

        // Tier 2: explicit CATEGORY_GAME probe.
        Intent probe = new Intent(Intent.ACTION_MAIN);
        probe.addCategory("android.intent.category.GAME");
        probe.setPackage(packageName);
        ResolveInfo r = pm.resolveActivity(probe, 0);
        if (r != null && r.activityInfo != null) {
            Intent fallback = new Intent();
            fallback.setComponent(new ComponentName(packageName, r.activityInfo.name));
            fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            try {
                getContext().startActivity(fallback);
                call.resolve(ok());
                return;
            } catch (Exception e) {
                call.resolve(fail("Failed to start activity: " + e.getMessage()));
                return;
            }
        }

        // Tier 3: nothing launchable.
        call.resolve(fail("No launchable activity for " + packageName));
    }

    private JSObject ok() {
        JSObject o = new JSObject();
        o.put("success", true);
        return o;
    }

    private JSObject fail(String message) {
        JSObject o = new JSObject();
        o.put("success", false);
        o.put("error", message);
        return o;
    }
}
