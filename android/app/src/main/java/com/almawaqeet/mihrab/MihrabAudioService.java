package com.almawaqeet.mihrab;

import android.app.Notification;
import android.app.Service;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ServiceInfo;
import android.content.res.AssetFileDescriptor;
import android.media.AudioAttributes;
import android.media.AudioManager;
import android.media.MediaPlayer;
import android.os.Build;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.os.PowerManager;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.app.ServiceCompat;

public class MihrabAudioService extends Service {
    public static final String ACTION_PLAY_ADHAN = "com.almawaqeet.mihrab.SERVICE_PLAY_ADHAN";
    public static final String ACTION_PLAY_SALAWAT = "com.almawaqeet.mihrab.SERVICE_PLAY_SALAWAT";
    public static final String ACTION_PLAY_PRE_ADHAN = "com.almawaqeet.mihrab.SERVICE_PLAY_PRE_ADHAN";
    public static final String ACTION_PLAY_IQAMA = "com.almawaqeet.mihrab.SERVICE_PLAY_IQAMA";
    public static final String ACTION_PLAY_LAST_THIRD_VERSE = "com.almawaqeet.mihrab.SERVICE_PLAY_LAST_THIRD_VERSE";
    public static final String ACTION_STOP = "com.almawaqeet.mihrab.SERVICE_STOP";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable stopSafetyRunnable;
    private int activePlaybackToken = 0;
    private String currentMode = "";
    private String currentPrayerKey = "dhuhr";
    private String currentPrayerNameAr = "الصلاة";
    private String currentCityNameAr = "مواقيت الصلاة";
    private String currentMosqueTheme = "auto";
    private boolean autoDuaAfterAdhan = false;
    private String pendingDuaAssetPath = "";
    private float currentVolume = 1.0f;

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null || intent.getAction() == null) {
            stopSelfCleanly(false);
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_STOP.equals(action)) {
            stopSelfCleanly(true);
            return START_NOT_STICKY;
        }

        activePlaybackToken++;
        mainHandler.removeCallbacksAndMessages(null);
        stopSafetyRunnable = null;

        if (ACTION_PLAY_ADHAN.equals(action)) {
            currentMode = "adhan";
            String prayerKey = intent.getStringExtra("prayer_key");
            String prayerNameAr = intent.getStringExtra("prayer_name");
            String prayerTime12 = intent.getStringExtra("prayer_time12");
            String cityNameAr = intent.getStringExtra("city_name");
            String reciterNameAr = intent.getStringExtra("reciter_name");
            String mosqueTheme = intent.getStringExtra("mosque_theme");
            boolean useFullScreen = intent.getBooleanExtra("use_fullscreen_intent", true);

            currentPrayerKey = prayerKey != null ? prayerKey : "dhuhr";
            currentPrayerNameAr = prayerNameAr != null ? prayerNameAr : "الصلاة";
            currentCityNameAr = cityNameAr != null ? cityNameAr : "مواقيت الصلاة";
            currentMosqueTheme = mosqueTheme != null ? mosqueTheme : "auto";

            PrayerNotificationHelper.cancelAdhanNotification(this);
            Notification notification = PrayerNotificationHelper.buildAdhanForegroundNotification(
                this,
                currentPrayerKey,
                currentPrayerNameAr,
                prayerTime12 != null ? prayerTime12 : "",
                currentCityNameAr,
                reciterNameAr != null ? reciterNameAr : "",
                currentMosqueTheme,
                useFullScreen
            );
            promoteForeground(PrayerNotificationHelper.ADHAN_ALERT_NOTIFICATION_ID, notification);

            String primaryAsset = intent.getStringExtra("asset_path");
            String fallbackAsset = intent.getStringExtra("fallback_asset_path");
            pendingDuaAssetPath = intent.getStringExtra("dua_asset_path");
            autoDuaAfterAdhan = intent.getBooleanExtra("auto_dua", false);
            currentVolume = Math.max(0.15f, Math.min(1.0f, intent.getFloatExtra("volume", 1.0f)));

            acquireTimedWakeLock(7 * 60 * 1000L);
            scheduleSafetyStop(7 * 60 * 1000L, false);
            playAssetWithFallback(primaryAsset, fallbackAsset, AudioAttributes.USAGE_ALARM, true);
            return START_NOT_STICKY;
        }

        if (ACTION_PLAY_SALAWAT.equals(action)) {
            currentMode = "salawat";
            String sheikhName = intent.getStringExtra("sheikh_name");
            String formulaAr = intent.getStringExtra("formula_text");
            String primaryAsset = intent.getStringExtra("asset_path");
            String fallbackAsset = intent.getStringExtra("fallback_asset_path");
            autoDuaAfterAdhan = false;
            pendingDuaAssetPath = "";
            currentVolume = Math.max(0.15f, Math.min(1.0f, intent.getFloatExtra("volume", 0.9f)));

            PrayerNotificationHelper.cancelSalawatNotification(this);
            Notification notification = PrayerNotificationHelper.buildSalawatNotification(
                this,
                sheikhName,
                formulaAr
            );
            promoteForeground(PrayerNotificationHelper.SALAWAT_NOTIFICATION_ID, notification);

            acquireTimedWakeLock(90 * 1000L);
            scheduleSafetyStop(65 * 1000L, false);
            playAssetWithFallback(primaryAsset, fallbackAsset, AudioAttributes.USAGE_MEDIA, false);
            return START_NOT_STICKY;
        }

        if (ACTION_PLAY_PRE_ADHAN.equals(action)) {
            currentMode = "pre_adhan";
            String prayerNameAr = intent.getStringExtra("prayer_name");
            int reminderMinutes = intent.getIntExtra("reminder_minutes", 10);
            String cityNameAr = intent.getStringExtra("city_name");
            String sheikhName = intent.getStringExtra("sheikh_name");
            String primaryAsset = intent.getStringExtra("asset_path");
            String fallbackAsset = intent.getStringExtra("fallback_asset_path");
            autoDuaAfterAdhan = false;
            pendingDuaAssetPath = "";
            currentVolume = Math.max(0.15f, Math.min(1.0f, intent.getFloatExtra("volume", 1.0f)));

            PrayerNotificationHelper.cancelPreAdhanNotification(this);
            Notification notification = PrayerNotificationHelper.buildPreAdhanNotification(
                this,
                prayerNameAr != null ? prayerNameAr : "الصلاة",
                reminderMinutes,
                cityNameAr != null ? cityNameAr : "مواقيت الصلاة",
                sheikhName != null ? sheikhName : ""
            );
            promoteForeground(PrayerNotificationHelper.PRE_ADHAN_NOTIFICATION_ID, notification);

            acquireTimedWakeLock(90 * 1000L);
            scheduleSafetyStop(65 * 1000L, false);
            playAssetWithFallback(primaryAsset, fallbackAsset, AudioAttributes.USAGE_ALARM, false);
            return START_NOT_STICKY;
        }

        if (ACTION_PLAY_IQAMA.equals(action)) {
            currentMode = "iqama";
            String prayerKey = intent.getStringExtra("prayer_key");
            String prayerNameAr = intent.getStringExtra("prayer_name");
            String cityNameAr = intent.getStringExtra("city_name");
            String sheikhName = intent.getStringExtra("sheikh_name");
            String mosqueTheme = intent.getStringExtra("mosque_theme");
            String primaryAsset = intent.getStringExtra("asset_path");
            String fallbackAsset = intent.getStringExtra("fallback_asset_path");
            autoDuaAfterAdhan = false;
            pendingDuaAssetPath = "";
            currentVolume = Math.max(0.15f, Math.min(1.0f, intent.getFloatExtra("volume", 1.0f)));

            PrayerNotificationHelper.cancelIqamaNotification(this);
            Notification notification = PrayerNotificationHelper.buildIqamaNotification(
                this,
                prayerKey != null ? prayerKey : "dhuhr",
                prayerNameAr != null ? prayerNameAr : "الصلاة",
                cityNameAr != null ? cityNameAr : "مواقيت الصلاة",
                sheikhName != null ? sheikhName : "",
                mosqueTheme != null ? mosqueTheme : "auto"
            );
            promoteForeground(PrayerNotificationHelper.IQAMA_NOTIFICATION_ID, notification);

            acquireTimedWakeLock(2 * 60 * 1000L);
            scheduleSafetyStop(95 * 1000L, false);
            playAssetWithFallback(primaryAsset, fallbackAsset, AudioAttributes.USAGE_ALARM, false);
            return START_NOT_STICKY;
        }

        if (ACTION_PLAY_LAST_THIRD_VERSE.equals(action)) {
            currentMode = "last_third";
            String verseText = intent.getStringExtra("verse_text");
            String surah = intent.getStringExtra("verse_surah");
            String reciterNameAr = intent.getStringExtra("reciter_name");
            String fajrTime12 = intent.getStringExtra("fajr_time12");
            String[] assetPaths = intent.getStringArrayExtra("asset_paths");
            String primaryAsset = intent.getStringExtra("asset_path");
            String fallbackAsset = intent.getStringExtra("fallback_asset_path");
            autoDuaAfterAdhan = false;
            pendingDuaAssetPath = "";
            currentVolume = Math.max(0.15f, Math.min(1.0f, intent.getFloatExtra("volume", 0.95f)));

            PrayerNotificationHelper.cancelLastThirdNotification(this);
            Notification notification = PrayerNotificationHelper.buildLastThirdNotification(
                this,
                verseText,
                surah,
                reciterNameAr,
                fajrTime12
            );
            promoteForeground(PrayerNotificationHelper.LAST_THIRD_NOTIFICATION_ID, notification);

            acquireTimedWakeLock(2 * 60 * 1000L);
            scheduleSafetyStop(110 * 1000L, false);
            if (assetPaths != null && assetPaths.length > 0) {
                playPlaylistWithFallback(assetPaths, 0, fallbackAsset, AudioAttributes.USAGE_ALARM);
            } else {
                playAssetWithFallback(primaryAsset, fallbackAsset, AudioAttributes.USAGE_ALARM, false);
            }
            return START_NOT_STICKY;
        }

        stopSelfCleanly(false);
        return START_NOT_STICKY;
    }

    private void promoteForeground(int notificationId, Notification notification) {
        PrayerNotificationHelper.ensureChannels(this);
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                ServiceCompat.startForeground(
                    this,
                    notificationId,
                    notification,
                    ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PLAYBACK
                );
            } else {
                startForeground(notificationId, notification);
            }
        } catch (Exception e) {
            try {
                startForeground(notificationId, notification);
            } catch (Exception ignored) {
                // ignore
            }
        }
    }

    private void playAssetWithFallback(
        String primaryUrlOrPath,
        String fallbackAssetPath,
        int usage,
        boolean allowAutoDuaOnComplete
    ) {
        releaseMediaPlayer();

        String normalizedPrimary = normalizePublicAssetPath(primaryUrlOrPath);
        String normalizedFallback = normalizePublicAssetPath(fallbackAssetPath);
        if (normalizedFallback == null || normalizedFallback.isEmpty()) {
            normalizedFallback = "public/audio/adhan-makkah.mp3";
        }

        if (tryStartLocalAsset(normalizedPrimary, usage, allowAutoDuaOnComplete, null)) {
            return;
        }

        // Fall back to guaranteed bundled offline MP3
        if (!tryStartLocalAsset(normalizedFallback, usage, allowAutoDuaOnComplete, null)) {
            stopSelfCleanly(false);
        }
    }

    private void playPlaylistWithFallback(
        String[] assetPaths,
        int index,
        String fallbackAssetPath,
        int usage
    ) {
        releaseMediaPlayer();
        if (assetPaths == null || index >= assetPaths.length) {
            stopSelfCleanly(false);
            return;
        }

        String normalized = normalizePublicAssetPath(assetPaths[index]);
        Runnable onCompleteNext = (index + 1 < assetPaths.length)
            ? () -> playPlaylistWithFallback(assetPaths, index + 1, fallbackAssetPath, usage)
            : null;

        if (tryStartLocalAsset(normalized, usage, false, onCompleteNext)) {
            return;
        }

        if (index == 0) {
            String normalizedFallback = normalizePublicAssetPath(fallbackAssetPath);
            if (normalizedFallback == null || normalizedFallback.isEmpty()) {
                normalizedFallback = "public/audio/qiyam/qatami/032016.mp3";
            }
            if (!tryStartLocalAsset(normalizedFallback, usage, false, null)) {
                stopSelfCleanly(false);
            }
        } else {
            stopSelfCleanly(false);
        }
    }

    private boolean tryStartLocalAsset(
        String assetRelativePath,
        int usage,
        boolean allowAutoDuaOnComplete,
        Runnable onCustomComplete
    ) {
        if (assetRelativePath == null || assetRelativePath.isEmpty()) return false;
        final int expectedToken = activePlaybackToken;
        AssetFileDescriptor afd = null;
        try {
            afd = getAssets().openFd(assetRelativePath);
            MediaPlayer player = new MediaPlayer();
            player.setAudioAttributes(
                new AudioAttributes.Builder()
                    .setUsage(usage)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
                    .build()
            );
            player.setVolume(currentVolume, currentVolume);
            player.setDataSource(afd.getFileDescriptor(), afd.getStartOffset(), afd.getLength());
            afd.close();
            afd = null;

            player.setOnCompletionListener(mp -> {
                if (expectedToken != activePlaybackToken) {
                    return;
                }
                if (onCustomComplete != null) {
                    onCustomComplete.run();
                } else if (
                    allowAutoDuaOnComplete
                        && "adhan".equals(currentMode)
                        && autoDuaAfterAdhan
                ) {
                    autoDuaAfterAdhan = false;
                    final String rawDuaPath = pendingDuaAssetPath;
                    pendingDuaAssetPath = "";
                    mainHandler.postDelayed(() -> {
                        if (expectedToken != activePlaybackToken) {
                            return;
                        }
                        startDuaAfterAdhanPlayback(rawDuaPath);
                    }, 350L);
                } else {
                    stopSelfCleanly(false);
                }
            });

            player.setOnErrorListener((mp, what, extra) -> {
                if (expectedToken == activePlaybackToken) {
                    stopSelfCleanly(false);
                }
                return true;
            });

            player.prepare();
            requestShortAudioFocus();
            player.start();
            mediaPlayer = player;
            return true;
        } catch (Exception e) {
            if (afd != null) {
                try {
                    afd.close();
                } catch (Exception ignored) {
                    // ignore
                }
            }
            return false;
        }
    }

    private void startDuaAfterAdhanPlayback(String rawDuaPath) {
        currentMode = "dua";
        acquireTimedWakeLock(4 * 60 * 1000L);
        scheduleSafetyStop(4 * 60 * 1000L, false);

        try {
            if (PrayerNotificationHelper.hasNotificationPermission(this)) {
                Notification duaNotification = PrayerNotificationHelper.buildDuaAfterAdhanNotification(
                    this,
                    currentPrayerKey,
                    currentPrayerNameAr,
                    currentCityNameAr,
                    currentMosqueTheme
                );
                NotificationManagerCompat.from(this).notify(
                    PrayerNotificationHelper.ADHAN_ALERT_NOTIFICATION_ID,
                    duaNotification
                );
            }
        } catch (Exception ignored) {
            // ignore
        }

        String normalizedDua = normalizePublicAssetPath(rawDuaPath);
        if (normalizedDua == null || normalizedDua.isEmpty()) {
            normalizedDua = "public/audio/dua-shaarawy.mp3";
        }
        String fallbackDua = "public/audio/dua-shaarawy.mp3".equals(normalizedDua)
            ? "public/audio/dua-after-adhan.mp3"
            : "public/audio/dua-shaarawy.mp3";

        playAssetWithFallback(normalizedDua, fallbackDua, AudioAttributes.USAGE_ALARM, false);
    }

    private String normalizePublicAssetPath(String rawPath) {
        if (rawPath == null || rawPath.trim().isEmpty()) return null;
        String clean = rawPath.trim();
        if (clean.startsWith("http://") || clean.startsWith("https://")) {
            return null;
        }
        if (clean.startsWith("/")) {
            clean = clean.substring(1);
        }
        if (clean.startsWith("public/")) {
            return clean;
        }
        return "public/" + clean;
    }

    private void requestShortAudioFocus() {
        try {
            AudioManager am = (AudioManager) getSystemService(Context.AUDIO_SERVICE);
            if (am != null) {
                boolean isAlarmMode =
                    "adhan".equals(currentMode)
                        || "dua".equals(currentMode)
                        || "iqama".equals(currentMode)
                        || "pre_adhan".equals(currentMode)
                        || "last_third".equals(currentMode);
                am.requestAudioFocus(
                    null,
                    isAlarmMode ? AudioManager.STREAM_ALARM : AudioManager.STREAM_MUSIC,
                    AudioManager.AUDIOFOCUS_GAIN_TRANSIENT
                );
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private void acquireTimedWakeLock(long timeoutMs) {
        try {
            releaseWakeLock();
            PowerManager pm = (PowerManager) getSystemService(Context.POWER_SERVICE);
            if (pm != null) {
                wakeLock = pm.newWakeLock(PowerManager.PARTIAL_WAKE_LOCK, "mihrab:audio_playback");
                wakeLock.acquire(timeoutMs);
            }
        } catch (Exception ignored) {
            // ignore
        }
    }

    private void scheduleSafetyStop(long delayMs, boolean removeNotification) {
        if (stopSafetyRunnable != null) {
            mainHandler.removeCallbacks(stopSafetyRunnable);
        }
        stopSafetyRunnable = () -> stopSelfCleanly(removeNotification);
        mainHandler.postDelayed(stopSafetyRunnable, delayMs);
    }

    private void releaseMediaPlayer() {
        if (mediaPlayer != null) {
            try {
                if (mediaPlayer.isPlaying()) {
                    mediaPlayer.stop();
                }
            } catch (Exception ignored) {
                // ignore
            }
            try {
                mediaPlayer.release();
            } catch (Exception ignored) {
                // ignore
            }
            mediaPlayer = null;
        }
    }

    private void releaseWakeLock() {
        if (wakeLock != null && wakeLock.isHeld()) {
            try {
                wakeLock.release();
            } catch (Exception ignored) {
                // ignore
            }
        }
        wakeLock = null;
    }

    private void stopSelfCleanly(boolean removeNotification) {
        activePlaybackToken++;
        mainHandler.removeCallbacksAndMessages(null);
        stopSafetyRunnable = null;
        releaseMediaPlayer();
        releaseWakeLock();
        try {
            ServiceCompat.stopForeground(
                this,
                removeNotification
                    ? ServiceCompat.STOP_FOREGROUND_REMOVE
                    : ServiceCompat.STOP_FOREGROUND_DETACH
            );
        } catch (Exception ignored) {
            // ignore
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        activePlaybackToken++;
        mainHandler.removeCallbacksAndMessages(null);
        stopSafetyRunnable = null;
        releaseMediaPlayer();
        releaseWakeLock();
        super.onDestroy();
    }
}
