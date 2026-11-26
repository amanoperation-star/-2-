package com.almawaqeet.mihrab;

import android.Manifest;
import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.os.SystemClock;
import android.widget.RemoteViews;
import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;
import androidx.core.content.ContextCompat;
import java.text.SimpleDateFormat;
import java.util.Calendar;
import java.util.Date;
import java.util.Locale;
import org.json.JSONArray;
import org.json.JSONObject;

public final class PrayerNotificationHelper {
    public static final String CHANNEL_ONGOING_ID = "mihrab_ongoing_prayer_channel";
    public static final String CHANNEL_ADHAN_ID = "mihrab_adhan_alert_channel";
    public static final String CHANNEL_SALAWAT_ID = "mihrab_salawat_channel";
    public static final String CHANNEL_PERIODIC_ID = "mihrab_periodic_reminder_channel";
    public static final String CHANNEL_PERIODIC_SILENT_ID = "mihrab_periodic_reminder_silent_channel";
    public static final String ACTION_ADHAN_TRANSITION = "com.almawaqeet.mihrab.ACTION_ADHAN_TRANSITION";

    public static final int ONGOING_NOTIFICATION_ID = 5101;
    public static final int ADHAN_ALERT_NOTIFICATION_ID = 5102;
    public static final int SALAWAT_NOTIFICATION_ID = 5103;
    public static final int PERIODIC_NOTIFICATION_ID = 5104;

    private static final int REQUEST_CODE_NOTIF_LAUNCH = 5201;
    private static final int REQUEST_CODE_ADHAN_LAUNCH = 5202;
    private static final int REQUEST_CODE_TRANSITION_ALARM = 5203;
    private static final int REQUEST_CODE_ADHAN_FULLSCREEN = 5204;
    private static final int REQUEST_CODE_ADHAN_STOP = 5205;
    private static final int REQUEST_CODE_SALAWAT_LAUNCH = 5206;
    private static final int REQUEST_CODE_SALAWAT_STOP = 5207;
    private static final int REQUEST_CODE_PERIODIC_LAUNCH = 5208;

    private PrayerNotificationHelper() {}

