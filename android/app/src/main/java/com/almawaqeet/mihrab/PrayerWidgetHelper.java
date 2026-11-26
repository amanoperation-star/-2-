package com.almawaqeet.mihrab;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Color;
import android.os.Build;
import android.os.SystemClock;
import android.view.View;
import android.widget.RemoteViews;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public final class PrayerWidgetHelper {
    public static final String PREFS_NAME = "mihrab_widget_prefs";
    public static final String KEY_PAYLOAD_JSON = "widget_payload_json";
    public static final String ACTION_WIDGET_REFRESH = "com.almawaqeet.mihrab.ACTION_WIDGET_REFRESH";

    private static final int REQUEST_CODE_LAUNCH_APP = 4101;
    private static final int REQUEST_CODE_ALARM_REFRESH = 4102;

    private PrayerWidgetHelper() {}

    public static void savePayload(Context context, String jsonPayload) {
        if (context == null || jsonPayload == null || jsonPayload.isEmpty()) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        prefs.edit().putString(KEY_PAYLOAD_JSON, jsonPayload).apply();
    }

    public static int getActiveWidgetCount(Context context) {
        if (context == null) return 0;
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null) return 0;
        int total = 0;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetSmallProvider.class)).length;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetMediumProvider.class)).length;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetLargeProvider.class)).length;
        return total;
    }

    public static void updateAllWidgets(Context context) {
        if (context == null) return;
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null) return;

        int[] smallIds = manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetSmallProvider.class));
        if (smallIds.length > 0) {
            updateWidgets(context, manager, smallIds, R.layout.widget_prayer_small, false);
        }

        int[] mediumIds = manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetMediumProvider.class));
        if (mediumIds.length > 0) {
            updateWidgets(context, manager, mediumIds, R.layout.widget_prayer_medium, false);
        }

        int[] largeIds = manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetLargeProvider.class));
        if (largeIds.length > 0) {
            updateWidgets(context, manager, largeIds, R.layout.widget_prayer_large, true);
        }

        if (smallIds.length + mediumIds.length + largeIds.length == 0) {
            cancelScheduledRefresh(context);
        }
    }

    public static void updateWidgetsForProvider(
        Context context,
        AppWidgetManager manager,
        int[] appWidgetIds,
        int layoutResId,
        boolean isLarge
    ) {
        if (context == null || manager == null || appWidgetIds == null || appWidgetIds.length == 0) return;
        updateWidgets(context, manager, appWidgetIds, layoutResId, isLarge);
    }

    private static void updateWidgets(
        Context context,
        AppWidgetManager manager,
        int[] appWidgetIds,
        int layoutResId,
        boolean isLarge
    ) {
        WidgetDisplayModel model = buildDisplayModel(context);

        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), layoutResId);
            bindCommonViews(context, views, model);
            if (isLarge) {
                bindLargeTable(views, model);
            }
            manager.updateAppWidget(widgetId, views);
        }

        if (model.nextTriggerEpochMs > System.currentTimeMillis() && getActiveWidgetCount(context) > 0) {
            scheduleNextRefresh(context, model.nextTriggerEpochMs + 1500L);
        }
    }

    private static void bindCommonViews(Context context, RemoteViews views, WidgetDisplayModel model) {
        int bgRes = R.drawable.widget_bg_emerald;
        if ("glass".equals(model.theme)) {
            bgRes = R.drawable.widget_bg_glass;
        } else if ("oled".equals(model.theme)) {
            bgRes = R.drawable.widget_bg_oled;
        }
        views.setInt(R.id.widget_root, "setBackgroundResource", bgRes);

        views.setTextViewText(R.id.widget_city, model.cityNameAr);
        views.setTextViewText(R.id.widget_next_label, model.nextLabelAr);
        views.setTextViewText(R.id.widget_next_name, model.nextPrayerNameAr);
        views.setTextViewText(R.id.widget_next_time, model.nextPrayerTime12);

        if (model.showHijriDate && model.hijriDate != null && !model.hijriDate.isEmpty()) {
            views.setViewVisibility(R.id.widget_hijri, View.VISIBLE);
            views.setTextViewText(R.id.widget_hijri, model.hijriDate);
        } else {
            views.setViewVisibility(R.id.widget_hijri, View.GONE);
        }

        if (model.hasSchedule && model.nextTriggerEpochMs > 0L) {
            long remainingMs = Math.max(0L, model.nextTriggerEpochMs - System.currentTimeMillis());
            long baseElapsed = SystemClock.elapsedRealtime() + remainingMs;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                views.setChronometerCountDown(R.id.widget_countdown, true);
            }
            views.setChronometer(R.id.widget_countdown, baseElapsed, null, true);
        } else {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                views.setChronometerCountDown(R.id.widget_countdown, false);
            }
            views.setChronometer(R.id.widget_countdown, SystemClock.elapsedRealtime(), "--:--", false);
        }

        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_VIEW);
        launchIntent.putExtra("mihrab_shortcut_route", "times");
        launchIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        PendingIntent pendingIntent = PendingIntent.getActivity(
            context,
            REQUEST_CODE_LAUNCH_APP,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(R.id.widget_root, pendingIntent);
    }

    private static void bindLargeTable(RemoteViews views, WidgetDisplayModel model) {
        String[] keys = new String[] { "fajr", "dhuhr", "asr", "maghrib", "isha" };
        int[] rowIds = new int[] {
            R.id.row_fajr, R.id.row_dhuhr, R.id.row_asr, R.id.row_maghrib, R.id.row_isha
        };
        int[] labelIds = new int[] {
            R.id.label_fajr, R.id.label_dhuhr, R.id.label_asr, R.id.label_maghrib, R.id.label_isha
        };
        int[] timeIds = new int[] {
            R.id.time_fajr, R.id.time_dhuhr, R.id.time_asr, R.id.time_maghrib, R.id.time_isha
        };

        for (int i = 0; i < keys.length; i++) {
            String key = keys[i];
            boolean isNext = key.equals(model.nextPrayerKey);
            views.setTextViewText(labelIds[i], model.dailyLabels[i]);
            views.setTextViewText(timeIds[i], model.dailyTimes12[i]);

            if (isNext) {
                views.setInt(rowIds[i], "setBackgroundResource", R.drawable.widget_pill_next);
                views.setTextColor(labelIds[i], Color.parseColor("#F3CA63"));
                views.setTextColor(timeIds[i], Color.parseColor("#10B981"));
            } else {
                views.setInt(rowIds[i], "setBackgroundResource", 0);
                views.setTextColor(labelIds[i], Color.parseColor("#E2E8F0"));
                views.setTextColor(timeIds[i], Color.parseColor("#CBD5E1"));
            }
        }
    }

    private static void scheduleNextRefresh(Context context, long triggerAtEpochMs) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, PrayerWidgetSmallProvider.class);
            intent.setAction(ACTION_WIDGET_REFRESH);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE_ALARM_REFRESH,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtEpochMs, pi);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAtEpochMs, pi);
            }
        } catch (Exception ignored) {
            // Never crash if exact alarm or background restriction applies
        }
    }

    private static void cancelScheduledRefresh(Context context) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;
            Intent intent = new Intent(context, PrayerWidgetSmallProvider.class);
            intent.setAction(ACTION_WIDGET_REFRESH);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE_ALARM_REFRESH,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            alarmManager.cancel(pi);
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static WidgetDisplayModel buildDisplayModel(Context context) {
        WidgetDisplayModel model = new WidgetDisplayModel();
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String rawJson = prefs.getString(KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) {
            return model;
        }

        try {
            JSONObject root = new JSONObject(rawJson);
            model.cityNameAr = root.optString("cityNameAr", "مواقيت الصلاة");
            String todayHijri = root.optString("hijriDate", "");
            String tomorrowHijri = root.optString("tomorrowHijriDate", todayHijri);

            JSONObject settings = root.optJSONObject("widgetSettings");
            if (settings != null) {
                model.theme = settings.optString("theme", "emerald");
                model.showHijriDate = settings.optBoolean("showHijriDate", true);
            }

            long nowMs = System.currentTimeMillis();
            String nowDateKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(nowMs));
            String todayDateKey = root.optString("todayDateKey", "");
            String tomorrowDateKey = root.optString("tomorrowDateKey", "");

            JSONArray todaySchedule = root.optJSONArray("todaySchedule");
            JSONArray tomorrowSchedule = root.optJSONArray("tomorrowSchedule");

            JSONArray activeDaySchedule = todaySchedule;
            JSONArray nextDaySchedule = tomorrowSchedule != null ? tomorrowSchedule : todaySchedule;
            model.hijriDate = todayHijri;

            if (!tomorrowDateKey.isEmpty() && tomorrowDateKey.equals(nowDateKey) && tomorrowSchedule != null) {
                activeDaySchedule = tomorrowSchedule;
                nextDaySchedule = tomorrowSchedule;
                model.hijriDate = tomorrowHijri;
            } else if (activeDaySchedule == null) {
                activeDaySchedule = root.optJSONArray("dailyPrayers");
                nextDaySchedule = activeDaySchedule;
            }

            if (activeDaySchedule == null || activeDaySchedule.length() == 0) {
                return model;
            }

            Calendar nowCal = Calendar.getInstance();
            nowCal.setTimeInMillis(nowMs);
            boolean isFriday = nowCal.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY;

            // Populate 5 daily prayers table from activeDaySchedule
            fillFiveDailyPrayers(model, activeDaySchedule, isFriday);

            // Find upcoming prayer in activeDaySchedule
            JSONObject matchedNext = null;
            long matchedEpoch = 0L;

            for (int i = 0; i < activeDaySchedule.length(); i++) {
                JSONObject item = activeDaySchedule.optJSONObject(i);
                if (item == null) continue;
                String time24 = item.optString("time24", "");
                long candidateEpoch = parseTimeTodayEpoch(nowCal, time24, 0);
                if (candidateEpoch > nowMs) {
                    matchedNext = item;
                    matchedEpoch = candidateEpoch;
                    break;
                }
            }

            // After Isha: roll forward to next day's Fajr
            if (matchedNext == null && nextDaySchedule != null && nextDaySchedule.length() > 0) {
                JSONObject firstTomorrow = nextDaySchedule.optJSONObject(0);
                if (firstTomorrow != null) {
                    matchedNext = firstTomorrow;
                    matchedEpoch = parseTimeTodayEpoch(nowCal, firstTomorrow.optString("time24", "05:00"), 1);
                    if (!tomorrowHijri.isEmpty() && todayDateKey.equals(nowDateKey)) {
                        // Still tonight before midnight; keep today's Hijri until midnight
                        model.hijriDate = todayHijri;
                    }
                }
            }

            if (matchedNext != null && matchedEpoch > nowMs) {
                model.hasSchedule = true;
                model.nextPrayerKey = matchedNext.optString("key", "fajr");
                String rawName = matchedNext.optString("nameAr", defaultNameForKey(model.nextPrayerKey, isFriday));
                if ("dhuhr".equals(model.nextPrayerKey)) {
                    Calendar targetCal = Calendar.getInstance();
                    targetCal.setTimeInMillis(matchedEpoch);
                    rawName = targetCal.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY ? "الجمعة" : "الظهر";
                }
                model.nextPrayerNameAr = rawName;
                model.nextPrayerTime12 = matchedNext.optString(
                    "time12",
                    format12HourArabic(matchedNext.optString("time24", "05:00"))
                );
                model.nextTriggerEpochMs = matchedEpoch;
                model.nextLabelAr = "الصلاة القادمة";
            }
        } catch (Exception ignored) {
            // Fall back safely to model defaults
        }
        return model;
    }

    private static void fillFiveDailyPrayers(WidgetDisplayModel model, JSONArray schedule, boolean isFriday) {
        String[] targetKeys = new String[] { "fajr", "dhuhr", "asr", "maghrib", "isha" };
        for (int t = 0; t < targetKeys.length; t++) {
            String key = targetKeys[t];
            model.dailyLabels[t] = defaultNameForKey(key, isFriday);
            model.dailyTimes12[t] = "--:--";
            for (int i = 0; i < schedule.length(); i++) {
                JSONObject item = schedule.optJSONObject(i);
                if (item != null && key.equals(item.optString("key"))) {
                    String itemName = item.optString("nameAr", model.dailyLabels[t]);
                    if ("dhuhr".equals(key)) {
                        itemName = isFriday ? "الجمعة" : "الظهر";
                    }
                    model.dailyLabels[t] = itemName;
                    model.dailyTimes12[t] = item.optString(
                        "time12",
                        format12HourArabic(item.optString("time24", "--:--"))
                    );
                    break;
                }
            }
        }
    }

    private static long parseTimeTodayEpoch(Calendar baseNow, String time24, int addDays) {
        if (time24 == null || !time24.contains(":")) return 0L;
        try {
            String[] parts = time24.trim().split(":");
            int hour = Integer.parseInt(parts[0]);
            int minute = Integer.parseInt(parts[1]);
            Calendar cal = (Calendar) baseNow.clone();
            cal.add(Calendar.DAY_OF_YEAR, addDays);
            cal.set(Calendar.HOUR_OF_DAY, hour);
            cal.set(Calendar.MINUTE, minute);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            return cal.getTimeInMillis();
        } catch (Exception e) {
            return 0L;
        }
    }

    private static String defaultNameForKey(String key, boolean isFriday) {
        switch (key) {
            case "fajr":
                return "الفجر";
            case "sunrise":
                return "الشروق";
            case "dhuhr":
                return isFriday ? "الجمعة" : "الظهر";
            case "asr":
                return "العصر";
            case "maghrib":
                return "المغرب";
            case "isha":
                return "العشاء";
            default:
                return "الصلاة";
        }
    }

    private static String format12HourArabic(String time24) {
        if (time24 == null || !time24.contains(":")) return "--:--";
        try {
            String[] parts = time24.trim().split(":");
            int h = Integer.parseInt(parts[0]);
            int m = Integer.parseInt(parts[1]);
            int h12 = h % 12 == 0 ? 12 : h % 12;
            String suffix = h >= 12 ? "م" : "ص";
            return String.format(Locale.US, "%02d:%02d %s", h12, m, suffix);
        } catch (Exception e) {
            return time24;
        }
    }

    private static final class WidgetDisplayModel {
        boolean hasSchedule = false;
        String theme = "emerald";
        boolean showHijriDate = true;
        String cityNameAr = "مواقيت الصلاة - محراب";
        String hijriDate = "افتح التطبيق لمزامنة مدينتك";
        String nextLabelAr = "الصلاة القادمة";
        String nextPrayerKey = "fajr";
        String nextPrayerNameAr = "المواقيت";
        String nextPrayerTime12 = "--:--";
        long nextTriggerEpochMs = 0L;
        final String[] dailyLabels = new String[] { "الفجر", "الظهر", "العصر", "المغرب", "العشاء" };
        final String[] dailyTimes12 = new String[] { "--:--", "--:--", "--:--", "--:--", "--:--" };
    }
}
