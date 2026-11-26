package com.almawaqeet.mihrab;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

public class PrayerWidgetSmallProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        PrayerWidgetHelper.updateWidgetsForProvider(
            context,
            appWidgetManager,
            appWidgetIds,
            R.layout.widget_prayer_small,
            false
        );
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        if (PrayerNotificationHelper.ACTION_ADHAN_TRANSITION.equals(action)) {
            PrayerNotificationHelper.handleTransitionAlarm(context, intent);
        } else if (
            PrayerWidgetHelper.ACTION_WIDGET_REFRESH.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
        ) {
            PrayerWidgetHelper.updateAllWidgets(context);
            PrayerNotificationHelper.refreshOngoingNotification(context);
        }
    }
}