    public static boolean hasNotificationPermission(Context context) {
        if (context == null) return false;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            return (
                ContextCompat.checkSelfPermission(context, Manifest.permission.POST_NOTIFICATIONS)
                    == PackageManager.PERMISSION_GRANTED
            );
        }
        return NotificationManagerCompat.from(context).areNotificationsEnabled();
    }

    public static void ensureChannels(Context context) {
        if (context == null || Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager manager =
            (NotificationManager) context.getSystemService(Context.NOTIFICATION_SERVICE);
        if (manager == null) return;

        NotificationChannel ongoing = new NotificationChannel(
            CHANNEL_ONGOING_ID,
            "شريط العد التنازلي للصلاة",
            NotificationManager.IMPORTANCE_LOW
        );
        ongoing.setDescription("يعرض الصلاة القادمة والعد التنازلي وصورة المسجد عند سحب شاشة الموبايل");
        ongoing.setSound(null, null);
        ongoing.enableVibration(false);
        ongoing.setShowBadge(false);
        ongoing.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(ongoing);

        NotificationChannel adhan = new NotificationChannel(
            CHANNEL_ADHAN_ID,
            "تنبيهات دخول وقت الأذان",
            NotificationManager.IMPORTANCE_HIGH
        );
        adhan.setDescription("إشعار بارز وشاشة الأذان عند دخول وقت الصلاة حتى مع إغلاق التطبيق");
        adhan.setSound(null, null); // Real Adhan audio is played by MihrabAudioService
        adhan.enableVibration(true);
        adhan.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(adhan);

        NotificationChannel salawat = new NotificationChannel(
            CHANNEL_SALAWAT_ID,
            "التذكير الصوتي بالصلاة على النبي ﷺ",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        salawat.setDescription("إشعار وتشغيل صوت الصلاة على النبي ﷺ بصوت المشايخ أثناء إغلاق التطبيق");
        salawat.setSound(null, null); // Real Sheikh recitation is played by MihrabAudioService
        salawat.enableVibration(false);
        salawat.setShowBadge(false);
        salawat.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(salawat);

        NotificationChannel periodic = new NotificationChannel(
            CHANNEL_PERIODIC_ID,
            "التذكير الدوري بالآيات والأحاديث (بصوت)",
            NotificationManager.IMPORTANCE_DEFAULT
        );
        periodic.setDescription("يعرض آيات قرآنية وأحاديث نبوية بشكل دوري مع نغمة تنبيه لطيفة");
        periodic.enableVibration(false);
        periodic.setShowBadge(false);
        periodic.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(periodic);

        NotificationChannel periodicSilent = new NotificationChannel(
            CHANNEL_PERIODIC_SILENT_ID,
            "التذكير الدوري بالآيات والأحاديث (صامت)",
            NotificationManager.IMPORTANCE_LOW
        );
        periodicSilent.setDescription("يعرض آيات قرآنية وأحاديث نبوية بهدوء بدون صوت");
        periodicSilent.setSound(null, null);
        periodicSilent.enableVibration(false);
        periodicSilent.setShowBadge(false);
        periodicSilent.setLockscreenVisibility(Notification.VISIBILITY_PUBLIC);
        manager.createNotificationChannel(periodicSilent);
    }

    public static void refreshOngoingNotification(Context context) {
        if (context == null) return;
        ensureChannels(context);

        NotificationState state = buildNotificationState(context);
        if (!state.stickyEnabled) {
            cancelOngoingNotification(context);
        } else if (hasNotificationPermission(context)) {
            postOngoingNotification(context, state);
        }

        if (state.hasSchedule && state.nextTriggerEpochMs > System.currentTimeMillis()) {
            if (
                state.stickyEnabled
                    || state.adhanBannerEnabled
                    || PrayerWidgetHelper.getActiveWidgetCount(context) > 0
            ) {
                scheduleTransitionAlarm(context, state);
            }
        }
    }

    public static void cancelOngoingNotification(Context context) {
        if (context == null) return;
        try {
            NotificationManagerCompat.from(context).cancel(ONGOING_NOTIFICATION_ID);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void cancelAdhanNotification(Context context) {
        if (context == null) return;
        try {
            NotificationManagerCompat.from(context).cancel(ADHAN_ALERT_NOTIFICATION_ID);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void cancelSalawatNotification(Context context) {
        if (context == null) return;
        try {
            NotificationManagerCompat.from(context).cancel(SALAWAT_NOTIFICATION_ID);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static void handleTransitionAlarm(Context context, Intent intent) {
        if (context == null) return;
        ensureChannels(context);
        PrayerWidgetHelper.updateAllWidgets(context);
        refreshOngoingNotification(context);
        BackgroundReminderScheduler.scheduleAll(context);
    }

    public static void showTestNotificationNow(Context context, String overrideMosqueTheme) {
        if (context == null) return;
        ensureChannels(context);
        if (!hasNotificationPermission(context)) return;

        NotificationState state = buildNotificationState(context);
        if (overrideMosqueTheme != null && !overrideMosqueTheme.isEmpty()) {
            state.mosqueTheme = overrideMosqueTheme;
        }
        postOngoingNotification(context, state);
        showAdhanAlertNotification(
            context,
            state.nextPrayerNameAr,
            state.nextPrayerTime12,
            state.cityNameAr,
            state.nextPrayerKey,
            state.mosqueTheme,
            true
        );
    }

    private static void postOngoingNotification(Context context, NotificationState state) {
        try {
            MosqueVisual mosque = resolveMosqueVisual(state.mosqueTheme, state.nextPrayerKey);
            long remainingMs = Math.max(0L, state.nextTriggerEpochMs - System.currentTimeMillis());
            long baseElapsed = SystemClock.elapsedRealtime() + remainingMs;

            RemoteViews compact = new RemoteViews(
                context.getPackageName(),
                R.layout.notification_prayer_compact
            );
            compact.setImageViewResource(R.id.notif_mosque_image, mosque.drawableResId);
            compact.setTextViewText(
                R.id.notif_title,
                "الصلاة القادمة: " + state.nextPrayerNameAr
            );
            compact.setTextViewText(
                R.id.notif_subtitle,
                state.nextPrayerTime12 + " · " + state.cityNameAr
            );
            if (state.hasSchedule && state.nextTriggerEpochMs > 0L) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    compact.setChronometerCountDown(R.id.notif_countdown, true);
                }
                compact.setChronometer(R.id.notif_countdown, baseElapsed, null, true);
            } else {
                compact.setChronometer(R.id.notif_countdown, SystemClock.elapsedRealtime(), "--:--", false);
            }

            RemoteViews expanded = new RemoteViews(
                context.getPackageName(),
                R.layout.notification_prayer_expanded
            );
            expanded.setImageViewResource(R.id.notif_mosque_banner, mosque.drawableResId);
            expanded.setTextViewText(R.id.notif_mosque_name, mosque.titleAr);
            String cityHijri =
                state.hijriDate != null && !state.hijriDate.isEmpty()
                    ? state.cityNameAr + " · " + state.hijriDate
                    : state.cityNameAr;
            expanded.setTextViewText(R.id.notif_city_hijri, cityHijri);
            expanded.setTextViewText(
                R.id.notif_next_prayer,
                "الصلاة القادمة: " + state.nextPrayerNameAr + " — " + state.nextPrayerTime12
            );
            expanded.setTextViewText(R.id.notif_following_info, state.followingSummaryAr);
            if (state.hasSchedule && state.nextTriggerEpochMs > 0L) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
                    expanded.setChronometerCountDown(R.id.notif_countdown, true);
                }
                expanded.setChronometer(R.id.notif_countdown, baseElapsed, null, true);
            } else {
                expanded.setChronometer(R.id.notif_countdown, SystemClock.elapsedRealtime(), "--:--", false);
            }

            PendingIntent launchIntent = createLaunchPendingIntent(context, REQUEST_CODE_NOTIF_LAUNCH);

            Notification notification = new NotificationCompat.Builder(context, CHANNEL_ONGOING_ID)
                .setSmallIcon(R.drawable.ic_stat_mihrab)
                .setContentTitle("الصلاة القادمة: " + state.nextPrayerNameAr)
                .setContentText(state.nextPrayerTime12 + " · " + state.cityNameAr)
                .setCustomContentView(compact)
                .setCustomBigContentView(expanded)
                .setStyle(new NotificationCompat.DecoratedCustomViewStyle())
                .setOngoing(true)
                .setAutoCancel(false)
                .setOnlyAlertOnce(true)
                .setSilent(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setCategory(NotificationCompat.CATEGORY_STATUS)
                .setContentIntent(launchIntent)
                .build();

            NotificationManagerCompat.from(context).notify(ONGOING_NOTIFICATION_ID, notification);
        } catch (Exception ignored) {
            // Protect against device-specific RemoteViews binder issues
        }
    }

    public static void showAdhanAlertNotification(
        Context context,
        String prayerNameAr,
        String prayerTime12,
        String cityNameAr,
        String prayerKey,
        String mosqueTheme,
        boolean isTest
    ) {
        showAdhanFullScreenNotification(
            context,
            prayerKey,
            prayerNameAr,
            prayerTime12,
            cityNameAr,
            "",
            mosqueTheme,
            false,
            isTest
        );
    }

    public static Notification buildAdhanForegroundNotification(
        Context context,
        String prayerKey,
        String prayerNameAr,
        String prayerTime12,
        String cityNameAr,
        String reciterNameAr,
        String mosqueTheme,
        boolean useFullScreenIntent
    ) {
        ensureChannels(context);
        MosqueVisual mosque = resolveMosqueVisual(mosqueTheme, prayerKey);
        Bitmap mosqueBitmap = decodeSafeNotificationBitmap(context, mosque.drawableResId);

        Intent fullScreenIntent = new Intent(context, AdhanAlarmActivity.class);
        fullScreenIntent.putExtra("prayer_key", prayerKey);
        fullScreenIntent.putExtra("prayer_name", prayerNameAr);
        fullScreenIntent.putExtra("prayer_time12", prayerTime12);
        fullScreenIntent.putExtra("city_name", cityNameAr);
        fullScreenIntent.putExtra("reciter_name", reciterNameAr);
        fullScreenIntent.putExtra("mosque_theme", mosqueTheme);
        fullScreenIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
        );
        PendingIntent fullScreenPi = PendingIntent.getActivity(
            context,
            REQUEST_CODE_ADHAN_FULLSCREEN,
            fullScreenIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        Intent stopIntent = new Intent(context, BackgroundAlarmReceiver.class);
        stopIntent.setAction(BackgroundAlarmReceiver.ACTION_STOP_AUDIO_SERVICE);
        PendingIntent stopPi = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE_ADHAN_STOP,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String title = "حان الآن موعد أذان " + prayerNameAr;
        StringBuilder bodyBuilder = new StringBuilder();
        bodyBuilder.append(cityNameAr);
        if (prayerTime12 != null && !prayerTime12.isEmpty()) {
            bodyBuilder.append(" · ").append(prayerTime12);
        }
        if (reciterNameAr != null && !reciterNameAr.isEmpty()) {
            bodyBuilder.append(" · ").append(reciterNameAr);
        } else {
            bodyBuilder.append(" · ").append(mosque.titleAr);
        }
        String body = bodyBuilder.toString();

        NotificationCompat.Builder builder =
            new NotificationCompat.Builder(context, CHANNEL_ADHAN_ID)
                .setSmallIcon(R.drawable.ic_stat_mihrab)
                .setContentTitle(title)
                .setContentText(body)
                .setSubText(mosque.titleAr)
                .setPriority(NotificationCompat.PRIORITY_MAX)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setAutoCancel(true)
                .setContentIntent(fullScreenPi)
                .addAction(R.drawable.ic_stat_mihrab, "فتح شاشة الأذان", fullScreenPi)
                .addAction(R.drawable.ic_stat_mihrab, "إيقاف الأذان", stopPi);

        if (useFullScreenIntent) {
            builder.setFullScreenIntent(fullScreenPi, true);
        }

        if (mosqueBitmap != null) {
            builder.setLargeIcon(mosqueBitmap);
            builder.setStyle(
                new NotificationCompat.BigPictureStyle()
                    .bigPicture(mosqueBitmap)
                    .bigLargeIcon((Bitmap) null)
                    .setBigContentTitle(title)
                    .setSummaryText(body)
            );
        }

        return builder.build();
    }

    public static void showAdhanFullScreenNotification(
        Context context,
        String prayerKey,
        String prayerNameAr,
        String prayerTime12,
        String cityNameAr,
        String reciterNameAr,
        String mosqueTheme,
        boolean useFullScreenIntent,
        boolean isTest
    ) {
        if (context == null || !hasNotificationPermission(context)) return;
        ensureChannels(context);

        try {
            Notification notification = buildAdhanForegroundNotification(
                context,
                prayerKey,
                isTest ? ("معاينة " + prayerNameAr) : prayerNameAr,
                prayerTime12,
                cityNameAr,
                reciterNameAr,
                mosqueTheme,
                useFullScreenIntent
            );
            NotificationManagerCompat.from(context).notify(ADHAN_ALERT_NOTIFICATION_ID, notification);
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static Notification buildSalawatNotification(
        Context context,
        String sheikhNameAr,
        String formulaAr
    ) {
        ensureChannels(context);
        PendingIntent launchPi = createLaunchPendingIntent(context, REQUEST_CODE_SALAWAT_LAUNCH);

        Intent stopIntent = new Intent(context, BackgroundAlarmReceiver.class);
        stopIntent.setAction(BackgroundAlarmReceiver.ACTION_STOP_AUDIO_SERVICE);
        PendingIntent stopPi = PendingIntent.getBroadcast(
            context,
            REQUEST_CODE_SALAWAT_STOP,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );

        String title = "ﷺ صلِّ على سيدنا محمد";
        String summary = (sheikhNameAr != null && !sheikhNameAr.isEmpty())
            ? sheikhNameAr + " · تذكير دوري بالصلاة على النبي ﷺ"
            : "تذكير دوري بالصلاة على النبي ﷺ";
        String bodyText = (formulaAr != null && !formulaAr.isEmpty())
            ? formulaAr
            : "اللَّهُمَّ صَلِّ وَسَلِّمْ عَلَى نَبِيِّنَا مُحَمَّدٍ وَعَلَى آلِهِ وَصَحْبِهِ أَجْمَعِينَ";

        return new NotificationCompat.Builder(context, CHANNEL_SALAWAT_ID)
            .setSmallIcon(R.drawable.ic_stat_mihrab)
            .setContentTitle(title)
            .setContentText(summary)
            .setStyle(
                new NotificationCompat.BigTextStyle()
                    .bigText(bodyText + "\n" + summary)
                    .setBigContentTitle(title)
            )
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
            .setAutoCancel(true)
            .setOnlyAlertOnce(true)
            .setContentIntent(launchPi)
            .addAction(R.drawable.ic_stat_mihrab, "إيقاف الصوت", stopPi)
            .build();
    }

    public static void showPeriodicReminderNotification(
        Context context,
        String itemId,
        String itemType,
        String text,
        String source,
        String reflection,
        boolean soundEnabled
    ) {
        if (context == null || !hasNotificationPermission(context)) return;
        ensureChannels(context);

        try {
            Intent launchIntent = new Intent(context, MainActivity.class);
            launchIntent.setAction(Intent.ACTION_VIEW);
            launchIntent.putExtra("mihrab_shortcut_route", "times");
            if (itemId != null && !itemId.isEmpty()) {
                launchIntent.putExtra("mihrab_periodic_reminder_id", itemId);
            }
            launchIntent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
                    | Intent.FLAG_ACTIVITY_CLEAR_TOP
                    | Intent.FLAG_ACTIVITY_SINGLE_TOP
            );
            PendingIntent launchPi = PendingIntent.getActivity(
                context,
                REQUEST_CODE_PERIODIC_LAUNCH,
                launchIntent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            String title = "quran".equals(itemType)
                ? "✦ آية قرآنية كريمة"
                : "✦ حديث نبوي شريف";
            StringBuilder expanded = new StringBuilder();
            expanded.append(text);
            if (source != null && !source.isEmpty()) {
                expanded.append("\n— ").append(source);
            }
            if (reflection != null && !reflection.isEmpty()) {
                expanded.append("\n").append(reflection);
            }

            String channelId = soundEnabled ? CHANNEL_PERIODIC_ID : CHANNEL_PERIODIC_SILENT_ID;
            NotificationCompat.Builder builder =
                new NotificationCompat.Builder(context, channelId)
                    .setSmallIcon(R.drawable.ic_stat_mihrab)
                    .setContentTitle(title)
                    .setContentText(text)
                    .setSubText(source != null ? source : "")
                    .setStyle(
                        new NotificationCompat.BigTextStyle()
                            .bigText(expanded.toString())
                            .setBigContentTitle(title)
                    )
                    .setPriority(
                        soundEnabled
                            ? NotificationCompat.PRIORITY_DEFAULT
                            : NotificationCompat.PRIORITY_LOW
                    )
                    .setCategory(NotificationCompat.CATEGORY_REMINDER)
                    .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                    .setAutoCancel(true)
                    .setSilent(!soundEnabled)
                    .setContentIntent(launchPi);

            NotificationManagerCompat.from(context).notify(PERIODIC_NOTIFICATION_ID, builder.build());
        } catch (Exception ignored) {
            // ignore
        }
    }

    public static Bitmap decodeSafeNotificationBitmap(Context context, int drawableResId) {
        try {
            BitmapFactory.Options opts = new BitmapFactory.Options();
            opts.inSampleSize = 2;
            opts.inPreferredConfig = Bitmap.Config.RGB_565;
            return BitmapFactory.decodeResource(context.getResources(), drawableResId, opts);
        } catch (Exception e) {
            return null;
        }
    }

    private static PendingIntent createLaunchPendingIntent(Context context, int requestCode) {
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_VIEW);
        launchIntent.putExtra("mihrab_shortcut_route", "times");
        launchIntent.addFlags(
            Intent.FLAG_ACTIVITY_NEW_TASK
                | Intent.FLAG_ACTIVITY_CLEAR_TOP
                | Intent.FLAG_ACTIVITY_SINGLE_TOP
        );
        return PendingIntent.getActivity(
            context,
            requestCode,
            launchIntent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static void scheduleTransitionAlarm(Context context, NotificationState state) {
        try {
            AlarmManager alarmManager = (AlarmManager) context.getSystemService(Context.ALARM_SERVICE);
            if (alarmManager == null) return;

            Intent intent = new Intent(context, PrayerWidgetSmallProvider.class);
            intent.setAction(ACTION_ADHAN_TRANSITION);
            intent.putExtra("prayer_key", state.nextPrayerKey);
            intent.putExtra("prayer_name", state.nextPrayerNameAr);
            intent.putExtra("prayer_time12", state.nextPrayerTime12);
            intent.putExtra("city_name", state.cityNameAr);
            intent.putExtra("mosque_theme", state.mosqueTheme);
            intent.putExtra("target_epoch_ms", state.nextTriggerEpochMs);

            PendingIntent pi = PendingIntent.getBroadcast(
                context,
                REQUEST_CODE_TRANSITION_ALARM,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
            );

            long triggerAt = state.nextTriggerEpochMs + 1000L;
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                alarmManager.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            } else {
                alarmManager.set(AlarmManager.RTC_WAKEUP, triggerAt, pi);
            }
        } catch (Exception ignored) {
            // ignore OEM alarm restrictions gracefully
        }
    }

    public static MosqueVisual resolveMosqueVisual(String theme, String prayerKey) {
        String normalized = theme != null ? theme : "auto";
        if ("kaaba".equals(normalized)) {
            return new MosqueVisual(R.drawable.notif_kaaba, "الكعبة المشرفة · المسجد الحرام");
        }
        if ("nabawi".equals(normalized)) {
            return new MosqueVisual(R.drawable.notif_nabawi, "المسجد النبوي الشريف");
        }
        if ("azhar".equals(normalized)) {
            return new MosqueVisual(R.drawable.notif_azhar, "الجامع الأزهر الشريف");
        }
        if ("dhuhr".equals(prayerKey) || "sunrise".equals(prayerKey)) {
            return new MosqueVisual(R.drawable.notif_azhar, "الجامع الأزهر الشريف");
        }
        if ("asr".equals(prayerKey) || "isha".equals(prayerKey)) {
            return new MosqueVisual(R.drawable.notif_nabawi, "المسجد النبوي الشريف");
        }
        return new MosqueVisual(R.drawable.notif_kaaba, "الكعبة المشرفة · المسجد الحرام");
    }

    public static NotificationState buildNotificationState(Context context) {
        NotificationState state = new NotificationState();
        SharedPreferences prefs = context.getSharedPreferences(
            PrayerWidgetHelper.PREFS_NAME,
            Context.MODE_PRIVATE
        );
        String rawJson = prefs.getString(PrayerWidgetHelper.KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) {
            return state;
        }

        try {
            JSONObject root = new JSONObject(rawJson);
            state.cityNameAr = root.optString("cityNameAr", "القاهرة");
            state.hijriDate = root.optString("hijriDate", "");

            JSONObject notifSettings = root.optJSONObject("notificationSettings");
            if (notifSettings != null) {
                state.stickyEnabled = notifSettings.optBoolean("stickyEnabled", true);
                state.adhanBannerEnabled = notifSettings.optBoolean("adhanBannerEnabled", true);
                state.mosqueTheme = notifSettings.optString("mosqueTheme", "auto");
            }

            long nowMs = System.currentTimeMillis();
            String nowDateKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(nowMs));
            String tomorrowDateKey = root.optString("tomorrowDateKey", "");
            String tomorrowHijri = root.optString("tomorrowHijriDate", state.hijriDate);

            JSONArray todaySchedule = root.optJSONArray("todaySchedule");
            JSONArray tomorrowSchedule = root.optJSONArray("tomorrowSchedule");
            JSONArray activeSchedule = todaySchedule;
            JSONArray nextSchedule = tomorrowSchedule != null ? tomorrowSchedule : todaySchedule;

            if (!tomorrowDateKey.isEmpty() && tomorrowDateKey.equals(nowDateKey) && tomorrowSchedule != null) {
                activeSchedule = tomorrowSchedule;
                nextSchedule = tomorrowSchedule;
                state.hijriDate = tomorrowHijri;
            } else if (activeSchedule == null) {
                activeSchedule = root.optJSONArray("dailyPrayers");
                nextSchedule = activeSchedule;
            }

            if (activeSchedule == null || activeSchedule.length() == 0) {
                return state;
            }

            Calendar nowCal = Calendar.getInstance();
            nowCal.setTimeInMillis(nowMs);
            int matchedIndex = -1;
            long matchedEpoch = 0L;
            boolean fromTomorrow = false;

            for (int i = 0; i < activeSchedule.length(); i++) {
                JSONObject item = activeSchedule.optJSONObject(i);
                if (item == null) continue;
                long candidate = parseTimeTodayEpoch(nowCal, item.optString("time24", ""), 0);
                if (candidate > nowMs) {
                    matchedIndex = i;
                    matchedEpoch = candidate;
                    break;
                }
            }

            if (matchedIndex == -1 && nextSchedule != null && nextSchedule.length() > 0) {
                JSONObject firstTomorrow = nextSchedule.optJSONObject(0);
                if (firstTomorrow != null) {
                    matchedIndex = 0;
                    matchedEpoch = parseTimeTodayEpoch(nowCal, firstTomorrow.optString("time24", "05:00"), 1);
                    fromTomorrow = true;
                }
            }

            if (matchedIndex >= 0 && matchedEpoch > nowMs) {
                JSONArray sourceArray = fromTomorrow ? nextSchedule : activeSchedule;
                JSONObject matched = sourceArray.optJSONObject(matchedIndex);
                if (matched != null) {
                    state.hasSchedule = true;
                    state.nextPrayerKey = matched.optString("key", "fajr");
                    Calendar targetCal = Calendar.getInstance();
                    targetCal.setTimeInMillis(matchedEpoch);
                    boolean isTargetFriday = targetCal.get(Calendar.DAY_OF_WEEK) == Calendar.FRIDAY;
                    String pName = matched.optString("nameAr", "الصلاة");
                    if ("dhuhr".equals(state.nextPrayerKey)) {
                        pName = isTargetFriday ? "الجمعة" : "الظهر";
                    }
                    state.nextPrayerNameAr = pName;
                    state.nextPrayerTime12 = matched.optString("time12", "--:--");
                    state.nextTriggerEpochMs = matchedEpoch;

                    JSONObject following = null;
                    if (matchedIndex + 1 < sourceArray.length()) {
                        following = sourceArray.optJSONObject(matchedIndex + 1);
                    } else if (!fromTomorrow && nextSchedule != null && nextSchedule.length() > 0) {
                        following = nextSchedule.optJSONObject(0);
                    }
                    if (following != null) {
                        state.followingSummaryAr =
                            "تليها: "
                                + following.optString("nameAr", "")
                                + " "
                                + following.optString("time12", "");
                    } else {
                        state.followingSummaryAr = "مواقيت الصلاة - محراب";
                    }
                }
            }
        } catch (Exception ignored) {
            // fallback defaults
        }
        return state;
    }

    public static long parseTimeTodayEpoch(Calendar baseNow, String time24, int addDays) {
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

    public static final class MosqueVisual {
        public final int drawableResId;
        public final String titleAr;

        public MosqueVisual(int drawableResId, String titleAr) {
            this.drawableResId = drawableResId;
            this.titleAr = titleAr;
        }
    }

    public static final class NotificationState {
        public boolean stickyEnabled = true;
        public boolean adhanBannerEnabled = true;
        public String mosqueTheme = "auto";
        public boolean hasSchedule = false;
        public String cityNameAr = "مواقيت الصلاة - محراب";
        public String hijriDate = "";
        public String nextPrayerKey = "fajr";
        public String nextPrayerNameAr = "المواقيت";
        public String nextPrayerTime12 = "--:--";
        public String followingSummaryAr = "افتح التطبيق لمزامنة المواقيت";
        public long nextTriggerEpochMs = 0L;
    }
}
