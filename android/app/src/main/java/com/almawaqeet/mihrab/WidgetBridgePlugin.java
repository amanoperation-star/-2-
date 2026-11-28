package com.almawaqeet.mihrab;

import android.Manifest;
import android.app.NotificationManager;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.PowerManager;
import android.provider.Settings;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "WidgetBridge",
    permissions = {
        @Permission(
            strings = { Manifest.permission.POST_NOTIFICATIONS },
            alias = "notifications"
        )
    }
)
public class WidgetBridgePlugin extends Plugin {
    private static volatile String pendingShortcutRoute = null;
    private static volatile String pendingAdhanPrayerKey = null;
    private static volatile String pendingAdhanPrayerName = null;
    private static volatile String pendingPeriodicReminderId = null;

    public static void setPendingShortcutRoute(String route) {
        if (route != null && !route.trim().isEmpty()) {
            pendingShortcutRoute = route.trim();
        }
    }

    public static void setPendingAdhanOpen(String prayerKey, String prayerNameAr) {
        if (prayerKey != null && !prayerKey.trim().isEmpty()) {
            pendingAdhanPrayerKey = prayerKey.trim();
            pendingAdhanPrayerName = prayerNameAr != null ? prayerNameAr.trim() : null;
        }
    }

    public static void setPendingPeriodicReminderId(String reminderId) {
        if (reminderId != null && !reminderId.trim().isEmpty()) {
            pendingPeriodicReminderId = reminderId.trim();
        }
    }

    @PluginMethod
    public void syncWidgetData(PluginCall call) {
        String payload = call.getString("payload");
        if (payload == null || payload.isEmpty()) {
            call.reject("Missing widget payload");
            return;
        }
        Context context = getContext();
        PrayerWidgetHelper.savePayload(context, payload);
        PrayerWidgetHelper.updateAllWidgets(context);
        PrayerNotificationHelper.refreshOngoingNotification(context);
        BackgroundReminderScheduler.scheduleAll(context);

        JSObject res = new JSObject();
        res.put("synced", true);
        res.put("activeCount", PrayerWidgetHelper.getActiveWidgetCount(context));
        res.put(
            "notificationsGranted",
            PrayerNotificationHelper.hasNotificationPermission(context)
        );
        call.resolve(res);
    }

    @PluginMethod
    public void getNotificationPermissionStatus(PluginCall call) {
        Context context = getContext();
        boolean granted = PrayerNotificationHelper.hasNotificationPermission(context);
        JSObject res = new JSObject();
        res.put("granted", granted);
        res.put("requiresPrompt", Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && !granted);
        call.resolve(res);
    }

    @PluginMethod
    public void requestNotificationPermission(PluginCall call) {
        Context context = getContext();
        if (
            Build.VERSION.SDK_INT < Build.VERSION_CODES.TIRAMISU
                || getPermissionState("notifications") == PermissionState.GRANTED
        ) {
            PrayerNotificationHelper.refreshOngoingNotification(context);
            BackgroundReminderScheduler.scheduleAll(context);
            JSObject res = new JSObject();
            res.put("granted", PrayerNotificationHelper.hasNotificationPermission(context));
            call.resolve(res);
            return;
        }
        requestPermissionForAlias("notifications", call, "notificationsPermissionCallback");
    }

    @PermissionCallback
    private void notificationsPermissionCallback(PluginCall call) {
        Context context = getContext();
        boolean granted = PrayerNotificationHelper.hasNotificationPermission(context);
        if (granted) {
            PrayerNotificationHelper.refreshOngoingNotification(context);
            BackgroundReminderScheduler.scheduleAll(context);
        }
        JSObject res = new JSObject();
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void getBackgroundReliabilityStatus(PluginCall call) {
        Context context = getContext();
        boolean notificationsGranted = PrayerNotificationHelper.hasNotificationPermission(context);
        boolean exactAlarmsGranted = BackgroundReminderScheduler.canScheduleExactAlarms(context);
        boolean fullScreenIntentGranted = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            fullScreenIntentGranted = nm == null || nm.canUseFullScreenIntent();
        }
        boolean batteryIgnored = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            batteryIgnored = pm == null || pm.isIgnoringBatteryOptimizations(context.getPackageName());
        }
        boolean overlayGranted = canDrawOverlays(context);

