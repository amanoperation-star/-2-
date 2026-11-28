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
    private static final int REQ_PRE_ADHAN = 6105;
    private static final int REQ_IQAMA = 6106;
    private static final int REQ_LAST_THIRD = 6107;

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
            scheduleNextPreAdhan(context, root, 0L);
            scheduleNextIqama(context, root);
            scheduleNextLastThird(context, root);
            scheduleSalawatFromRoot(context, root, false);
            schedulePeriodicFromRoot(context, root, false);
        } catch (Exception ignored) {
            // ignore malformed JSON
        }
    }

    public static void scheduleNextPreAdhan(Context context) {
        scheduleNextPreAdhanAfter(context, 0L);
    }

    public static void scheduleNextPreAdhanAfter(Context context, long minAfterEpochMs) {
        if (context == null) return;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return;
        try {
            scheduleNextPreAdhan(context, new JSONObject(rawJson), minAfterEpochMs);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void scheduleNextIqama(Context context) {
        if (context == null) return;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return;
        try {
            scheduleNextIqama(context, new JSONObject(rawJson));
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void scheduleNextLastThird(Context context) {
        if (context == null) return;
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) return;
        try {
            scheduleNextLastThird(context, new JSONObject(rawJson));
        } catch (Exception ignored) {
            // ignore
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

        JSONObject prayerAdhanEnabled = audioSettings != null ? audioSettings.optJSONObject("prayerAdhanEnabled") : null;

        JSONObject matchedPrayer = null;
        long matchedEpoch = 0L;

        for (int i = 0; i < activeSchedule.length(); i++) {
            JSONObject item = activeSchedule.optJSONObject(i);
            if (item == null) continue;
            String key = item.optString("key", "");
            if ("sunrise".equals(key)) continue;
            if (prayerAdhanEnabled != null && !prayerAdhanEnabled.optBoolean(key, true)) continue;
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
                if (prayerAdhanEnabled != null && !prayerAdhanEnabled.optBoolean(key, true)) continue;
                long candidate = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, item.optString("time24", ""), 1);
                if (candidate > nowMs + 1000L) {
                    matchedPrayer = item;
                    matchedEpoch = candidate;
                    break;
                }
            }
        }

        if (matchedPrayer == null || matchedEpoch <= nowMs) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_EXACT_ADHAN_ALARM, REQ_EXACT_ADHAN);
            return;
        }

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

    private static void scheduleNextPreAdhan(Context context, JSONObject root, long minAfterEpochMs) {
        JSONObject audioSettings = root.optJSONObject("audioSettings");
        boolean notificationsEnabled = audioSettings == null || audioSettings.optBoolean("notificationsEnabled", true);
        JSONObject prayerAdhanEnabled = audioSettings != null ? audioSettings.optJSONObject("prayerAdhanEnabled") : null;
        JSONObject preAdhan = root.optJSONObject("preAdhanSettings");
        int reminderMins = preAdhan != null ? preAdhan.optInt("minutes", 10) : 10;
        boolean soundEnabled = preAdhan == null || preAdhan.optBoolean("soundEnabled", true);

        if (reminderMins <= 0 || (!notificationsEnabled && !soundEnabled)) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_PRE_ADHAN_ALARM, REQ_PRE_ADHAN);
            return;
        }

        long nowMs = System.currentTimeMillis();
        long minThresholdMs = Math.max(nowMs + 1000L, minAfterEpochMs > 0L ? minAfterEpochMs + 2000L : 0L);
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
        long matchedAdhanEpoch = 0L;
        long matchedTriggerEpoch = 0L;

        for (int dayOffset = 0; dayOffset <= 1; dayOffset++) {
            JSONArray sched = dayOffset == 0 ? activeSchedule : nextSchedule;
            if (sched == null) continue;
            for (int i = 0; i < sched.length(); i++) {
                JSONObject item = sched.optJSONObject(i);
                if (item == null) continue;
                String key = item.optString("key", "");
                if ("sunrise".equals(key)) continue;
                if (prayerAdhanEnabled != null && !prayerAdhanEnabled.optBoolean(key, true)) continue;
                long adhanEpoch = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, item.optString("time24", ""), dayOffset);
                if (adhanEpoch <= 0L) continue;
                long triggerEpoch = adhanEpoch - reminderMins * 60_000L;
                if (triggerEpoch > minThresholdMs && (matchedTriggerEpoch == 0L || triggerEpoch < matchedTriggerEpoch)) {
                    matchedPrayer = item;
                    matchedAdhanEpoch = adhanEpoch;
                    matchedTriggerEpoch = triggerEpoch;
                }
            }
            if (matchedPrayer != null) break;
        }

        if (matchedPrayer == null || matchedTriggerEpoch <= nowMs) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_PRE_ADHAN_ALARM, REQ_PRE_ADHAN);
            return;
        }

        String pKey = matchedPrayer.optString("key", "dhuhr");
        Calendar targetCal = Calendar.getInstance();
        targetCal.setTimeInMillis(matchedAdhanEpoch);
        String pName = matchedPrayer.optString("nameAr", "الصلاة");
        if ("dhuhr".equals(pKey)) {
            pName = (targetCal.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY) ? "الجمعة" : "الظهر";
        }

        Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
        intent.setAction(BackgroundAlarmReceiver.ACTION_PRE_ADHAN_ALARM);
        intent.putExtra("prayer_key", pKey);
        intent.putExtra("prayer_name", pName);
        intent.putExtra("reminder_minutes", reminderMins);
        intent.putExtra("city_name", cityNameAr);
        intent.putExtra("mosque_theme", mosqueTheme);
        intent.putExtra("target_epoch_ms", matchedTriggerEpoch);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            REQ_PRE_ADHAN,
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
            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(matchedTriggerEpoch, showPi);
            am.setAlarmClock(clockInfo, pi);
        } catch (SecurityException secEx) {
            scheduleAllowWhileIdleFallback(am, matchedTriggerEpoch, pi, canScheduleExactAlarms(context));
        } catch (Exception ignored) {
            scheduleAllowWhileIdleFallback(am, matchedTriggerEpoch, pi, canScheduleExactAlarms(context));
        }
    }

    private static void scheduleNextIqama(Context context, JSONObject root) {
        JSONObject audioSettings = root.optJSONObject("audioSettings");
        boolean notificationsEnabled = audioSettings == null || audioSettings.optBoolean("notificationsEnabled", true);
        JSONObject iqamaSettings = root.optJSONObject("iqamaSettings");
        boolean autoPlayEnabled = iqamaSettings == null || iqamaSettings.optBoolean("autoPlayEnabled", true);

        if (!notificationsEnabled && !autoPlayEnabled) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_IQAMA_ALARM, REQ_IQAMA);
            return;
        }

        JSONObject minutesObj = iqamaSettings != null ? iqamaSettings.optJSONObject("minutes") : null;
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
        long matchedAdhanEpoch = 0L;
        long matchedIqamaEpoch = 0L;

        int[] dayOffsets = new int[] { -1, 0, 1 };
        for (int dayOffset : dayOffsets) {
            JSONArray sched = dayOffset == 1 ? nextSchedule : activeSchedule;
            if (sched == null) continue;
            for (int i = 0; i < sched.length(); i++) {
                JSONObject item = sched.optJSONObject(i);
                if (item == null) continue;
                String key = item.optString("key", "");
                if ("sunrise".equals(key)) continue;
                int offsetMins = minutesObj != null ? Math.max(1, minutesObj.optInt(key, 15)) : 15;
                long adhanEpoch = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, item.optString("time24", ""), dayOffset);
                if (adhanEpoch <= 0L) continue;
                long iqamaEpoch = adhanEpoch + offsetMins * 60_000L;
                if (iqamaEpoch > nowMs + 1000L && (matchedIqamaEpoch == 0L || iqamaEpoch < matchedIqamaEpoch)) {
                    matchedPrayer = item;
                    matchedAdhanEpoch = adhanEpoch;
                    matchedIqamaEpoch = iqamaEpoch;
                }
            }
        }

        if (matchedPrayer == null || matchedIqamaEpoch <= nowMs) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_IQAMA_ALARM, REQ_IQAMA);
            return;
        }

        String pKey = matchedPrayer.optString("key", "dhuhr");
        Calendar targetCal = Calendar.getInstance();
        targetCal.setTimeInMillis(matchedAdhanEpoch);
        String pName = matchedPrayer.optString("nameAr", "الصلاة");
        if ("dhuhr".equals(pKey)) {
            pName = (targetCal.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY) ? "الجمعة" : "الظهر";
        }

        Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
        intent.setAction(BackgroundAlarmReceiver.ACTION_IQAMA_ALARM);
        intent.putExtra("prayer_key", pKey);
        intent.putExtra("prayer_name", pName);
        intent.putExtra("city_name", cityNameAr);
        intent.putExtra("mosque_theme", mosqueTheme);
        intent.putExtra("target_epoch_ms", matchedIqamaEpoch);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            REQ_IQAMA,
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
            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(matchedIqamaEpoch, showPi);
            am.setAlarmClock(clockInfo, pi);
        } catch (SecurityException secEx) {
            scheduleAllowWhileIdleFallback(am, matchedIqamaEpoch, pi, canScheduleExactAlarms(context));
        } catch (Exception ignored) {
            scheduleAllowWhileIdleFallback(am, matchedIqamaEpoch, pi, canScheduleExactAlarms(context));
        }
    }

    private static String findScheduleTime24(JSONArray schedule, String prayerKey, String fallback) {
        if (schedule != null) {
            for (int i = 0; i < schedule.length(); i++) {
                JSONObject item = schedule.optJSONObject(i);
                if (item != null && prayerKey.equals(item.optString("key", ""))) {
                    String t = item.optString("time24", "");
                    if (!t.isEmpty()) return t;
                }
            }
        }
        return fallback;
    }

    private static String findScheduleTime12(JSONArray schedule, String prayerKey, String fallback) {
        if (schedule != null) {
            for (int i = 0; i < schedule.length(); i++) {
                JSONObject item = schedule.optJSONObject(i);
                if (item != null && prayerKey.equals(item.optString("key", ""))) {
                    String t = item.optString("time12", "");
                    if (!t.isEmpty()) return t;
                }
            }
        }
        return fallback;
    }

    private static void scheduleNextLastThird(Context context, JSONObject root) {
        JSONObject lastThird = root.optJSONObject("lastThirdSettings");
        boolean enabled = lastThird == null || lastThird.optBoolean("enabled", true);
        if (!enabled) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_LAST_THIRD_ALARM, REQ_LAST_THIRD);
            return;
        }

        String mode = lastThird != null ? lastThird.optString("mode", "astronomical") : "astronomical";
        int beforeFajrMins = lastThird != null ? Math.max(5, lastThird.optInt("beforeFajrMinutes", 30)) : 30;
        String customTime = lastThird != null ? lastThird.optString("customTime", "03:00") : "03:00";

        long nowMs = System.currentTimeMillis();
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

        String fallbackMaghrib = lastThird != null ? lastThird.optString("maghribTime24", "18:00") : "18:00";
        String fallbackFajr = lastThird != null ? lastThird.optString("fajrTime24", "05:00") : "05:00";
        String todayMaghrib24 = findScheduleTime24(activeSchedule, "maghrib", fallbackMaghrib);
        String nextMaghrib24 = findScheduleTime24(nextSchedule, "maghrib", todayMaghrib24);
        String todayFajr24 = findScheduleTime24(activeSchedule, "fajr", fallbackFajr);
        String nextFajr24 = findScheduleTime24(nextSchedule, "fajr", todayFajr24);
        String fajrTime12 = findScheduleTime12(nextSchedule, "fajr", findScheduleTime12(activeSchedule, "fajr", ""));

        Calendar nowCal = Calendar.getInstance();
        nowCal.setTimeInMillis(nowMs);

        long matchedTriggerEpoch = 0L;
        int[] nightOffsets = new int[] { -1, 0, 1 };
        for (int nightOffset : nightOffsets) {
            String mTime = (nightOffset >= 1) ? nextMaghrib24 : todayMaghrib24;
            String fTime = (nightOffset >= 0) ? nextFajr24 : todayFajr24;

            long maghribEpoch = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, mTime, nightOffset);
            long fajrEpoch = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, fTime, nightOffset + 1);
            if (maghribEpoch <= 0L || fajrEpoch <= maghribEpoch) continue;

            long triggerEpoch;
            if ("before_fajr".equals(mode)) {
                triggerEpoch = fajrEpoch - beforeFajrMins * 60_000L;
            } else if ("custom".equals(mode)) {
                triggerEpoch = PrayerNotificationHelper.parseTimeTodayEpoch(nowCal, customTime, nightOffset);
                if (triggerEpoch < maghribEpoch) {
                    triggerEpoch += 24L * 60L * 60L * 1000L;
                }
            } else {
                long nightDurationMs = fajrEpoch - maghribEpoch;
                triggerEpoch = maghribEpoch + (2L * nightDurationMs) / 3L;
            }

            if (triggerEpoch > nowMs + 1000L && (matchedTriggerEpoch == 0L || triggerEpoch < matchedTriggerEpoch)) {
                matchedTriggerEpoch = triggerEpoch;
            }
        }

        if (matchedTriggerEpoch <= nowMs) {
            cancelAlarm(context, BackgroundAlarmReceiver.ACTION_LAST_THIRD_ALARM, REQ_LAST_THIRD);
            return;
        }

        Intent intent = new Intent(context, BackgroundAlarmReceiver.class);
        intent.setAction(BackgroundAlarmReceiver.ACTION_LAST_THIRD_ALARM);
        intent.putExtra("target_epoch_ms", matchedTriggerEpoch);
        intent.putExtra("fajr_time12", fajrTime12);

        PendingIntent pi = PendingIntent.getBroadcast(
            context,
            REQ_LAST_THIRD,
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
            AlarmManager.AlarmClockInfo clockInfo = new AlarmManager.AlarmClockInfo(matchedTriggerEpoch, showPi);
            am.setAlarmClock(clockInfo, pi);
        } catch (SecurityException secEx) {
            scheduleAllowWhileIdleFallback(am, matchedTriggerEpoch, pi, canScheduleExactAlarms(context));
        } catch (Exception ignored) {
            scheduleAllowWhileIdleFallback(am, matchedTriggerEpoch, pi, canScheduleExactAlarms(context));
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
