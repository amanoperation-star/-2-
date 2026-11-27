package com.almawaqeet.mihrab;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.os.Bundle;

public class PrayerWidgetArchProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        PrayerWidgetHelper.updateArchWidgets(context, appWidgetManager, appWidgetIds);
    }

    @Override
    public void onAppWidgetOptionsChanged(
        Context context,
        AppWidgetManager appWidgetManager,
        int appWidgetId,
        Bundle newOptions
    ) {
        super.onAppWidgetOptionsChanged(context, appWidgetManager, appWidgetId, newOptions);
        PrayerWidgetHelper.updateArchWidgets(context, appWidgetManager, new int[] { appWidgetId });
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || intent.getAction() == null) return;
        String action = intent.getAction();
        if (PrayerWidgetHelper.ACTION_WIDGET_TASBIH_INCREMENT.equals(action)) {
            PrayerWidgetHelper.handleTasbihIncrement(context);
        } else if (PrayerWidgetHelper.ACTION_WIDGET_TOGGLE_QUIET.equals(action)) {
            PrayerWidgetHelper.handleQuietToggle(context);
        } else if (PrayerWidgetHelper.ACTION_WIDGET_NEXT_WISDOM.equals(action)) {
            PrayerWidgetHelper.handleNextWisdom(context);
        } else if (
            PrayerWidgetHelper.ACTION_WIDGET_REFRESH.equals(action)
                || Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
        ) {
            PrayerWidgetHelper.updateAllWidgets(context);
        }
    }
}
