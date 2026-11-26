package com.almawaqeet.mihrab;

import android.app.Service;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.PixelFormat;
import android.media.AudioAttributes;
import android.media.AudioFormat;
import android.media.AudioTrack;
import android.os.Build;
import android.os.CountDownTimer;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.provider.Settings;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.ProgressBar;
import android.widget.TextView;
import org.json.JSONArray;
import org.json.JSONObject;

public class PeriodicOverlayService extends Service {
    public static final String ACTION_SHOW_PERIODIC_OVERLAY =
        "com.almawaqeet.mihrab.ACTION_SHOW_PERIODIC_OVERLAY";
    public static final String ACTION_DISMISS_PERIODIC_OVERLAY =
        "com.almawaqeet.mihrab.ACTION_DISMISS_PERIODIC_OVERLAY";

    private static final long DURATION_MS = 15000L;

    private WindowManager windowManager;
    private View overlayView;
    private CountDownTimer countDownTimer;
    private final Handler mainHandler = new Handler(Looper.getMainLooper());
    private Runnable resetCopyLabelRunnable;

    private String currentItemId = "verse_1";
    private String currentItemType = "quran";
    private String currentText = "";
    private String currentSource = "";
    private String currentReflection = "";
    private String currentContentType = "both";

    @Override
    public IBinder onBind(Intent intent) {
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        if (intent == null) {
            stopSelf();
            return START_NOT_STICKY;
        }

        String action = intent.getAction();
        if (ACTION_DISMISS_PERIODIC_OVERLAY.equals(action)) {
            removeOverlayAndStop();
            return START_NOT_STICKY;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
            stopSelf();
            return START_NOT_STICKY;
        }

        currentItemId = nonEmptyOr(intent.getStringExtra("item_id"), "verse_1");
        currentItemType = nonEmptyOr(intent.getStringExtra("item_type"), "quran");
        currentText = nonEmptyOr(
            intent.getStringExtra("item_text"),
            "﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾"
        );
        currentSource = nonEmptyOr(intent.getStringExtra("item_source"), "سورة الرعد • الآية ٢٨");
        currentReflection = intent.getStringExtra("item_reflection");
        if (currentReflection == null) currentReflection = "";
        currentContentType = nonEmptyOr(intent.getStringExtra("content_type"), "both");
        boolean soundEnabled = intent.getBooleanExtra("sound_enabled", false);

        showOrUpdateOverlay();
        if (soundEnabled) {
            playGentleChimeAsync();
        }
        return START_NOT_STICKY;
    }

    private void showOrUpdateOverlay() {
        try {
            if (windowManager == null) {
                windowManager = (WindowManager) getSystemService(WINDOW_SERVICE);
            }
            if (windowManager == null) {
                stopSelf();
                return;
            }

            if (overlayView == null) {
                LayoutInflater inflater = LayoutInflater.from(this);
                overlayView = inflater.inflate(R.layout.overlay_periodic_reminder, null);

                int windowType = Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
                    ? WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
                    : WindowManager.LayoutParams.TYPE_PHONE;

                int maxWidthPx = Math.min(
                    (int) (getResources().getDisplayMetrics().widthPixels * 0.94f),
                    dpToPx(460)
                );

                WindowManager.LayoutParams params = new WindowManager.LayoutParams(
                    maxWidthPx,
                    WindowManager.LayoutParams.WRAP_CONTENT,
                    windowType,
                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN
                        | WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH,
                    PixelFormat.TRANSLUCENT
                );
                params.gravity = Gravity.BOTTOM | Gravity.CENTER_HORIZONTAL;
                params.y = dpToPx(28);

                overlayView.setAlpha(0f);
                windowManager.addView(overlayView, params);
                overlayView.animate().alpha(1f).setDuration(180).start();
            }

            bindViews();
            startCountdown();
        } catch (Exception e) {
            removeOverlayAndStop();
        }
    }

