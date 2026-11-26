package com.almawaqeet.mihrab;

import android.content.Intent;
import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(WidgetBridgePlugin.class);
        super.onCreate(savedInstanceState);

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

    private boolean handleShortcutIntent(Intent intent) {
        if (intent == null) return false;
        String route = intent.getStringExtra("mihrab_shortcut_route");
        if (route != null && !route.trim().isEmpty()) {
            WidgetBridgePlugin.setPendingShortcutRoute(route);
            intent.removeExtra("mihrab_shortcut_route");
            return true;
        }
        return false;
    }
}
