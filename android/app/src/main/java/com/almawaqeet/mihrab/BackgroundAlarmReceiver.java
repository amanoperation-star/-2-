package com.almawaqeet.mihrab;

import android.app.KeyguardManager;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.PowerManager;
import android.os.Vibrator;
import android.os.VibrationEffect;
import android.os.Build;
import androidx.core.content.ContextCompat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.List;
import java.util.Random;
import org.json.JSONArray;
import org.json.JSONObject;

public class BackgroundAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_EXACT_ADHAN_ALARM = "com.almawaqeet.mihrab.ACTION_EXACT_ADHAN_ALARM";
    public static final String ACTION_PRE_ADHAN_ALARM = "com.almawaqeet.mihrab.ACTION_PRE_ADHAN_ALARM";
    public static final String ACTION_IQAMA_ALARM = "com.almawaqeet.mihrab.ACTION_IQAMA_ALARM";
    public static final String ACTION_SALAWAT_ALARM = "com.almawaqeet.mihrab.ACTION_SALAWAT_ALARM";
    public static final String ACTION_PERIODIC_REMINDER_ALARM = "com.almawaqeet.mihrab.ACTION_PERIODIC_REMINDER_ALARM";
    public static final String ACTION_LAST_THIRD_ALARM = "com.almawaqeet.mihrab.ACTION_LAST_THIRD_ALARM";
    public static final String ACTION_STOP_AUDIO_SERVICE = "com.almawaqeet.mihrab.ACTION_STOP_AUDIO_SERVICE";

    private static final String KEY_SALAWAT_ROTATE_IDX = "salawat_rotate_idx";
    private static final String KEY_PRE_ADHAN_ROTATE_IDX = "pre_adhan_rotate_idx";
    private static final String KEY_IQAMA_ROTATE_IDX = "iqama_rotate_idx";
    private static final String KEY_LAST_PERIODIC_ID = "last_periodic_id";
    private static final String KEY_LAST_ADHAN_FIRED_KEY = "last_adhan_fired_epoch_key";
    private static final String KEY_LAST_PRE_ADHAN_FIRED_KEY = "last_pre_adhan_fired_epoch_key";
    private static final String KEY_LAST_IQAMA_FIRED_KEY = "last_iqama_fired_epoch_key";
    private static final String KEY_LAST_THIRD_FIRED_KEY = "last_third_fired_epoch_key";

    private static final SalawatPreset[] SALAWAT_PRESETS = new SalawatPreset[] {
        new SalawatPreset(
            "mishary",
            "الشيخ مشاري راشد العفاسي",
            "﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾",
            "/audio/salawat-mishary.mp3"
        ),
        new SalawatPreset(
            "dosari",
            "الشيخ ياسر الدوسري",
            "﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾",
            "/audio/salawat-dosari.mp3"
        ),
        new SalawatPreset(
            "muaiqly",
            "الشيخ ماهر المعيقلي",
            "﴿إِنَّ اللَّهَ وَمَلَائِكَتَهُ يُصَلُّونَ عَلَى النَّبِيِّ ۚ يَا أَيُّهَا الَّذِينَ آمَنُوا صَلُّوا عَلَيْهِ وَسَلِّمُوا تَسْلِيمًا﴾",
            "/audio/salawat-muaiqly.mp3"
        ),
        new SalawatPreset(
            "naqshabandi",
            "الشيخ سيد النقشبندي",
            "الصَّلَاةُ وَالسَّلَامُ عَلَيْكَ يَا حَبِيبِي يَا رَسُولَ اللَّهِ ﷺ",
            "/audio/salawat-naqshabandi.mp3"
        ),
        new SalawatPreset(
            "naqshabandi_radio",
            "الشيخ سيد النقشبندي (إذاعة القرآن الكريم)",
            "اللَّهُمَّ صَلِّ عَلَى سَيِّدِنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ وَسَلِّمْ",
            "/audio/salawat-naqshabandi-radio.mp3"
        ),
    };

    @Override
    public void onReceive(Context context, Intent intent) {
        if (context == null || intent == null || intent.getAction() == null) return;
        String action = intent.getAction();

        if (ACTION_STOP_AUDIO_SERVICE.equals(action)) {
            stopAudioServiceAndAlerts(context);
            return;
        }

        if (ACTION_EXACT_ADHAN_ALARM.equals(action)) {
            handleAdhanAlarm(context, intent, false);
            return;
        }

        if (ACTION_PRE_ADHAN_ALARM.equals(action)) {
            handlePreAdhanAlarm(context, intent, false);
            return;
        }

        if (ACTION_IQAMA_ALARM.equals(action)) {
            handleIqamaAlarm(context, intent, false);
            return;
        }

        if (ACTION_SALAWAT_ALARM.equals(action)) {
            handleSalawatAlarm(context, false);
            return;
        }

        if (ACTION_PERIODIC_REMINDER_ALARM.equals(action)) {
            handlePeriodicReminderAlarm(context, false);
            return;
        }

        if (ACTION_LAST_THIRD_ALARM.equals(action)) {
            handleLastThirdAlarm(context, intent, false);
            return;
        }

        if (
            Intent.ACTION_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_LOCKED_BOOT_COMPLETED.equals(action)
                || Intent.ACTION_TIME_CHANGED.equals(action)
                || Intent.ACTION_TIMEZONE_CHANGED.equals(action)
                || Intent.ACTION_MY_PACKAGE_REPLACED.equals(action)
        ) {
            PrayerWidgetHelper.updateAllWidgets(context);
            PrayerNotificationHelper.refreshOngoingNotification(context);
            BackgroundReminderScheduler.scheduleAll(context);
        }
    }

    public static void triggerTestFromUi(Context context, String type) {
        if (context == null || type == null) return;
        if ("adhan".equals(type)) {
            PrayerNotificationHelper.NotificationState st =
                PrayerNotificationHelper.buildNotificationState(context);
            Intent fake = new Intent(ACTION_EXACT_ADHAN_ALARM);
            fake.putExtra("prayer_key", st.nextPrayerKey);
            fake.putExtra("prayer_name", st.nextPrayerNameAr);
            fake.putExtra("prayer_time12", st.nextPrayerTime12);
            fake.putExtra("city_name", st.cityNameAr);
            fake.putExtra("mosque_theme", st.mosqueTheme);
            fake.putExtra("target_epoch_ms", System.currentTimeMillis());
            handleAdhanAlarm(context, fake, true);
        } else if ("salawat".equals(type)) {
            handleSalawatAlarm(context, true);
        } else if ("periodic".equals(type)) {
            handlePeriodicReminderAlarm(context, true);
        } else if ("last_third".equals(type)) {
            Intent fake = new Intent(ACTION_LAST_THIRD_ALARM);
            fake.putExtra("target_epoch_ms", System.currentTimeMillis());
            handleLastThirdAlarm(context, fake, true);
        } else if ("iqama".equals(type)) {
            PrayerNotificationHelper.NotificationState st =
                PrayerNotificationHelper.buildNotificationState(context);
            Intent fake = new Intent(ACTION_IQAMA_ALARM);
            fake.putExtra("prayer_key", st.nextPrayerKey);
            fake.putExtra("prayer_name", st.nextPrayerNameAr);
            fake.putExtra("city_name", st.cityNameAr);
            fake.putExtra("mosque_theme", st.mosqueTheme);
            fake.putExtra("target_epoch_ms", System.currentTimeMillis());
            handleIqamaAlarm(context, fake, true);
        } else if ("pre_adhan".equals(type)) {
            PrayerNotificationHelper.NotificationState st =
                PrayerNotificationHelper.buildNotificationState(context);
            Intent fake = new Intent(ACTION_PRE_ADHAN_ALARM);
            fake.putExtra("prayer_key", st.nextPrayerKey);
            fake.putExtra("prayer_name", st.nextPrayerNameAr);
            fake.putExtra("reminder_minutes", 10);
            fake.putExtra("city_name", st.cityNameAr);
            fake.putExtra("mosque_theme", st.mosqueTheme);
            fake.putExtra("target_epoch_ms", System.currentTimeMillis());
            handlePreAdhanAlarm(context, fake, true);
        }
    }

    private static void stopAudioServiceAndAlerts(Context context) {
        try {
            Intent stopIntent = new Intent(context, MihrabAudioService.class);
            stopIntent.setAction(MihrabAudioService.ACTION_STOP);
            context.startService(stopIntent);
        } catch (Exception ignored) {
            // ignore
        }
        PrayerNotificationHelper.cancelAdhanNotification(context);
        PrayerNotificationHelper.cancelSalawatNotification(context);
        PrayerNotificationHelper.cancelPreAdhanNotification(context);
        PrayerNotificationHelper.cancelIqamaNotification(context);
        PrayerNotificationHelper.cancelLastThirdNotification(context);
    }

    private static void handleAdhanAlarm(Context context, Intent intent, boolean isTest) {
        acquireBroadcastHandoffWakeLock(context);
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        JSONObject root = null;
        try {
            if (rawJson != null && !rawJson.isEmpty()) {
                root = new JSONObject(rawJson);
            }
        } catch (Exception ignored) {
            // ignore
        }

        String prayerKey = intent.getStringExtra("prayer_key");
        String prayerNameAr = intent.getStringExtra("prayer_name");
        String prayerTime12 = intent.getStringExtra("prayer_time12");
        String cityNameAr = intent.getStringExtra("city_name");
        String mosqueTheme = intent.getStringExtra("mosque_theme");
        long targetEpochMs = intent.getLongExtra("target_epoch_ms", 0L);

        if (prayerKey == null || prayerKey.isEmpty()) prayerKey = "dhuhr";
        if (prayerNameAr == null || prayerNameAr.isEmpty()) prayerNameAr = "الظهر";
        if (cityNameAr == null || cityNameAr.isEmpty()) cityNameAr = "القاهرة";
        if (mosqueTheme == null || mosqueTheme.isEmpty()) mosqueTheme = "auto";

        if (!isTest) {
            // Deduplicate if alarm + transition fire close together
            SharedPreferences statePrefs = context.getSharedPreferences(
                BackgroundReminderScheduler.STATE_PREFS,
                Context.MODE_PRIVATE
            );
            String dedupeKey = prayerKey + "_" + targetEpochMs;
            String lastFired = statePrefs.getString(KEY_LAST_ADHAN_FIRED_KEY, "");
            if (targetEpochMs > 0L && dedupeKey.equals(lastFired)) {
                PrayerWidgetHelper.updateAllWidgets(context);
                PrayerNotificationHelper.refreshOngoingNotification(context);
                BackgroundReminderScheduler.scheduleAll(context);
                return;
            }
            statePrefs.edit().putString(KEY_LAST_ADHAN_FIRED_KEY, dedupeKey).apply();
        }

        boolean notificationsEnabled = true;
        boolean adhanBannerEnabled = true;
        boolean meetingMode = false;
        boolean fajrBoost = true;
        boolean autoDua = true;
        float volume = 1.0f;
        String adhanAsset = "/audio/adhan-makkah.mp3";
        String fajrAsset = "/audio/adhan-fajr-makkah.mp3";
        String duaAsset = "/audio/dua-shaarawy.mp3";
        String reciterNameAr = "";

        if (root != null) {
            JSONObject notifSettings = root.optJSONObject("notificationSettings");
            if (notifSettings != null) {
                adhanBannerEnabled = notifSettings.optBoolean("adhanBannerEnabled", true);
            }
            JSONObject audio = root.optJSONObject("audioSettings");
            if (audio != null) {
                notificationsEnabled = audio.optBoolean("notificationsEnabled", true);
                meetingMode = audio.optBoolean("meetingModeEnabled", false);
                fajrBoost = audio.optBoolean("fajrBoostVolume", true);
                autoDua = audio.optBoolean("autoDuaAfterAdhan", true);
                volume = (float) audio.optDouble("volume", 1.0);
                adhanAsset = audio.optString("adhanAssetUrl", adhanAsset);
                fajrAsset = audio.optString("fajrAdhanAssetUrl", fajrAsset);
                duaAsset = audio.optString("duaAssetUrl", duaAsset);
                reciterNameAr = "fajr".equals(prayerKey)
                    ? audio.optString("fajrAdhanReciterNameAr", "")
                    : audio.optString("adhanReciterNameAr", "");
            }
        }

        if (!isTest) {
            boolean quietSuppressed = isQuietModeSuppressingPrayer(root, prayerKey, System.currentTimeMillis());
            if (!notificationsEnabled || "sunrise".equals(prayerKey) || quietSuppressed) {
                PrayerWidgetHelper.updateAllWidgets(context);
                PrayerNotificationHelper.refreshOngoingNotification(context);
                BackgroundReminderScheduler.scheduleAll(context);
                return;
            }
        }

        // If user is actively viewing Mihrab right now (not locked/closed), hand off to React FullScreenAdhanModal
        if (!isTest && MainActivity.isAppInForeground) {
            if (adhanBannerEnabled) {
                PrayerNotificationHelper.showAdhanFullScreenNotification(
                    context,
                    prayerKey,
                    prayerNameAr,
                    prayerTime12,
                    cityNameAr,
                    meetingMode ? "وضع الاجتماع نشط (تنبيه صامت)" : reciterNameAr,
                    mosqueTheme,
                    false,
                    false
                );
            }
            MainActivity.dispatchForegroundAdhanEvent(prayerKey, prayerNameAr);
            PrayerWidgetHelper.updateAllWidgets(context);
            PrayerNotificationHelper.refreshOngoingNotification(context);
            BackgroundReminderScheduler.scheduleAll(context);
            return;
        }

        if (meetingMode && !isTest) {
            triggerGentleVibration(context);
            PrayerNotificationHelper.showAdhanFullScreenNotification(
                context,
                prayerKey,
                prayerNameAr,
                prayerTime12,
                cityNameAr,
                "وضع الاجتماع نشط (تنبيه صامت)",
                mosqueTheme,
                false,
                false
            );
        } else {
            boolean isFajr = "fajr".equals(prayerKey);
            String chosenAsset = isFajr ? fajrAsset : adhanAsset;
            String fallbackAsset = isFajr ? "/audio/adhan-fajr-makkah.mp3" : "/audio/adhan-makkah.mp3";
            float effectiveVol = (isFajr && fajrBoost) ? 1.0f : volume;

            Intent serviceIntent = new Intent(context, MihrabAudioService.class);
            serviceIntent.setAction(MihrabAudioService.ACTION_PLAY_ADHAN);
            serviceIntent.putExtra("prayer_key", prayerKey);
            serviceIntent.putExtra("prayer_name", isTest ? ("معاينة " + prayerNameAr) : prayerNameAr);
            serviceIntent.putExtra("prayer_time12", prayerTime12);
            serviceIntent.putExtra("city_name", cityNameAr);
            serviceIntent.putExtra("reciter_name", reciterNameAr);
            serviceIntent.putExtra("mosque_theme", mosqueTheme);
            serviceIntent.putExtra("asset_path", chosenAsset);
            serviceIntent.putExtra("fallback_asset_path", fallbackAsset);
            serviceIntent.putExtra("dua_asset_path", duaAsset);
            serviceIntent.putExtra("auto_dua", autoDua);
            serviceIntent.putExtra("volume", effectiveVol);
            serviceIntent.putExtra("use_fullscreen_intent", true);

            try {
                ContextCompat.startForegroundService(context, serviceIntent);
            } catch (Exception ignored) {
                triggerGentleVibration(context);
                PrayerNotificationHelper.showAdhanFullScreenNotification(
                    context,
                    prayerKey,
                    prayerNameAr,
                    prayerTime12,
                    cityNameAr,
                    reciterNameAr,
                    mosqueTheme,
                    true,
                    isTest
                );
            }

            // If testing directly or overlay permission allows background activity start, bring AdhanAlarmActivity forward
            if (isTest || WidgetBridgePlugin.canDrawOverlays(context)) {
                try {
                    Intent fullIntent = new Intent(context, AdhanAlarmActivity.class);
                    fullIntent.putExtra("prayer_key", prayerKey);
                    fullIntent.putExtra("prayer_name", isTest ? ("معاينة " + prayerNameAr) : prayerNameAr);
                    fullIntent.putExtra("prayer_time12", prayerTime12);
                    fullIntent.putExtra("city_name", cityNameAr);
                    fullIntent.putExtra("reciter_name", reciterNameAr);
                    fullIntent.putExtra("mosque_theme", mosqueTheme);
                    fullIntent.addFlags(
                        Intent.FLAG_ACTIVITY_NEW_TASK
                            | Intent.FLAG_ACTIVITY_SINGLE_TOP
                            | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    );
                    context.startActivity(fullIntent);
                } catch (Exception ignored) {
                    // fullScreenIntent / heads-up notification will still present it cleanly
                }
            }
        }

        if (!isTest) {
            PrayerWidgetHelper.updateAllWidgets(context);
            PrayerNotificationHelper.refreshOngoingNotification(context);
            BackgroundReminderScheduler.scheduleAll(context);
        }
    }

    private static void handleSalawatAlarm(Context context, boolean isTest) {
        acquireBroadcastHandoffWakeLock(context);
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        JSONObject root = null;
        try {
            if (rawJson != null && !rawJson.isEmpty()) {
                root = new JSONObject(rawJson);
            }
        } catch (Exception ignored) {
            // ignore
        }

        boolean enabled = true;
        boolean meetingMode = false;
        String voiceMode = "rotate";
        float volume = 0.9f;

        if (root != null) {
            JSONObject bg = root.optJSONObject("backgroundReminders");
            if (bg != null) {
                enabled = bg.optBoolean("salawatEnabled", true);
                voiceMode = bg.optString("salawatVoiceMode", "rotate");
            }
            JSONObject audio = root.optJSONObject("audioSettings");
            if (audio != null) {
                meetingMode = audio.optBoolean("meetingModeEnabled", false);
                volume = (float) audio.optDouble("volume", 0.9);
            }
        }

        if (!isTest) {
            BackgroundReminderScheduler.scheduleNextSalawat(context);
        }

        if (!isTest && (!enabled || meetingMode || isQuietModeSuppressingGeneral(root, System.currentTimeMillis()))) {
            return;
        }

        // If user is currently actively looking inside Mihrab, React handles the in-app Salawat voice & toast
        if (!isTest && MainActivity.isAppInForeground) {
            return;
        }

        SalawatPreset preset = resolveSalawatPreset(context, voiceMode);
        Intent serviceIntent = new Intent(context, MihrabAudioService.class);
        serviceIntent.setAction(MihrabAudioService.ACTION_PLAY_SALAWAT);
        serviceIntent.putExtra("sheikh_name", preset.sheikhNameAr);
        serviceIntent.putExtra("formula_text", preset.formulaAr);
        serviceIntent.putExtra("asset_path", preset.assetPath);
        serviceIntent.putExtra("fallback_asset_path", "/audio/salawat-mishary.mp3");
        serviceIntent.putExtra("volume", volume);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception ignored) {
            // fallback to posting visual notification if foreground service blocked
            PrayerNotificationHelper.showSalawatNotification(
                context,
                preset.sheikhNameAr,
                preset.formulaAr
            );
        }
    }

    private static void handlePeriodicReminderAlarm(Context context, boolean isTest) {
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        JSONObject root = null;
        try {
            if (rawJson != null && !rawJson.isEmpty()) {
                root = new JSONObject(rawJson);
            }
        } catch (Exception ignored) {
            // ignore
        }

        if (!isTest) {
            BackgroundReminderScheduler.scheduleNextPeriodicReminder(context);
        }

        boolean enabled = true;
        boolean overlayEnabled = true;
        boolean soundEnabled = false;
        boolean meetingMode = false;
        String contentType = "both";
        JSONArray pool = null;
        if (root != null) {
            JSONObject bg = root.optJSONObject("backgroundReminders");
            if (bg != null) {
                enabled = bg.optBoolean("periodicReminderEnabled", true);
                contentType = bg.optString("periodicReminderContentType", "both");
                overlayEnabled = bg.optBoolean("periodicOverlayEnabled", true);
                soundEnabled = bg.optBoolean("periodicReminderSoundEnabled", false);
                pool = bg.optJSONArray("periodicPool");
            }
            JSONObject audio = root.optJSONObject("audioSettings");
            if (audio != null) {
                meetingMode = audio.optBoolean("meetingModeEnabled", false);
            }
        }

        if (!isTest && !enabled) return;
        if (!isTest && isQuietModeSuppressingGeneral(root, System.currentTimeMillis())) return;
        if (!isTest && BackgroundReminderScheduler.isNowWithinPeriodicQuietHours(context)) return;
        if (!isTest && MainActivity.isAppInForeground) return;

        boolean effectiveSound = soundEnabled && !meetingMode;
        JSONObject picked = pickPeriodicItem(context, pool, contentType, null);
        String itemId = picked.optString("id", "verse_1");
        String itemType = picked.optString("type", "quran");
        String text = picked.optString("text", "﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾");
        String source = picked.optString("source", "سورة الرعد • الآية ٢٨");
        String reflection = picked.optString("reflection", "");

        boolean canShowFloatingOverlay =
            overlayEnabled
                && WidgetBridgePlugin.canDrawOverlays(context)
                && (isTest || isDeviceUnlockedAndInteractive(context));

        if (canShowFloatingOverlay) {
            try {
                Intent overlayIntent = new Intent(context, PeriodicOverlayService.class);
                overlayIntent.setAction(PeriodicOverlayService.ACTION_SHOW_PERIODIC_OVERLAY);
                overlayIntent.putExtra("item_id", itemId);
                overlayIntent.putExtra("item_type", itemType);
                overlayIntent.putExtra("item_text", text);
                overlayIntent.putExtra("item_source", source);
                overlayIntent.putExtra("item_reflection", reflection);
                overlayIntent.putExtra("content_type", contentType);
                overlayIntent.putExtra("sound_enabled", effectiveSound);
                context.startService(overlayIntent);
                return;
            } catch (Exception ignored) {
                // Fall back to expandable notification if background service start restricted on OEM
            }
        }

        PrayerNotificationHelper.showPeriodicReminderNotification(
            context,
            itemId,
            itemType,
            text,
            source,
            reflection,
            effectiveSound
        );
    }

    private static boolean isDeviceUnlockedAndInteractive(Context context) {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null && !pm.isInteractive()) {
                return false;
            }
            KeyguardManager km = (KeyguardManager) context.getSystemService(Context.KEYGUARD_SERVICE);
            if (km != null && km.isKeyguardLocked()) {
                return false;
            }
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    public static JSONObject pickPeriodicItem(
        Context context,
        JSONArray pool,
        String contentType,
        String excludeId
    ) {
        SharedPreferences state = context.getSharedPreferences(
            BackgroundReminderScheduler.STATE_PREFS,
            Context.MODE_PRIVATE
        );
        String lastId = (excludeId != null && !excludeId.isEmpty())
            ? excludeId
            : state.getString(KEY_LAST_PERIODIC_ID, "");

        List<JSONObject> matching = new ArrayList<>();
        if (pool != null) {
            for (int i = 0; i < pool.length(); i++) {
                JSONObject obj = pool.optJSONObject(i);
                if (obj == null) continue;
                String t = obj.optString("type", "quran");
                if ("both".equals(contentType) || contentType.equals(t)) {
                    matching.add(obj);
                }
            }
        }

        if (matching.isEmpty() && pool != null) {
            for (int i = 0; i < pool.length(); i++) {
                JSONObject obj = pool.optJSONObject(i);
                if (obj != null) matching.add(obj);
            }
        }

        if (matching.isEmpty()) {
            JSONObject fallback = new JSONObject();
            try {
                fallback.put("id", "verse_1");
                fallback.put("type", "quran");
                fallback.put("text", "﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾");
                fallback.put("source", "سورة الرعد • الآية ٢٨");
                fallback.put("reflection", "سكينة القلب وانشراح الصدر لا يُنال إلا بدوام ذكر الله.");
            } catch (Exception ignored) {
                // ignore
            }
            return fallback;
        }

        List<JSONObject> candidates = new ArrayList<>();
        for (JSONObject item : matching) {
            if (!lastId.equals(item.optString("id", ""))) {
                candidates.add(item);
            }
        }
        if (candidates.isEmpty()) {
            candidates = matching;
        }

        JSONObject chosen = candidates.get(new Random().nextInt(candidates.size()));
        state.edit().putString(KEY_LAST_PERIODIC_ID, chosen.optString("id", "")).apply();
        return chosen;
    }

    private static final SalawatPreset[] PRE_ADHAN_PRESETS = new SalawatPreset[] {
        new SalawatPreset("mishary", "الشيخ مشاري راشد العفاسي", "", "/audio/prayer-alert-mishary.mp3"),
        new SalawatPreset("dosari", "الشيخ ياسر الدوسري", "", "/audio/prayer-alert-dosari.mp3"),
        new SalawatPreset("muaiqly", "الشيخ ماهر المعيقلي", "", "/audio/prayer-alert-muaiqly.mp3"),
        new SalawatPreset("minshawi", "الشيخ محمد صديق المنشاوي", "", "/audio/prayer-alert-minshawi.mp3"),
        new SalawatPreset("abdulbasit", "الشيخ عبد الباسط عبد الصمد", "", "/audio/prayer-alert-abdulbasit.mp3"),
        new SalawatPreset("qatami", "الشيخ ناصر القطامي", "", "/audio/prayer-alert-qatami.mp3"),
    };

    private static final SalawatPreset[] IQAMA_PRESETS = new SalawatPreset[] {
        new SalawatPreset("basnawi", "الشيخ أحمد بصنوي (الحرم المكي)", "", "/audio/iqama-basnawi.mp3"),
        new SalawatPreset("hadrawi", "الشيخ فاروق حضراوي (الحرم المكي)", "", "/audio/iqama-hadrawi.mp3"),
        new SalawatPreset("majed_abbas", "الشيخ ماجد العباس (الحرم المكي)", "", "/audio/iqama-majed-abbas.mp3"),
        new SalawatPreset("madinah_haram", "إقامة المسجد النبوي الشريف", "", "/audio/iqama-madinah.m4a"),
        new SalawatPreset("faisal_labban", "الشيخ فيصل اللبان", "", "/audio/iqama-faisal-labban.mp3"),
        new SalawatPreset("makkah_classic", "إقامة الحرمين المأثورة", "", "/audio/iqama-classic.mp3"),
    };

    private static void handlePreAdhanAlarm(Context context, Intent intent, boolean isTest) {
        acquireBroadcastHandoffWakeLock(context);
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        JSONObject root = null;
        try {
            if (rawJson != null && !rawJson.isEmpty()) {
                root = new JSONObject(rawJson);
            }
        } catch (Exception ignored) {
            // ignore
        }

        long targetEpochMs = intent.getLongExtra("target_epoch_ms", 0L);
        if (!isTest) {
            BackgroundReminderScheduler.scheduleNextPreAdhanAfter(context, targetEpochMs);
        }

        String prayerKey = intent.getStringExtra("prayer_key");
        String prayerNameAr = intent.getStringExtra("prayer_name");
        int reminderMins = intent.getIntExtra("reminder_minutes", 10);
        String cityNameAr = intent.getStringExtra("city_name");

        if (prayerKey == null || prayerKey.isEmpty()) prayerKey = "dhuhr";
        if (prayerNameAr == null || prayerNameAr.isEmpty()) prayerNameAr = "الصلاة";
        if (cityNameAr == null || cityNameAr.isEmpty()) cityNameAr = "القاهرة";

        if (!isTest) {
            SharedPreferences statePrefs = context.getSharedPreferences(
                BackgroundReminderScheduler.STATE_PREFS,
                Context.MODE_PRIVATE
            );
            String dedupeKey = prayerKey + "_" + targetEpochMs;
            if (targetEpochMs > 0L && dedupeKey.equals(statePrefs.getString(KEY_LAST_PRE_ADHAN_FIRED_KEY, ""))) {
                return;
            }
            statePrefs.edit().putString(KEY_LAST_PRE_ADHAN_FIRED_KEY, dedupeKey).apply();
        }

        boolean notificationsEnabled = true;
        boolean meetingMode = false;
        boolean soundEnabled = true;
        String voiceMode = "rotate";
        float volume = 1.0f;

        if (root != null) {
            JSONObject audio = root.optJSONObject("audioSettings");
            if (audio != null) {
                notificationsEnabled = audio.optBoolean("notificationsEnabled", true);
                meetingMode = audio.optBoolean("meetingModeEnabled", false);
                volume = (float) audio.optDouble("volume", 1.0);
            }
            JSONObject preAdhan = root.optJSONObject("preAdhanSettings");
            if (preAdhan != null) {
                soundEnabled = preAdhan.optBoolean("soundEnabled", true);
                voiceMode = preAdhan.optString("voiceMode", "rotate");
            }
        }

        if (
            !isTest
                && (
                    (!notificationsEnabled && !soundEnabled)
                        || isQuietModeSuppressingPrayer(root, prayerKey, System.currentTimeMillis())
                )
        ) {
            return;
        }

        if (!isTest && MainActivity.isAppInForeground) {
            return;
        }

        SalawatPreset preset = resolveRotatingPreset(
            context,
            voiceMode,
            PRE_ADHAN_PRESETS,
            KEY_PRE_ADHAN_ROTATE_IDX
        );

        if ((meetingMode || !soundEnabled) && !isTest) {
            if (meetingMode) {
                triggerGentleVibration(context);
            }
            if (notificationsEnabled) {
                PrayerNotificationHelper.showPreAdhanNotification(
                    context,
                    prayerNameAr,
                    reminderMins,
                    cityNameAr,
                    meetingMode ? "وضع الاجتماع الصامت" : ""
                );
            }
            return;
        }

        Intent serviceIntent = new Intent(context, MihrabAudioService.class);
        serviceIntent.setAction(MihrabAudioService.ACTION_PLAY_PRE_ADHAN);
        serviceIntent.putExtra("prayer_name", prayerNameAr);
        serviceIntent.putExtra("reminder_minutes", reminderMins);
        serviceIntent.putExtra("city_name", cityNameAr);
        serviceIntent.putExtra("sheikh_name", preset.sheikhNameAr);
        serviceIntent.putExtra("asset_path", preset.assetPath);
        serviceIntent.putExtra("fallback_asset_path", "/audio/prayer-alert-mishary.mp3");
        serviceIntent.putExtra("volume", volume);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception ignored) {
            triggerGentleVibration(context);
            if (notificationsEnabled || isTest) {
                PrayerNotificationHelper.showPreAdhanNotification(
                    context,
                    prayerNameAr,
                    reminderMins,
                    cityNameAr,
                    preset.sheikhNameAr
                );
            }
        }
    }

    private static void handleIqamaAlarm(Context context, Intent intent, boolean isTest) {
        acquireBroadcastHandoffWakeLock(context);
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        JSONObject root = null;
        try {
            if (rawJson != null && !rawJson.isEmpty()) {
                root = new JSONObject(rawJson);
            }
        } catch (Exception ignored) {
            // ignore
        }

        if (!isTest) {
            BackgroundReminderScheduler.scheduleNextIqama(context);
        }

        String prayerKey = intent.getStringExtra("prayer_key");
        String prayerNameAr = intent.getStringExtra("prayer_name");
        String cityNameAr = intent.getStringExtra("city_name");
        String mosqueTheme = intent.getStringExtra("mosque_theme");
        long targetEpochMs = intent.getLongExtra("target_epoch_ms", 0L);

        if (prayerKey == null || prayerKey.isEmpty()) prayerKey = "dhuhr";
        if (prayerNameAr == null || prayerNameAr.isEmpty()) prayerNameAr = "الصلاة";
        if (cityNameAr == null || cityNameAr.isEmpty()) cityNameAr = "القاهرة";
        if (mosqueTheme == null || mosqueTheme.isEmpty()) mosqueTheme = "auto";

        if (!isTest) {
            SharedPreferences statePrefs = context.getSharedPreferences(
                BackgroundReminderScheduler.STATE_PREFS,
                Context.MODE_PRIVATE
            );
            String dedupeKey = prayerKey + "_" + targetEpochMs;
            if (targetEpochMs > 0L && dedupeKey.equals(statePrefs.getString(KEY_LAST_IQAMA_FIRED_KEY, ""))) {
                return;
            }
            statePrefs.edit().putString(KEY_LAST_IQAMA_FIRED_KEY, dedupeKey).apply();
        }

        boolean notificationsEnabled = true;
        boolean meetingMode = false;
        boolean autoPlayEnabled = true;
        String voiceMode = "rotate";
        float volume = 1.0f;

        if (root != null) {
            JSONObject audio = root.optJSONObject("audioSettings");
            if (audio != null) {
                notificationsEnabled = audio.optBoolean("notificationsEnabled", true);
                meetingMode = audio.optBoolean("meetingModeEnabled", false);
                volume = (float) audio.optDouble("volume", 1.0);
            }
            JSONObject iqama = root.optJSONObject("iqamaSettings");
            if (iqama != null) {
                autoPlayEnabled = iqama.optBoolean("autoPlayEnabled", true);
                voiceMode = iqama.optString("voiceMode", "rotate");
            }
        }

        if (
            !isTest
                && (
                    (!notificationsEnabled && !autoPlayEnabled)
                        || isQuietModeSuppressingPrayer(root, prayerKey, System.currentTimeMillis())
                )
        ) {
            return;
        }

        if (!isTest && MainActivity.isAppInForeground) {
            return;
        }

        SalawatPreset preset = resolveRotatingPreset(
            context,
            voiceMode,
            IQAMA_PRESETS,
            KEY_IQAMA_ROTATE_IDX
        );

        if ((meetingMode || !autoPlayEnabled) && !isTest) {
            if (meetingMode) {
                triggerGentleVibration(context);
            }
            if (notificationsEnabled && PrayerNotificationHelper.hasNotificationPermission(context)) {
                PrayerNotificationHelper.cancelIqamaNotification(context);
                androidx.core.app.NotificationManagerCompat.from(context).notify(
                    PrayerNotificationHelper.IQAMA_NOTIFICATION_ID,
                    PrayerNotificationHelper.buildIqamaNotification(
                        context,
                        prayerKey,
                        prayerNameAr,
                        cityNameAr,
                        meetingMode ? "وضع الاجتماع الصامت" : "",
                        mosqueTheme
                    )
                );
            }
            return;
        }

        Intent serviceIntent = new Intent(context, MihrabAudioService.class);
        serviceIntent.setAction(MihrabAudioService.ACTION_PLAY_IQAMA);
        serviceIntent.putExtra("prayer_key", prayerKey);
        serviceIntent.putExtra("prayer_name", isTest ? ("معاينة " + prayerNameAr) : prayerNameAr);
        serviceIntent.putExtra("city_name", cityNameAr);
        serviceIntent.putExtra("sheikh_name", preset.sheikhNameAr);
        serviceIntent.putExtra("mosque_theme", mosqueTheme);
        serviceIntent.putExtra("asset_path", preset.assetPath);
        serviceIntent.putExtra("fallback_asset_path", "/audio/iqama-classic.mp3");
        serviceIntent.putExtra("volume", volume);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception ignored) {
            triggerGentleVibration(context);
            if ((notificationsEnabled || isTest) && PrayerNotificationHelper.hasNotificationPermission(context)) {
                PrayerNotificationHelper.cancelIqamaNotification(context);
                androidx.core.app.NotificationManagerCompat.from(context).notify(
                    PrayerNotificationHelper.IQAMA_NOTIFICATION_ID,
                    PrayerNotificationHelper.buildIqamaNotification(
                        context,
                        prayerKey,
                        isTest ? ("معاينة " + prayerNameAr) : prayerNameAr,
                        cityNameAr,
                        preset.sheikhNameAr,
                        mosqueTheme
                    )
                );
            }
        }
    }

    private static void handleLastThirdAlarm(Context context, Intent intent, boolean isTest) {
        acquireBroadcastHandoffWakeLock(context);
        SharedPreferences widgetPrefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        JSONObject root = null;
        try {
            if (rawJson != null && !rawJson.isEmpty()) {
                root = new JSONObject(rawJson);
            }
        } catch (Exception ignored) {
            // ignore
        }

        if (!isTest) {
            BackgroundReminderScheduler.scheduleNextLastThird(context);
        }

        long targetEpochMs = intent.getLongExtra("target_epoch_ms", 0L);
        String fajrTime12 = intent.getStringExtra("fajr_time12");
        if (!isTest && targetEpochMs > 0L) {
            SharedPreferences statePrefs = context.getSharedPreferences(
                BackgroundReminderScheduler.STATE_PREFS,
                Context.MODE_PRIVATE
            );
            String dedupeKey = "last_third_" + targetEpochMs;
            if (dedupeKey.equals(statePrefs.getString(KEY_LAST_THIRD_FIRED_KEY, ""))) {
                return;
            }
            statePrefs.edit().putString(KEY_LAST_THIRD_FIRED_KEY, dedupeKey).apply();
        }

        boolean enabled = true;
        boolean notificationsEnabled = true;
        boolean meetingMode = false;
        float volume = 0.95f;

        String verseText = "﴿ تَتَجَافَىٰ جُنُوبُهُمْ عَنِ الْمَضَاجِعِ يَدْعُونَ رَبَّهُمْ خَوْفًا وَطَمَعًا وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ ﴾";
        String verseSurah = "سورة السجدة • الآية ١٦";
        String reciterNameAr = "الشيخ ناصر القطامي";
        String[] assetPaths = new String[] { "/audio/qiyam/qatami/032016.mp3" };
        String fallbackAsset = "/audio/qiyam/qatami/032016.mp3";

        if (root != null) {
            JSONObject audio = root.optJSONObject("audioSettings");
            if (audio != null) {
                notificationsEnabled = audio.optBoolean("notificationsEnabled", true);
                meetingMode = audio.optBoolean("meetingModeEnabled", false);
                volume = (float) audio.optDouble("volume", 0.95);
            }
            JSONObject lastThird = root.optJSONObject("lastThirdSettings");
            if (lastThird != null) {
                enabled = lastThird.optBoolean("enabled", true);
                String tVerse = lastThird.optString("verseText", "");
                if (!tVerse.isEmpty()) verseText = tVerse;
                String tSurah = lastThird.optString("verseSurah", "");
                if (!tSurah.isEmpty()) verseSurah = tSurah;
                String tReciter = lastThird.optString("reciterNameAr", "");
                if (!tReciter.isEmpty()) reciterNameAr = tReciter;
                String tFallback = lastThird.optString("fallbackAssetPath", "");
                if (!tFallback.isEmpty()) fallbackAsset = tFallback;
                JSONArray pathsJson = lastThird.optJSONArray("verseAssetPaths");
                if (pathsJson != null && pathsJson.length() > 0) {
                    List<String> list = new ArrayList<>();
                    for (int i = 0; i < pathsJson.length(); i++) {
                        String p = pathsJson.optString(i, "");
                        if (!p.isEmpty()) list.add(p);
                    }
                    if (!list.isEmpty()) {
                        assetPaths = list.toArray(new String[0]);
                    }
                }
            }
        }

        if (!isTest && (!enabled || isQuietModeSuppressingGeneral(root, System.currentTimeMillis()))) {
            return;
        }

        // If user is already inside Mihrab right now (and not testing background behavior), let React show toast & audio cleanly
        if (!isTest && MainActivity.isAppInForeground) {
            if (notificationsEnabled) {
                PrayerNotificationHelper.showLastThirdNotification(
                    context,
                    verseText,
                    verseSurah,
                    reciterNameAr,
                    fajrTime12
                );
            }
            return;
        }

        if (meetingMode && !isTest) {
            triggerGentleVibration(context);
            if (notificationsEnabled) {
                PrayerNotificationHelper.showLastThirdNotification(
                    context,
                    verseText,
                    verseSurah,
                    "وضع الاجتماع الصامت",
                    fajrTime12
                );
            }
            return;
        }

        Intent serviceIntent = new Intent(context, MihrabAudioService.class);
        serviceIntent.setAction(MihrabAudioService.ACTION_PLAY_LAST_THIRD_VERSE);
        serviceIntent.putExtra("verse_text", verseText);
        serviceIntent.putExtra("verse_surah", verseSurah);
        serviceIntent.putExtra("reciter_name", reciterNameAr);
        serviceIntent.putExtra("fajr_time12", fajrTime12 != null ? fajrTime12 : "");
        serviceIntent.putExtra("asset_paths", assetPaths);
        serviceIntent.putExtra("asset_path", assetPaths[0]);
        serviceIntent.putExtra("fallback_asset_path", fallbackAsset);
        serviceIntent.putExtra("volume", volume);

        try {
            ContextCompat.startForegroundService(context, serviceIntent);
        } catch (Exception ignored) {
            if (notificationsEnabled || isTest) {
                PrayerNotificationHelper.showLastThirdNotification(
                    context,
                    verseText,
                    verseSurah,
                    reciterNameAr,
                    fajrTime12
                );
            }
        }
    }

    private static boolean isQuietNow(JSONObject quietMode, long nowMs) {
        if (quietMode == null) return false;
        if (quietMode.optBoolean("manualActive", false)) return true;
        long pauseUntilMs = quietMode.optLong("pauseUntilMs", 0L);
        if (pauseUntilMs > nowMs) return true;
        JSONArray schedules = quietMode.optJSONArray("schedules");
        if (schedules != null) {
            Calendar cal = Calendar.getInstance();
            cal.setTimeInMillis(nowMs);
            int nowMin = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
            for (int i = 0; i < schedules.length(); i++) {
                JSONObject slot = schedules.optJSONObject(i);
                if (slot == null || !slot.optBoolean("enabled", false)) continue;
                int startMin = parseQuietHHmm(slot.optString("startTime", "23:00"), 23 * 60);
                int endMin = parseQuietHHmm(slot.optString("endTime", "06:00"), 6 * 60);
                if (startMin == endMin) return true;
                if (startMin < endMin) {
                    if (nowMin >= startMin && nowMin < endMin) return true;
                } else {
                    if (nowMin >= startMin || nowMin < endMin) return true;
                }
            }
        }
        return false;
    }

    private static int parseQuietHHmm(String hhmm, int fallback) {
        if (hhmm == null || !hhmm.contains(":")) return fallback;
        try {
            String[] parts = hhmm.trim().split(":");
            int h = Math.max(0, Math.min(23, Integer.parseInt(parts[0])));
            int m = Math.max(0, Math.min(59, Integer.parseInt(parts[1])));
            return h * 60 + m;
        } catch (Exception e) {
            return fallback;
        }
    }

    private static boolean isQuietModeSuppressingGeneral(JSONObject root, long nowMs) {
        if (root == null) return false;
        JSONObject quietMode = root.optJSONObject("quietMode");
        return isQuietNow(quietMode, nowMs);
    }

    private static boolean isQuietModeSuppressingPrayer(JSONObject root, String prayerKey, long nowMs) {
        if (root == null) return false;
        JSONObject quietMode = root.optJSONObject("quietMode");
        if (!isQuietNow(quietMode, nowMs)) return false;
        String policy = quietMode != null ? quietMode.optString("exceptionPolicy", "fajr_only") : "fajr_only";
        if ("all_adhan".equals(policy)) {
            return "sunrise".equals(prayerKey);
        }
        if ("fajr_only".equals(policy)) {
            return !"fajr".equals(prayerKey);
        }
        return true;
    }

    private static SalawatPreset resolveRotatingPreset(
        Context context,
        String voiceMode,
        SalawatPreset[] presets,
        String prefsKey
    ) {
        if (voiceMode != null && !"rotate".equals(voiceMode)) {
            for (SalawatPreset preset : presets) {
                if (preset.id.equals(voiceMode)) {
                    return preset;
                }
            }
        }
        SharedPreferences state = context.getSharedPreferences(
            BackgroundReminderScheduler.STATE_PREFS,
            Context.MODE_PRIVATE
        );
        int idx = state.getInt(prefsKey, 0);
        SalawatPreset chosen = presets[Math.abs(idx) % presets.length];
        state.edit().putInt(prefsKey, (idx + 1) % presets.length).apply();
        return chosen;
    }

    private static SalawatPreset resolveSalawatPreset(Context context, String voiceMode) {
        return resolveRotatingPreset(context, voiceMode, SALAWAT_PRESETS, KEY_SALAWAT_ROTATE_IDX);
    }

    private static void acquireBroadcastHandoffWakeLock(Context context) {
        try {
            PowerManager pm = (PowerManager) context.getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                PowerManager.WakeLock wl = pm.newWakeLock(
                    PowerManager.PARTIAL_WAKE_LOCK,
                    "mihrab:alarm_handoff"
                );
                wl.setReferenceCounted(false);
                wl.acquire(8_000L);
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static void triggerGentleVibration(Context context) {
        try {
            Vibrator v = (Vibrator) context.getSystemService(Context.VIBRATOR_SERVICE);
            if (v == null || !v.hasVibrator()) return;
            long[] pattern = new long[] { 0, 300, 150, 300 };
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                v.vibrate(VibrationEffect.createWaveform(pattern, -1));
            } else {
                v.vibrate(pattern, -1);
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private static final class SalawatPreset {
        final String id;
        final String sheikhNameAr;
        final String formulaAr;
        final String assetPath;

        SalawatPreset(String id, String sheikhNameAr, String formulaAr, String assetPath) {
            this.id = id;
            this.sheikhNameAr = sheikhNameAr;
            this.formulaAr = formulaAr;
            this.assetPath = assetPath;
        }
    }
}