    private void bindViews() {
        if (overlayView == null) return;

        TextView typeBadge = overlayView.findViewById(R.id.overlay_type_badge);
        TextView quoteTv = overlayView.findViewById(R.id.overlay_quote_text);
        TextView sourceTv = overlayView.findViewById(R.id.overlay_source_text);
        TextView reflectionTv = overlayView.findViewById(R.id.overlay_reflection_text);
        TextView closeIconBtn = overlayView.findViewById(R.id.overlay_btn_close_icon);
        TextView nextBtn = overlayView.findViewById(R.id.overlay_btn_next);
        TextView copyBtn = overlayView.findViewById(R.id.overlay_btn_copy);
        TextView dismissBtn = overlayView.findViewById(R.id.overlay_btn_dismiss);
        View cardRoot = overlayView.findViewById(R.id.overlay_card_root);

        if (typeBadge != null) {
            typeBadge.setText(
                "quran".equals(currentItemType)
                    ? "✦  آيـة قـرآنـيـة كـريـمـة  ✦"
                    : "✦  حـديـث نـبـوي شـريـف  ✦"
            );
        }
        if (quoteTv != null) quoteTv.setText(currentText);
        if (sourceTv != null) sourceTv.setText(currentSource);
        if (reflectionTv != null) {
            if (!currentReflection.trim().isEmpty()) {
                reflectionTv.setText(currentReflection.trim());
                reflectionTv.setVisibility(View.VISIBLE);
            } else {
                reflectionTv.setVisibility(View.GONE);
            }
        }
        if (copyBtn != null) {
            copyBtn.setText("نسخ النص");
            copyBtn.setTextColor(0xFFE2E8F0);
        }

        if (closeIconBtn != null) {
            closeIconBtn.setOnClickListener(v -> removeOverlayAndStop());
        }
        if (dismissBtn != null) {
            dismissBtn.setOnClickListener(v -> removeOverlayAndStop());
        }
        if (nextBtn != null) {
            nextBtn.setOnClickListener(v -> loadNextFromPool());
        }
        if (copyBtn != null) {
            copyBtn.setOnClickListener(v -> {
                copyCurrentToClipboard();
                copyBtn.setText("تم النسخ ✓");
                copyBtn.setTextColor(0xFF6EE7B7);
                if (resetCopyLabelRunnable != null) {
                    mainHandler.removeCallbacks(resetCopyLabelRunnable);
                }
                resetCopyLabelRunnable = () -> {
                    if (overlayView != null) {
                        copyBtn.setText("نسخ النص");
                        copyBtn.setTextColor(0xFFE2E8F0);
                    }
                };
                mainHandler.postDelayed(resetCopyLabelRunnable, 2000L);
            });
        }
        if (cardRoot != null) {
            cardRoot.setOnClickListener(v -> openInMainApp());
        }
    }

    private void loadNextFromPool() {
        try {
            SharedPreferences widgetPrefs = getSharedPreferences(
                PrayerWidgetHelper.PREFS_NAME,
                Context.MODE_PRIVATE
            );
            String rawJson = widgetPrefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
            JSONArray pool = null;
            if (rawJson != null && !rawJson.isEmpty()) {
                JSONObject root = new JSONObject(rawJson);
                JSONObject bg = root.optJSONObject("backgroundReminders");
                if (bg != null) {
                    pool = bg.optJSONArray("periodicPool");
                    currentContentType = bg.optString("periodicReminderContentType", currentContentType);
                }
            }
            JSONObject picked = BackgroundAlarmReceiver.pickPeriodicItem(
                this,
                pool,
                currentContentType,
                currentItemId
            );
            currentItemId = nonEmptyOr(picked.optString("id", "verse_1"), "verse_1");
            currentItemType = nonEmptyOr(picked.optString("type", "quran"), "quran");
            currentText = nonEmptyOr(picked.optString("text", ""), currentText);
            currentSource = nonEmptyOr(picked.optString("source", ""), currentSource);
            currentReflection = picked.optString("reflection", "");

            bindViews();
            startCountdown();
        } catch (Exception ignored) {
            startCountdown();
        }
    }

    private void copyCurrentToClipboard() {
        try {
            ClipboardManager cm = (ClipboardManager) getSystemService(Context.CLIPBOARD_SERVICE);
            if (cm != null) {
                String formatted = currentText + "\n— " + currentSource;
                cm.setPrimaryClip(ClipData.newPlainText("Mihrab Reminder", formatted));
            }
        } catch (Exception ignored) {
            // ignore clipboard failure
        }
    }

    private void openInMainApp() {
        try {
            Intent launch = new Intent(this, MainActivity.class);
            launch.setAction(Intent.ACTION_VIEW);
            launch.putExtra("mihrab_shortcut_route", "times");
            if (currentItemId != null && !currentItemId.isEmpty()) {
                launch.putExtra("mihrab_periodic_reminder_id", currentItemId);
            }
            launch.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            startActivity(launch);
        } catch (Exception ignored) {
            // ignore
        }
        removeOverlayAndStop();
    }

