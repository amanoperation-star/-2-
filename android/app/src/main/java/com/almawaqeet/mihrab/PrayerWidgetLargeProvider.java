package com.almawaqeet.mihrab;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

public class PrayerWidgetLargeProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        PrayerWidgetHelper.updateWidgetsForProvider(
            context,
            appWidgetManager,
            appWidgetIds,
            R.layout.widget_prayer_large,
            true
        );
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (intent == null || intent.getAction() == null) return;
        if (PrayerWidgetHelper.ACTION_WIDGET_REFRESH.equals(intent.getAction())) {
            PrayerWidgetHelper.updateAllWidgets(context);
        }
    }
}
