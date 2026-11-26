package com.almawaqeet.mihrab;

import android.Manifest;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.os.Build;
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

    public static void setPendingShortcutRoute(String route) {
        if (route != null && !route.trim().isEmpty()) {
            pendingShortcutRoute = route.trim();
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
        }
        JSObject res = new JSObject();
        res.put("granted", granted);
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
        }

        ComponentName provider = new ComponentName(context, providerClass);
        boolean requested = manager.requestPinAppWidget(provider, null, null);
        res.put("supported", true);
        res.put("requested", requested);
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
}