    private void startCountdown() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
            countDownTimer = null;
        }
        ProgressBar progressBar = overlayView != null
            ? overlayView.findViewById(R.id.overlay_countdown_progress)
            : null;
        TextView secondsTv = overlayView != null
            ? overlayView.findViewById(R.id.overlay_countdown_seconds)
            : null;

        if (progressBar != null) {
            progressBar.setMax((int) DURATION_MS);
            progressBar.setProgress((int) DURATION_MS);
        }
        if (secondsTv != null) {
            secondsTv.setText("15 ث");
        }

        countDownTimer = new CountDownTimer(DURATION_MS, 50L) {
            @Override
            public void onTick(long millisUntilFinished) {
                if (overlayView == null) return;
                if (progressBar != null) {
                    progressBar.setProgress((int) Math.max(0L, millisUntilFinished));
                }
                if (secondsTv != null) {
                    int sec = (int) Math.ceil(millisUntilFinished / 1000.0);
                    secondsTv.setText(Math.max(1, sec) + " ث");
                }
            }

            @Override
            public void onFinish() {
                if (progressBar != null) progressBar.setProgress(0);
                removeOverlayAndStop();
            }
        };
        countDownTimer.start();
    }

    private void playGentleChimeAsync() {
        new Thread(() -> {
            AudioTrack track = null;
            try {
                final int sampleRate = 22050;
                final double note1Sec = 0.22;
                final double note2Sec = 0.34;
                final int totalSamples = (int) ((note1Sec + note2Sec) * sampleRate);
                short[] pcm = new short[totalSamples];

                int split = (int) (note1Sec * sampleRate);
                for (int i = 0; i < totalSamples; i++) {
                    double freq = i < split ? 523.25 : 659.25;
                    int localIdx = i < split ? i : (i - split);
                    int localLen = i < split ? split : (totalSamples - split);
                    double env = Math.sin(Math.PI * localIdx / Math.max(1, localLen));
                    double val = Math.sin(2.0 * Math.PI * freq * i / sampleRate) * env * 0.22;
                    pcm[i] = (short) (val * Short.MAX_VALUE);
                }

                int bufSize = pcm.length * 2;
                track = new AudioTrack.Builder()
                    .setAudioAttributes(
                        new AudioAttributes.Builder()
                            .setUsage(AudioAttributes.USAGE_NOTIFICATION)
                            .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                            .build()
                    )
                    .setAudioFormat(
                        new AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                            .build()
                    )
                    .setBufferSizeInBytes(bufSize)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build();

                track.write(pcm, 0, pcm.length);
                track.play();
                Thread.sleep(650L);
            } catch (Exception ignored) {
                // ignore chime failures
            } finally {
                if (track != null) {
                    try {
                        track.stop();
                    } catch (Exception ignored) {
                        // ignore
                    }
                    try {
                        track.release();
                    } catch (Exception ignored) {
                        // ignore
                    }
                }
            }
        }, "mihrab-chime").start();
    }

    private void removeOverlayAndStop() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
            countDownTimer = null;
        }
        if (resetCopyLabelRunnable != null) {
            mainHandler.removeCallbacks(resetCopyLabelRunnable);
            resetCopyLabelRunnable = null;
        }
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeViewImmediate(overlayView);
            } catch (Exception e) {
                try {
                    windowManager.removeView(overlayView);
                } catch (Exception ignored) {
                    // ignore
                }
            }
            overlayView = null;
        }
        stopSelf();
    }

    @Override
    public void onDestroy() {
        if (countDownTimer != null) {
            countDownTimer.cancel();
            countDownTimer = null;
        }
        if (resetCopyLabelRunnable != null) {
            mainHandler.removeCallbacks(resetCopyLabelRunnable);
            resetCopyLabelRunnable = null;
        }
        if (overlayView != null && windowManager != null) {
            try {
                windowManager.removeViewImmediate(overlayView);
            } catch (Exception ignored) {
                // ignore
            }
            overlayView = null;
        }
        super.onDestroy();
    }

    private int dpToPx(int dp) {
        return Math.round(dp * getResources().getDisplayMetrics().density);
    }

    private static String nonEmptyOr(String val, String fallback) {
        return (val != null && !val.trim().isEmpty()) ? val : fallback;
    }
}
