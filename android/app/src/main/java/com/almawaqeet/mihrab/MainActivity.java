package com.almawaqeet.mihrab;

import android.content.Intent;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import java.lang.ref.WeakReference;
import org.json.JSONObject;

public class MainActivity extends BridgeActivity {
    public static volatile boolean isAppInForeground = false;
    private static WeakReference<MainActivity> activeInstance = new WeakReference<>(null);

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);
        PrayerNotificationHelper.ensureChannels(this);
        activeInstance = new WeakReference<>(this);

        handleShortcutIntent(getIntent());

        // Prevent screen timeout on TVs, bedside displays, and active prayer views
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            WebSettings settings = webView.getSettings();
            settings.setMediaPlaybackRequiresUserGesture(false);
            settings.setDomStorageEnabled(true);
            settings.setDatabaseEnabled(true);
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        isAppInForeground = true;
        activeInstance = new WeakReference<>(this);
    }

    @Override
    public void onPause() {
        isAppInForeground = false;
        super.onPause();
    }

    @Override
    public void onDestroy() {
        isAppInForeground = false;
        if (activeInstance.get() == this) {
            activeInstance = new WeakReference<>(null);
        }
        super.onDestroy();
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        if (handleShortcutIntent(intent) && getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.post(() ->
                webView.evaluateJavascript(
                    "window.dispatchEvent(new CustomEvent('mihrabNativeShortcutCheck'));",
                    null
                )
            );
        }
    }

    public static void dispatchForegroundAdhanEvent(String prayerKey, String prayerNameAr) {
        MainActivity activity = activeInstance.get();
        if (activity == null || activity.getBridge() == null || activity.getBridge().getWebView() == null) {
            return;
        }
        try {
            JSONObject detail = new JSONObject();
            detail.put("prayerKey", prayerKey != null ? prayerKey : "dhuhr");
            detail.put("prayerNameAr", prayerNameAr != null ? prayerNameAr : "الظهر");
            final String script =
                "window.dispatchEvent(new CustomEvent('mihrabNativeAdhanTriggered', { detail: "
                    + detail.toString()
                    + " }));";
            WebView webView = activity.getBridge().getWebView();
            webView.post(() -> webView.evaluateJavascript(script, null));
        } catch (Exception ignored) {
            // ignore
        }
    }

    private boolean handleShortcutIntent(Intent intent) {
        if (intent == null) return false;
        boolean found = false;

        String route = intent.getStringExtra("mihrab_shortcut_route");
        if (route != null && !route.trim().isEmpty()) {
            WidgetBridgePlugin.setPendingShortcutRoute(route);
            intent.removeExtra("mihrab_shortcut_route");
            found = true;
        }

        String adhanPrayer = intent.getStringExtra("mihrab_open_adhan_prayer");
        String adhanName = intent.getStringExtra("mihrab_open_adhan_name");
        if (adhanPrayer != null && !adhanPrayer.trim().isEmpty()) {
            WidgetBridgePlugin.setPendingAdhanOpen(adhanPrayer, adhanName);
            intent.removeExtra("mihrab_open_adhan_prayer");
            intent.removeExtra("mihrab_open_adhan_name");
            found = true;
        }

        String periodicId = intent.getStringExtra("mihrab_periodic_reminder_id");
        if (periodicId != null && !periodicId.trim().isEmpty()) {
            WidgetBridgePlugin.setPendingPeriodicReminderId(periodicId);
            intent.removeExtra("mihrab_periodic_reminder_id");
            found = true;
        }

        return found;
    }
}
