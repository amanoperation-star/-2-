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
import androidx.core.app.ServiceCompat;

public class MihrabAudioService extends Service {
    public static final String ACTION_PLAY_ADHAN = "com.almawaqeet.mihrab.SERVICE_PLAY_ADHAN";
    public static final String ACTION_PLAY_SALAWAT = "com.almawaqeet.mihrab.SERVICE_PLAY_SALAWAT";
    public static final String ACTION_PLAY_PRE_ADHAN = "com.almawaqeet.mihrab.SERVICE_PLAY_PRE_ADHAN";
    public static final String ACTION_PLAY_IQAMA = "com.almawaqeet.mihrab.SERVICE_PLAY_IQAMA";
    public static final String ACTION_STOP = "com.almawaqeet.mihrab.SERVICE_STOP";

    private MediaPlayer mediaPlayer;
    private PowerManager.WakeLock wakeLock;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable stopSafetyRunnable;
    private String currentMode = "";
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

        if (ACTION_PLAY_ADHAN.equals(action)) {
            currentMode = "adhan";
            String prayerKey = intent.getStringExtra("prayer_key");
            String prayerNameAr = intent.getStringExtra("prayer_name");
            String prayerTime12 = intent.getStringExtra("prayer_time12");
            String cityNameAr = intent.getStringExtra("city_name");
            String reciterNameAr = intent.getStringExtra("reciter_name");
            String mosqueTheme = intent.getStringExtra("mosque_theme");
            boolean useFullScreen = intent.getBooleanExtra("use_fullscreen_intent", true);

            Notification notification = PrayerNotificationHelper.buildAdhanForegroundNotification(
                this,
                prayerKey != null ? prayerKey : "dhuhr",
                prayerNameAr != null ? prayerNameAr : "الصلاة",
                prayerTime12 != null ? prayerTime12 : "",
                cityNameAr != null ? cityNameAr : "مواقيت الصلاة",
                reciterNameAr != null ? reciterNameAr : "",
                mosqueTheme != null ? mosqueTheme : "auto",
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

        stopSelfCleanly(false);
        return START_NOT_STICKY;
    }

    private void promoteForeground(int notificationId, Notification notification) {
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

        if (tryStartLocalAsset(normalizedPrimary, usage, allowAutoDuaOnComplete)) {
            return;
        }

        // Fall back to guaranteed bundled offline MP3
        if (!tryStartLocalAsset(normalizedFallback, usage, allowAutoDuaOnComplete)) {
            stopSelfCleanly(false);
        }
    }

    private boolean tryStartLocalAsset(
        String assetRelativePath,
        int usage,
        boolean allowAutoDuaOnComplete
    ) {
        if (assetRelativePath == null || assetRelativePath.isEmpty()) return false;
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
                if (
                    allowAutoDuaOnComplete
                        && "adhan".equals(currentMode)
                        && autoDuaAfterAdhan
                        && pendingDuaAssetPath != null
                        && !pendingDuaAssetPath.isEmpty()
                ) {
                    autoDuaAfterAdhan = false;
                    String duaPath = pendingDuaAssetPath;
                    pendingDuaAssetPath = "";
                    playAssetWithFallback(duaPath, "public/audio/dua-shaarawy.mp3", AudioAttributes.USAGE_MEDIA, false);
                } else {
                    stopSelfCleanly(false);
                }
            });

            player.setOnErrorListener((mp, what, extra) -> {
                stopSelfCleanly(false);
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
                        || "iqama".equals(currentMode)
                        || "pre_adhan".equals(currentMode);
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
        if (stopSafetyRunnable != null) {
            mainHandler.removeCallbacks(stopSafetyRunnable);
            stopSafetyRunnable = null;
        }
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
        if (stopSafetyRunnable != null) {
            mainHandler.removeCallbacks(stopSafetyRunnable);
            stopSafetyRunnable = null;
        }
        releaseMediaPlayer();
        releaseWakeLock();
        super.onDestroy();
    }
}
