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
import java.util.List;
import java.util.Random;
import org.json.JSONArray;
import org.json.JSONObject;

public class BackgroundAlarmReceiver extends BroadcastReceiver {
    public static final String ACTION_EXACT_ADHAN_ALARM = "com.almawaqeet.mihrab.ACTION_EXACT_ADHAN_ALARM";
    public static final String ACTION_SALAWAT_ALARM = "com.almawaqeet.mihrab.ACTION_SALAWAT_ALARM";
    public static final String ACTION_PERIODIC_REMINDER_ALARM = "com.almawaqeet.mihrab.ACTION_PERIODIC_REMINDER_ALARM";
    public static final String ACTION_STOP_AUDIO_SERVICE = "com.almawaqeet.mihrab.ACTION_STOP_AUDIO_SERVICE";

    private static final String KEY_SALAWAT_ROTATE_IDX = "salawat_rotate_idx";
    private static final String KEY_LAST_PERIODIC_ID = "last_periodic_id";
    private static final String KEY_LAST_ADHAN_FIRED_KEY = "last_adhan_fired_epoch_key";

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

        if (ACTION_SALAWAT_ALARM.equals(action)) {
            handleSalawatAlarm(context, false);
            return;
        }

        if (ACTION_PERIODIC_REMINDER_ALARM.equals(action)) {
            handlePeriodicReminderAlarm(context, false);
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
    }

    private static void handleAdhanAlarm(Context context, Intent intent, boolean isTest) {
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
        boolean meetingMode = false;
        boolean fajrBoost = true;
        boolean autoDua = true;
        float volume = 1.0f;
        String adhanAsset = "/audio/adhan-makkah.mp3";
        String fajrAsset = "/audio/adhan-fajr-makkah.mp3";
        String duaAsset = "/audio/dua-shaarawy.mp3";
        String reciterNameAr = "";

        if (root != null) {
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

        if (!isTest && (!notificationsEnabled || "sunrise".equals(prayerKey))) {
            PrayerWidgetHelper.updateAllWidgets(context);
            PrayerNotificationHelper.refreshOngoingNotification(context);
            BackgroundReminderScheduler.scheduleAll(context);
            return;
        }

        // If user is actively viewing Mihrab right now (not locked/closed), hand off to React FullScreenAdhanModal
        if (!isTest && MainActivity.isAppInForeground) {
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

            // If testing directly or device screen is unlocked/interactive, also bring AdhanAlarmActivity forward cleanly
            if (isTest) {
                try {
                    Intent fullIntent = new Intent(context, AdhanAlarmActivity.class);
                    fullIntent.putExtra("prayer_key", prayerKey);
                    fullIntent.putExtra("prayer_name", prayerNameAr);
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
                    // fullScreenIntent notification will still present it cleanly
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

        if (!isTest && (!enabled || meetingMode)) {
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
            if (PrayerNotificationHelper.hasNotificationPermission(context)) {
                androidx.core.app.NotificationManagerCompat.from(context).notify(
                    PrayerNotificationHelper.SALAWAT_NOTIFICATION_ID,
                    PrayerNotificationHelper.buildSalawatNotification(
                        context,
                        preset.sheikhNameAr,
                        preset.formulaAr
                    )
                );
            }
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

    private static SalawatPreset resolveSalawatPreset(Context context, String voiceMode) {
        if (voiceMode != null && !"rotate".equals(voiceMode)) {
            for (SalawatPreset preset : SALAWAT_PRESETS) {
                if (preset.id.equals(voiceMode)) {
                    return preset;
                }
            }
        }
        SharedPreferences state = context.getSharedPreferences(
            BackgroundReminderScheduler.STATE_PREFS,
            Context.MODE_PRIVATE
        );
        int idx = state.getInt(KEY_SALAWAT_ROTATE_IDX, 0);
        SalawatPreset chosen = SALAWAT_PRESETS[Math.abs(idx) % SALAWAT_PRESETS.length];
        state.edit().putInt(KEY_SALAWAT_ROTATE_IDX, (idx + 1) % SALAWAT_PRESETS.length).apply();
        return chosen;
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
