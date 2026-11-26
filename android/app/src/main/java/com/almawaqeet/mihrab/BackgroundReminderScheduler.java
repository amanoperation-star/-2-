package com.almawaqeet.mihrab;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public final class BackgroundReminderScheduler {
    public static final String STATE_PREFS = "mihrab_bg_alarm_state";
    private static final String KEY_SALAWAT_NEXT_MS = "salawat_next_epoch_ms";
    private static final String KEY_SALAWAT_INTERVAL_MIN = "salawat_interval_mins";
    private static final String KEY_PERIODIC_NEXT_MS = "periodic_next_epoch_ms";
    private static final String KEY_PERIODIC_INTERVAL_MIN = "periodic_interval_mins";
    private static final String KEY_PERIODIC_CONFIG_SIG = "periodic_config_sig";

    private static final int REQ_EXACT_ADHAN = 6101;
    private static final int REQ_SALAWAT = 6102;
    private static final int REQ_PERIODIC = 6103;
    private static final int REQ_SHOW_CLOCK_APP = 6104;

    private BackgroundReminderScheduler() {}

    public static boolean canScheduleExactAlarms(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) return true;
        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        return am != null && am.canScheduleExactAlarms();
    }

    public static void scheduleAll(Context context) {
        if (context == null) return;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return;

        try {
            JSONObject root = new JSONObject(rawJson);
            scheduleNextPrayerAdhan(context, root);
            scheduleSalawatFromRoot(context, root, false);
            schedulePeriodicFromRoot(context, root, false);
        } catch (Exception ignored) {
            // ignore malformed JSON
        }
    }

    public static void scheduleNextSalawat(Context context) {
        if (context == null) return;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return;
        try {
            scheduleSalawatFromRoot(context, new JSONObject(rawJson), true);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void scheduleNextPeriodicReminder(Context context) {
        if (context == null) return;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return;
        try {
            schedulePeriodicFromRoot(context, new JSONObject(rawJson), true);
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void scheduleNextPrayerAdhan(Context context, JSONObject root) {
        JSONObject audioSettings = root.optJSONObject("audioSettings");
        boolean notificationsEnabled = audioSettings == null || audioSettings.optBoolean("notificationsEnabled", true);
        if (!notificationsEnabled) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_EXACT_ADHAN_ALARM, REQ_EXACT_ADHAN);
            return;
        }

        long nowMs = System.currentTimeMillis();
        String cityNameAr = root.optString("cityNameAr", "القاهرة");
        JSONObject notifSettings = root.optJSONObject("notificationSettings");
        String mosqueTheme = notifSettings != null ? notifSettings.optString("mosqueTheme", "auto") : "auto";

        String nowDateKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(nowMs));
        String tomorrowDateKey = root.optString("tomorrowDateKey", "");
        JSONArray todaySchedule = root.optJSONArray("todaySchedule");
        JSONArray tomorrowSchedule = root.optJSONArray("tomorrowSchedule");

        JSONArray activeSchedule = todaySchedule;
        JSONArray nextSchedule = tomorrowSchedule != null ? tomorrowSchedule : todaySchedule;
        if (!tomorrowDateKey.isEmpty() && tomorrowDateKey.equals(nowDateKey) && tomorrowSchedule != null) {
            activeSchedule = tomorrowSchedule;
            nextSchedule = tomorrowSchedule;
        } else if (activeSchedule == null) {
            activeSchedule = root.optJSONArray("dailyPrayers");
            nextSchedule = activeSchedule;
        }

        if (activeSchedule == null || activeSchedule.length() == 0) return;

        Calendar nowCal = Calendar.getInstance();
        nowCal.setTimeInMillis(nowMs);

        JSONObject matchedPrayer = null;
        long matchedEpoch = 0L;

        for (int i = 0; i < activeSchedule.length(); i++) {
            JSONObject item = activeSchedule.optJSONObject(i);
            if (item == null) continue;
            String key = item.optString("key", "");
            if ("sunrise".equals(key)) continue;
            long candidate = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, item.optString("time24", ""), 0);
            if (candidate > nowMs + 1000L) {
                matchedPrayer = item;
                matchedEpoch = candidate;
                break;
            }
        }

        if (matchedPrayer == null && nextSchedule != null) {
            for (int i = 0; i < nextSchedule.length(); i++) {
                JSONObject item = nextSchedule.optJSONObject(i);
                if (item == null) continue;
                String key = item.optString("key", "");
                if ("sunrise".equals(key)) continue;
                long candidate = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, item.optString("time24", ""), 1);
                if (candidate > nowMs + 1000L) {
                    matchedPrayer = item;
                    matchedEpoch = candidate;
                    break;
                }
            }
        }

        if (matchedPrayer == null || matchedEpoch <= nowMs) return;

        String pKey = matchedPrayer.optString("key", "dhuhr");
        Calendar targetCal = Calendar.getInstance();
        targetCal.setTimeInMillis(matchedEpoch);
        String pName = matchedPrayer.optString("nameAr", "الصلاة");
        if ("dhuhr".equals(pKey)) {
            pName = (targetCal.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY) ? "الجمعة" : "الظهر";
        }
        String pTime12 = matchedPrayer.optString("time12", "");

        Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
        intent.setAction(BackgroundAlarmReceiver.ACTION_EXACT_ADHAN_ALARM);
        intent.putExtra("prayer_key", pKey);
        intent.putExtra("prayer_name", pName);
        intent.putExtra("prayer_time12", pTime12);
        intent.putExtra("city_name", cityNameAr);
        intent.putExtra("mosque_theme", mosqueTheme);
        intent.putExtra("target_epoch_ms", matchedEpoch);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            REQ_EXACT_ADHAN,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;

        try {
            Intent showIntent = new Intent(context, MainActivity.class);
            showIntent.putExtra("mihrab_shortcut_route", "times");
            PendingIntent showPi = PendingIntent.getActivity(
                context,
                REQ_SHOW_CLOCK_APP,
                showIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );
            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(matchedEpoch, showPi);
            am.setAlarmClock(clockInfo, pi);
        } catch (SecurityException secEx) {
            scheduleAllowWhileIdleFallback(am, matchedEpoch, pi, false);
        } catch (Exception ignored) {
            scheduleAllowWhileIdleFallback(am, matchedEpoch, pi, false);
        }
    }

    private static void scheduleSalawatFromRoot(Context context, JSONObject root, boolean forceAdvance) {
        JSONObject bg = root.optJSONObject("backgroundReminders");
        JSONObject audio = root.optJSONObject("audioSettings");
        boolean meetingMode = audio != null && audio.optBoolean("meetingModeEnabled", false);
        boolean enabled = bg == null || bg.optBoolean("salawatEnabled", true);
        int intervalMins = bg != null ? Math.max(1, bg.optInt("salawatIntervalMinutes", 10)) : 10;

        if (!enabled || meetingMode) {
            SharedPreferences state = context.getSharedPreferences(STATE_PREFS, Context.MODE_PRIVATE);
            state.edit().remove(KEY_SALAWAT_NEXT_MS).apply();
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_SALAWAT_ALARM, REQ_SALAWAT);
            return;
        }

        SharedPreferences state = context.getSharedPreferences(STATE_PREFS, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        long savedNext = state.getLong(KEY_SALAWAT_NEXT_MS, 0L);
        int savedInterval = state.getInt(KEY_SALAWAT_INTERVAL_MIN, -1);

        long nextTrigger;
        if (!forceAdvance && savedInterval == intervalMins && savedNext > now + 5000L) {
            nextTrigger = savedNext;
        } else {
            nextTrigger = now + intervalMins * 60_000L;
            state.edit()
                .putLong(KEY_SALAWAT_NEXT_MS, nextTrigger)
                .putInt(KEY_SALAWAT_INTERVAL_MIN, intervalMins)
                .apply();
        }

        Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
        intent.setAction(BackgroundAlarmReceiver.ACTION_SALAWAT_ALARM);
        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            REQ_SALAWAT,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            scheduleAllowWhileIdleFallback(am, nextTrigger, pi, canScheduleExactAlarms(context));
        }
    }

    public static boolean isNowWithinPeriodicQuietHours(Context context) {
        if (context == null) return false;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return false;
        try {
            JSONObject root = new JSONObject(rawJson);
            JSONObject bg = root.optJSONObject("backgroundReminders");
            if (bg == null) return false;
            boolean quietEnabled = bg.optBoolean("periodicQuietHoursEnabled", true);
            if (!quietEnabled) return false;
            String start = bg.optString("periodicQuietStart", "23:00");
            String end = bg.optString("periodicQuietEnd", "06:00");
            return isTimestampWithinQuietHours(System.currentTimeMillis(), start, end);
        } catch (Exception ignored) {
            return false;
        }
    }

    private static void schedulePeriodicFromRoot(Context context, JSONObject root, boolean forceAdvance) {
        JSONObject bg = root.optJSONObject("backgroundReminders");
        boolean enabled = bg == null || bg.optBoolean("periodicReminderEnabled", true);
        int intervalMins = bg != null ? Math.max(1, bg.optInt("periodicReminderInterval", 15)) : 15;
        boolean quietEnabled = bg == null || bg.optBoolean("periodicQuietHoursEnabled", true);
        String quietStart = bg != null ? bg.optString("periodicQuietStart", "23:00") : "23:00";
        String quietEnd = bg != null ? bg.optString("periodicQuietEnd", "06:00") : "06:00";

        SharedPreferences state = context.getSharedPreferences(STATE_PREFS, Context.MODE_PRIVATE);
        if (!enabled) {
            state.edit().remove(KEY_PERIODIC_NEXT_MS).remove(KEY_PERIODIC_CONFIG_SIG).apply();
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_PERIODIC_REMINDER_ALARM, REQ_PERIODIC);
            return;
        }

        String configSig = intervalMins + "|" + quietEnabled + "|" + quietStart + "|" + quietEnd;
        long now = System.currentTimeMillis();
        long savedNext = state.getLong(KEY_PERIODIC_NEXT_MS, 0L);
        int savedInterval = state.getInt(KEY_PERIODIC_INTERVAL_MIN, -1);
        String savedSig = state.getString(KEY_PERIODIC_CONFIG_SIG, "");

        long nextTrigger;
        boolean sigMatches = configSig.equals(savedSig) && savedInterval == intervalMins;
        if (
            !forceAdvance
                && sigMatches
                && savedNext > now + 5000L
                && (!quietEnabled || !isTimestampWithinQuietHours(savedNext, quietStart, quietEnd))
        ) {
            nextTrigger = savedNext;
        } else {
            nextTrigger = now + intervalMins * 60_000L;
            if (quietEnabled && isTimestampWithinQuietHours(nextTrigger, quietStart, quietEnd)) {
                nextTrigger = getNextTimeAfterQuietHours(nextTrigger, quietStart, quietEnd);
            }
            state.edit()
                .putLong(KEY_PERIODIC_NEXT_MS, nextTrigger)
                .putInt(KEY_PERIODIC_INTERVAL_MIN, intervalMins)
                .putString(KEY_PERIODIC_CONFIG_SIG, configSig)
                .apply();
        }

        Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
        intent.setAction(BackgroundAlarmReceiver.ACTION_PERIODIC_REMINDER_ALARM);
        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            REQ_PERIODIC,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
        if (am != null) {
            scheduleAllowWhileIdleFallback(am, nextTrigger, pi, canScheduleExactAlarms(context));
        }
    }

    private static int parseHHmmMinutes(String hhmm, int fallbackMins) {
        if (hhmm == null || !hhmm.contains(":")) return fallbackMins;
        try {
            String[] parts = hhmm.trim().split(":");
            int h = Math.max(0, Math.min(23, Integer.parseInt(parts[0])));
            int m = Math.max(0, Math.min(59, Integer.parseInt(parts[1])));
            return h * 60 + m;
        } catch (Exception e) {
            return fallbackMins;
        }
    }

    private static boolean isTimestampWithinQuietHours(long epochMs, String startHHmm, String endHHmm) {
        int startMin = parseHHmmMinutes(startHHmm, 23 * 60);
        int endMin = parseHHmmMinutes(endHHmm, 6 * 60);
        if (startMin == endMin) return false;
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(epochMs);
        int currentMin = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
        if (startMin > endMin) {
            return currentMin >= startMin || currentMin < endMin;
        }
        return currentMin >= startMin && currentMin < endMin;
    }

    private static long getNextTimeAfterQuietHours(long epochMs, String startHHmm, String endHHmm) {
        int startMin = parseHHmmMinutes(startHHmm, 23 * 60);
        int endMin = parseHHmmMinutes(endHHmm, 6 * 60);
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(epochMs);
        int currentMin = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);

        cal.set(Calendar.HOUR_OF_DAY, endMin / 60);
        cal.set(Calendar.MINUTE, endMin % 60);
        cal.set(Calendar.SECOND, 0);
        cal.set(Calendar.MILLISECOND, 0);

        if (startMin > endMin && currentMin >= startMin) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        if (cal.getTimeInMillis() <= epochMs) {
            cal.add(Calendar.DAY_OF_YEAR, 1);
        }
        return cal.getTimeInMillis();
    }

    private static void scheduleAllowWhileIdleFallback(
        AlarmManager am,
        long triggerAtMs,
        PendingIntent pi,
        boolean tryExact
    ) {
        try {
            if (tryExact && Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
                return;
            }
        } catch (SecurityException ignored) {
            // fall through to inexact idle-safe alarm
        } catch (Exception ignored) {
            // fall through
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
        } else {
            am.set(AlarmManager.RTC_WAKEUP, triggerAtMs, pi);
        }
    }

    private static void cancelAlarm(Context context, String action, int requestCode) {
        try {
            AlarmManager am = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (am == null) return;
            Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
            intent.setAction(action);
            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                requestCode,
                intent,
                PendingIntent.FLAG_NO_CREATE | PendingIntent.FLAG_IMMUTABLE
            );
            if (pi != null) {
                am.cancel(pi);
                pi.cancel();
            }
        } catch (Exception ignored) {
            // ignore
        }
    }
}
