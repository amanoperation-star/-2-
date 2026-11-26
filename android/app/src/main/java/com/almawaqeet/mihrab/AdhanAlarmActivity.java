package com.almawaqeet.mihrab;

import android.app.Activity;
import android.content.Intent;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class AdhanAlarmActivity extends Activity {
    private final Handler autoDismissHandler = new Handler(Looper.getMainLooper());
    private final Runnable autoDismissRunnable = this::finish;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true);
            setTurnScreenOn(true);
        } else {
            getWindow().addFlags(
                WindowManager.LayoutParams.FLAG_SHOW_WHEN_LOCKED
                    | WindowManager.LayoutParams.FLAG_TURN_SCREEN_ON
            );
        }
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        setContentView(R.layout.activity_adhan_alarm);
        bindIntentData(getIntent());

        // Prevent holding wake screen indefinitely if unattended
        autoDismissHandler.postDelayed(autoDismissRunnable, 8 * 60 * 1000L);
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);
        setIntent(intent);
        bindIntentData(intent);
    }

    private void bindIntentData(Intent intent) {
        String prayerKey = intent != null ? intent.getStringExtra("prayer_key") : "dhuhr";
        String prayerNameAr = intent != null ? intent.getStringExtra("prayer_name") : "الظهر";
        String prayerTime12 = intent != null ? intent.getStringExtra("prayer_time12") : "";
        String cityNameAr = intent != null ? intent.getStringExtra("city_name") : "مواقيت الصلاة";
        String reciterNameAr = intent != null ? intent.getStringExtra("reciter_name") : "";
        String mosqueTheme = intent != null ? intent.getStringExtra("mosque_theme") : "auto";

        if (prayerKey == null || prayerKey.isEmpty()) prayerKey = "dhuhr";
        if (prayerNameAr == null || prayerNameAr.isEmpty()) prayerNameAr = "الصلاة";
        if (cityNameAr == null || cityNameAr.isEmpty()) cityNameAr = "مواقيت الصلاة";

        PrayerNotificationHelper.MosqueVisual mosque =
            PrayerNotificationHelper.resolveMosqueVisual(mosqueTheme, prayerKey);

        ImageView bgImage = findViewById(R.id.adhan_bg_image);
        TextView clockText = findViewById(R.id.adhan_clock_text);
        TextView prayerTitle = findViewById(R.id.adhan_prayer_title);
        TextView cityMosque = findViewById(R.id.adhan_city_mosque);
        TextView reciterLabel = findViewById(R.id.adhan_reciter_label);
        Button stopBtn = findViewById(R.id.btn_stop_adhan);
        Button openAppBtn = findViewById(R.id.btn_open_mihrab);

        bgImage.setImageResource(mosque.drawableResId);

        String displayClock = (prayerTime12 != null && !prayerTime12.isEmpty())
            ? prayerTime12
            : new SimpleDateFormat("hh:mm a", Locale.forLanguageTag("ar")).format(new Date());
        clockText.setText(displayClock);
        prayerTitle.setText("صلاة " + prayerNameAr);
        cityMosque.setText(cityNameAr + " · " + mosque.titleAr);

        if (reciterNameAr != null && !reciterNameAr.isEmpty()) {
            reciterLabel.setText(reciterNameAr);
        } else {
            reciterLabel.setText("أذان " + prayerNameAr + " · مواقيت الصلاة - محراب");
        }

        final String finalPrayerKey = prayerKey;
        final String finalPrayerName = prayerNameAr;

        stopBtn.setOnClickListener(v -> {
            stopNativeAdhanAudio();
            finish();
        });

        openAppBtn.setOnClickListener(v -> {
            stopNativeAdhanAudio();
            Intent launch = new Intent(this, MainActivity.class);
            launch.setAction(Intent.ACTION_VIEW);
            launch.putExtra("mihrab_shortcut_route", "times");
            launch.putExtra("mihrab_open_adhan_prayer", finalPrayerKey);
            launch.putExtra("mihrab_open_adhan_name", finalPrayerName);
            launch.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            startActivity(launch);
            finish();
        });
    }

    private void stopNativeAdhanAudio() {
        try {
            Intent stopIntent = new Intent(this, MihrabAudioService.class);
            stopIntent.setAction(MihrabAudioService.ACTION_STOP);
            startService(stopIntent);
        } catch (Exception ignored) {
            // ignore
        }
        PrayerNotificationHelper.cancelAdhanNotification(this);
    }

    @Override
    protected void onDestroy() {
        autoDismissHandler.removeCallbacks(autoDismissRunnable);
        super.onDestroy();
    }
}