        JSObject res = new JSObject();
        res.put("notificationsGranted", notificationsGranted);
        res.put("exactAlarmsGranted", exactAlarmsGranted);
        res.put("fullScreenIntentGranted", fullScreenIntentGranted);
        res.put("batteryOptimizationIgnored", batteryIgnored);
        res.put("overlayGranted", overlayGranted);
        res.put("sdkInt", Build.VERSION.SDK_INT);
        call.resolve(res);
    }

    public static boolean canDrawOverlays(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) return true;
        return Settings.canDrawOverlays(context);
    }

    @PluginMethod
    public void requestExactAlarmPermission(PluginCall call) {
        Context context = getContext();
        boolean granted = BackgroundReminderScheduler.canScheduleExactAlarms(context);
        boolean opened = false;
        if (!granted && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            try {
                Intent intent = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM);
                intent.setData(Uri.parse("package:" + context.getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                opened = true;
            } catch (Exception ignored) {
                opened = false;
            }
        }
        JSObject res = new JSObject();
        res.put("opened", opened);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void requestFullScreenIntentPermission(PluginCall call) {
        Context context = getContext();
        boolean granted = true;
        boolean opened = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
            NotificationManager nm =
                (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
            granted = nm == null || nm.canUseFullScreenIntent();
            if (!granted) {
                try {
                    Intent intent = new Intent(Settings.ACTION_MANAGE_APP_USE_FULL_SCREEN_INTENT);
                    intent.setData(Uri.parse("package:" + context.getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    opened = true;
                } catch (Exception ignored) {
                    opened = false;
                }
            }
        }
        JSObject res = new JSObject();
        res.put("opened", opened);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void requestIgnoreBatteryOptimizations(PluginCall call) {
        Context context = getContext();
        boolean ignored = true;
        boolean opened = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            ignored = pm == null || pm.isIgnoringBatteryOptimizations(context.getPackageName());
            if (!ignored) {
                try {
                    Intent intent = new Intent(Settings.ACTION_REQUEST_IGNORE_BATTERY_OPTIMIZATIONS);
                    intent.setData(Uri.parse("package:" + context.getPackageName()));
                    intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(intent);
                    opened = true;
                } catch (Exception e) {
                    try {
                        Intent fallback = new Intent(Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS);
                        fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                        context.startActivity(fallback);
                        opened = true;
                    } catch (Exception ignoredEx) {
                        opened = false;
                    }
                }
            }
        }
        JSObject res = new JSObject();
        res.put("opened", opened);
        res.put("ignored", ignored);
        call.resolve(res);
    }

    @PluginMethod
    public void requestOverlayPermission(PluginCall call) {
        Context context = getContext();
        boolean granted = canDrawOverlays(context);
        boolean opened = false;
        if (!granted && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            try {
                Intent intent = new Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:" + context.getPackageName())
                );
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(intent);
                opened = true;
            } catch (Exception e) {
                try {
                    Intent fallback = new Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION);
                    fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                    context.startActivity(fallback);
                    opened = true;
                } catch (Exception ignoredEx) {
                    opened = false;
                }
            }
        }
        JSObject res = new JSObject();
        res.put("opened", opened);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void openAppDetailsSettings(PluginCall call) {
        Context context = getContext();
        boolean opened = false;
        try {
            Intent intent = new Intent(
                Settings.ACTION_APPLICATION_DETAILS_SETTINGS,
                Uri.parse("package:" + context.getPackageName())
            );
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            context.startActivity(intent);
            opened = true;
        } catch (Exception ignored) {
            try {
                Intent fallback = new Intent(Settings.ACTION_MANAGE_APPLICATIONS_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                context.startActivity(fallback);
                opened = true;
            } catch (Exception ignoredEx) {
                opened = false;
            }
        }
        JSObject res = new JSObject();
        res.put("opened", opened);
        call.resolve(res);
    }

    @PluginMethod
    public void testBackgroundAlarmNow(PluginCall call) {
        Context context = getContext();
        String type = call.getString("type", "salawat");
        BackgroundAlarmReceiver.triggerTestFromUi(context, type);
        JSObject res = new JSObject();
        res.put("triggered", true);
        call.resolve(res);
    }

    @PluginMethod
    public void showTestPrayerNotification(PluginCall call) {
        Context context = getContext();
        String mosqueTheme = call.getString("mosqueTheme", "auto");
        PrayerNotificationHelper.showTestNotificationNow(context, mosqueTheme);

        JSObject res = new JSObject();
        res.put("shown", PrayerNotificationHelper.hasNotificationPermission(context));
        res.put("granted", PrayerNotificationHelper.hasNotificationPermission(context));
        call.resolve(res);
    }

    @PluginMethod
    public void showSalawatNotificationNow(PluginCall call) {
        Context context = getContext();
        String sheikhNameAr = call.getString("sheikhNameAr", "");
        String formulaAr = call.getString("formulaAr", "");
        PrayerNotificationHelper.showSalawatNotification(context, sheikhNameAr, formulaAr);

        boolean granted = PrayerNotificationHelper.hasNotificationPermission(context);
        JSObject res = new JSObject();
        res.put("shown", granted);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void showPreAdhanNotificationNow(PluginCall call) {
        Context context = getContext();
        String prayerNameAr = call.getString("prayerNameAr", "الصلاة");
        int reminderMinutes = call.getInt("reminderMinutes", 10);
        String cityNameAr = call.getString("cityNameAr", "مواقيت الصلاة");
        String sheikhNameAr = call.getString("sheikhNameAr", "");
        PrayerNotificationHelper.showPreAdhanNotification(
            context,
            prayerNameAr,
            reminderMinutes,
            cityNameAr,
            sheikhNameAr
        );

        boolean granted = PrayerNotificationHelper.hasNotificationPermission(context);
        JSObject res = new JSObject();
        res.put("shown", granted);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void showLastThirdNotificationNow(PluginCall call) {
        Context context = getContext();
        String verseText = call.getString("verseText", "");
        String surah = call.getString("surah", "");
        String reciterNameAr = call.getString("reciterNameAr", "");
        String fajrTime12 = call.getString("fajrTime12", "");
        PrayerNotificationHelper.showLastThirdNotification(
            context,
            verseText,
            surah,
            reciterNameAr,
            fajrTime12
        );

        boolean granted = PrayerNotificationHelper.hasNotificationPermission(context);
        JSObject res = new JSObject();
        res.put("shown", granted);
        res.put("granted", granted);
        call.resolve(res);
    }

    @PluginMethod
    public void requestPinWidget(PluginCall call) {
        String size = call.getString("size", "medium");
        Context context = getContext();

        JSObject res = new JSObject();
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            res.put("supported", false);
            res.put("requested", false);
            call.resolve(res);
            return;
        }

        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null || !manager.isRequestPinAppWidgetSupported()) {
            res.put("supported", false);
            res.put("requested", false);
            call.resolve(res);
            return;
        }

        Class<?> providerClass = PrayerWidgetMediumProvider.class;
        if ("small".equals(size) || "lock_pill".equals(size)) {
            providerClass = PrayerWidgetSmallProvider.class;
        } else if ("large".equals(size)) {
            providerClass = PrayerWidgetLargeProvider.class;
        } else if ("arch".equals(size) || "spiritual_card".equals(size)) {
            providerClass = PrayerWidgetArchProvider.class;
        }

        ComponentName provider = new ComponentName(context, providerClass);
        boolean requested = manager.requestPinAppWidget(provider, null, null);
        res.put("supported", true);
        res.put("requested", requested);
        call.resolve(res);
    }

    @PluginMethod
    public void getNativeInteractiveState(PluginCall call) {
        Context context = getContext();
        android.content.SharedPreferences prefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        JSObject res = new JSObject();
        res.put("tasbihDateKey", prefs.getString(PrayerWidgetHelper.KEY_TASBIH_DATE, ""));
        res.put("tasbihCount", Math.max(0, prefs.getInt(PrayerWidgetHelper.KEY_TASBIH_COUNT, 0)));
        res.put("tasbihUpdatedAtMs", prefs.getLong(PrayerWidgetHelper.KEY_TASBIH_UPDATED_MS, 0L));
        res.put(
            "quietOverrideSet",
            prefs.getBoolean(PrayerWidgetHelper.KEY_QUIET_OVERRIDE_SET, false)
        );
        res.put(
            "quietOverrideActive",
            prefs.getBoolean(PrayerWidgetHelper.KEY_QUIET_OVERRIDE_ACTIVE, false)
        );
        res.put("quietUpdatedAtMs", prefs.getLong(PrayerWidgetHelper.KEY_QUIET_UPDATED_MS, 0L));
        call.resolve(res);
    }

    @PluginMethod
    public void getWidgetStatus(PluginCall call) {
        Context context = getContext();
        boolean pinSupported = false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            AppWidgetManager manager = AppWidgetManager.getInstance(context);
            pinSupported = manager != null && manager.isRequestPinAppWidgetSupported();
        }

        JSObject res = new JSObject();
        res.put("isSupported", true);
        res.put("pinSupported", pinSupported);
        res.put("activeCount", PrayerWidgetHelper.getActiveWidgetCount(context));
        call.resolve(res);
    }

    @PluginMethod
    public void consumeLaunchShortcut(PluginCall call) {
        String route = pendingShortcutRoute;
        pendingShortcutRoute = null;

        JSObject res = new JSObject();
        res.put("route", route);
        call.resolve(res);
    }

    @PluginMethod
    public void consumeLaunchAction(PluginCall call) {
        JSObject res = new JSObject();
        res.put("route", pendingShortcutRoute);
        res.put("adhanPrayerKey", pendingAdhanPrayerKey);
        res.put("adhanPrayerName", pendingAdhanPrayerName);
        res.put("periodicReminderId", pendingPeriodicReminderId);
        pendingShortcutRoute = null;
        pendingAdhanPrayerKey = null;
        pendingAdhanPrayerName = null;
        pendingPeriodicReminderId = null;
        call.resolve(res);
    }
}
