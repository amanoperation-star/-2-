package com.almawaqeet.mihrab;

import android.app.AlarmManager;
import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PorterDuff;
import android.graphics.PorterDuffXfermode;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.os.Build;
import android.os.Bundle;
import android.os.SystemClock;
import android.util.TypedValue;
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

    public static final String KEY_TASBIH_DATE = "tasbih_date_key";
    public static final String KEY_TASBIH_COUNT = "tasbih_count";
    public static final String KEY_TASBIH_UPDATED_MS = "tasbih_updated_ms";
    public static final String KEY_QUIET_OVERRIDE_SET = "quiet_override_set";
    public static final String KEY_QUIET_OVERRIDE_ACTIVE = "quiet_override_active";
    public static final String KEY_QUIET_UPDATED_MS = "quiet_updated_ms";
    public static final String KEY_WISDOM_INDEX = "arch_wisdom_index";

    public static final String ACTION_WIDGET_REFRESH = "com.almawaqeet.mihrab.ACTION_WIDGET_REFRESH";
    public static final String ACTION_WIDGET_TASBIH_INCREMENT =
        "com.almawaqeet.mihrab.ACTION_WIDGET_TASBIH_INCREMENT";
    public static final String ACTION_WIDGET_TOGGLE_QUIET =
        "com.almawaqeet.mihrab.ACTION_WIDGET_TOGGLE_QUIET";
    public static final String ACTION_WIDGET_NEXT_WISDOM =
        "com.almawaqeet.mihrab.ACTION_WIDGET_NEXT_WISDOM";

    private static final int REQUEST_CODE_LAUNCH_APP = 4101;
    private static final int REQUEST_CODE_ALARM_REFRESH = 4102;
    private static final int REQUEST_CODE_LAUNCH_ADHKAR = 4103;
    private static final int REQUEST_CODE_LAUNCH_QIBLA = 4104;
    private static final int REQUEST_CODE_TASBIH_TAP = 4105;
    private static final int REQUEST_CODE_QUIET_TOGGLE = 4106;
    private static final int REQUEST_CODE_WISDOM_NEXT = 4107;

    private static final String[][] FALLBACK_WISDOM_POOL = new String[][] {
        {
            "«من أكثر من ذكر الله في الرخاء، آنسه الله بلطفه في ساعات البلاء.»",
            "حكمة إيمانية مأثورة"
        },
        {
            "﴿ أَلَا بِذِكْرِ اللَّهِ تَطْمَئِنُّ الْقُلُوبُ ﴾",
            "سورة الرعد • الآية ٢٨"
        },
        {
            "«أحبُّ الأعمال إلى الله أدومها وإن قلّ.»",
            "متفق عليه"
        },
        {
            "﴿ وَاسْتَعِينُوا بِالصَّبْرِ وَالصَّلَاةِ ﴾",
            "سورة البقرة • الآية ٤٥"
        },
        {
            "«كلمتان خفيفتان على اللسان ثقيلتان في الميزان: سبحان الله وبحمده، سبحان الله العظيم.»",
            "صحيح البخاري"
        },
        {
            "﴿ فَاذْكُرُونِي أَذْكُرْكُمْ وَاشْكُرُوا لِي وَلَا تَكْفُرُونِ ﴾",
            "سورة البقرة • الآية ١٥٢"
        },
    };

    private PrayerWidgetHelper() {}

    public static void savePayload(Context context, String jsonPayload) {
        if (context == null || jsonPayload == null || jsonPayload.isEmpty()) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        SharedPreferences.Editor editor = prefs.edit();
        String todayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());

        try {
            JSONObject root = new JSONObject(jsonPayload);

            // Reconcile Tasbih counter with timestamp precedence
            JSONObject tasbihObj = root.optJSONObject("tasbihState");
            if (tasbihObj != null) {
                String webDateKey = tasbihObj.optString("dateKey", todayKey);
                int webCount = Math.max(0, tasbihObj.optInt("count", 0));
                long webUpdatedMs = tasbihObj.optLong("updatedAtMs", 0L);

                String nativeDate = prefs.getString(KEY_TASBIH_DATE, "");
                long nativeUpdatedMs = prefs.getLong(KEY_TASBIH_UPDATED_MS, 0L);

                if (!todayKey.equals(nativeDate)) {
                    editor.putString(KEY_TASBIH_DATE, todayKey);
                    editor.putInt(KEY_TASBIH_COUNT, todayKey.equals(webDateKey) ? webCount : 0);
                    editor.putLong(KEY_TASBIH_UPDATED_MS, webUpdatedMs);
                } else if (webUpdatedMs > nativeUpdatedMs) {
                    editor.putInt(KEY_TASBIH_COUNT, webCount);
                    editor.putLong(KEY_TASBIH_UPDATED_MS, webUpdatedMs);
                }
            }

            // Reconcile Quiet Mode toggle with timestamp precedence
            JSONObject quietObj = root.optJSONObject("quietMode");
            if (quietObj != null) {
                long webQuietUpdatedMs = quietObj.optLong("updatedAtMs", 0L);
                long nativeQuietUpdatedMs = prefs.getLong(KEY_QUIET_UPDATED_MS, 0L);
                if (webQuietUpdatedMs > nativeQuietUpdatedMs) {
                    editor.putBoolean(KEY_QUIET_OVERRIDE_SET, false);
                    editor.putBoolean(
                        KEY_QUIET_OVERRIDE_ACTIVE,
                        quietObj.optBoolean("manualActive", false)
                    );
                    editor.putLong(KEY_QUIET_UPDATED_MS, webQuietUpdatedMs);
                } else if (prefs.getBoolean(KEY_QUIET_OVERRIDE_SET, false)) {
                    // Preserve newer native widget toggle inside stored payload so alarms & UI match
                    quietObj.put("manualActive", prefs.getBoolean(KEY_QUIET_OVERRIDE_ACTIVE, false));
                    quietObj.put("updatedAtMs", nativeQuietUpdatedMs);
                    jsonPayload = root.toString();
                }
            }
        } catch (Exception ignored) {
            // Keep raw jsonPayload intact
        }

        editor.putString(KEY_PAYLOAD_JSON, jsonPayload).apply();
    }

    public static void handleTasbihIncrement(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        String todayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        String savedDate = prefs.getString(KEY_TASBIH_DATE, "");
        int current = todayKey.equals(savedDate) ? Math.max(0, prefs.getInt(KEY_TASBIH_COUNT, 0)) : 0;

        prefs.edit()
            .putString(KEY_TASBIH_DATE, todayKey)
            .putInt(KEY_TASBIH_COUNT, current + 1)
            .putLong(KEY_TASBIH_UPDATED_MS, System.currentTimeMillis())
            .apply();

        updateAllWidgets(context);
    }

    public static void handleNextWisdom(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        int idx = prefs.getInt(KEY_WISDOM_INDEX, 0);
        prefs.edit().putInt(KEY_WISDOM_INDEX, idx + 1).apply();
        updateAllWidgets(context);
    }

    public static void handleQuietToggle(Context context) {
        if (context == null) return;
        SharedPreferences prefs = context.getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
        WidgetDisplayModel currentModel = buildDisplayModel(context);
        boolean nextQuietActive = !currentModel.isQuietNow;
        long nowMs = System.currentTimeMillis();

        String rawJson = prefs.getString(KEY_PAYLOAD_JSON, null);
        SharedPreferences.Editor editor = prefs.edit();
        editor.putBoolean(KEY_QUIET_OVERRIDE_SET, true);
        editor.putBoolean(KEY_QUIET_OVERRIDE_ACTIVE, nextQuietActive);
        editor.putLong(KEY_QUIET_UPDATED_MS, nowMs);

        if (rawJson != null && !rawJson.isEmpty()) {
            try {
                JSONObject root = new JSONObject(rawJson);
                JSONObject quietObj = root.optJSONObject("quietMode");
                if (quietObj == null) {
                    quietObj = new JSONObject();
                    root.put("quietMode", quietObj);
                }
                quietObj.put("manualActive", nextQuietActive);
                if (!nextQuietActive) {
                    quietObj.put("pauseUntilMs", JSONObject.NULL);
                }
                quietObj.put("isQuietNow", nextQuietActive);
                quietObj.put("updatedAtMs", nowMs);
                editor.putString(KEY_PAYLOAD_JSON, root.toString());
            } catch (Exception ignored) {
                // ignore JSON mutation failure
            }
        }
        editor.apply();
        updateAllWidgets(context);
    }

    public static int getActiveWidgetCount(Context context) {
        if (context == null) return 0;
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        if (manager == null) return 0;
        int total = 0;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetSmallProvider.class)).length;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetMediumProvider.class)).length;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetLargeProvider.class)).length;
        total += manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetArchProvider.class)).length;
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

        int[] archIds = manager.getAppWidgetIds(new ComponentName(context, PrayerWidgetArchProvider.class));
        if (archIds.length > 0) {
            updateArchWidgets(context, manager, archIds);
        }

        if (smallIds.length + mediumIds.length + largeIds.length + archIds.length == 0) {
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

    public static void updateArchWidgets(
        Context context,
        AppWidgetManager manager,
        int[] appWidgetIds
    ) {
        if (context == null || manager == null || appWidgetIds == null || appWidgetIds.length == 0) return;
        WidgetDisplayModel model = buildDisplayModel(context);

        for (int widgetId : appWidgetIds) {
            RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_prayer_mihrab_arch);
            Bundle options = manager.getAppWidgetOptions(widgetId);
            bindArchWidgetViews(context, views, model, options);
            manager.updateAppWidget(widgetId, views);
        }

        if (model.nextTriggerEpochMs > System.currentTimeMillis() && getActiveWidgetCount(context) > 0) {
            scheduleNextRefresh(context, model.nextTriggerEpochMs + 1500L);
        }
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

        bindCountdown(views, model);
        views.setOnClickPendingIntent(
            R.id.widget_root,
            createShortcutActivityIntent(context, "times", REQUEST_CODE_LAUNCH_APP)
        );
    }

    private static void bindArchWidgetViews(
        Context context,
        RemoteViews views,
        WidgetDisplayModel model,
        Bundle options
    ) {
        boolean isLight = "parchment".equals(model.theme);
        boolean isRoyal = "royal_gold".equals(model.theme);
        boolean isGlass = "glass".equals(model.theme);

        // Theme surfaces
        int outerBgRes = R.drawable.widget_arch_bg_emerald;
        if (isGlass) outerBgRes = R.drawable.widget_arch_bg_glass;
        else if ("oled".equals(model.theme)) outerBgRes = R.drawable.widget_arch_bg_oled;
        else if (isRoyal) outerBgRes = R.drawable.widget_arch_bg_royal_gold;
        else if (isLight) outerBgRes = R.drawable.widget_arch_bg_parchment;

        views.setInt(R.id.widget_root, "setBackgroundResource", outerBgRes);
        views.setInt(
            R.id.widget_arch_inner_frame,
            "setBackgroundResource",
            isGlass ? R.drawable.widget_arch_inner_frame_glass : R.drawable.widget_arch_inner_frame_gold
        );
        views.setInt(
            R.id.widget_arch_icon_box,
            "setBackgroundResource",
            isLight ? R.drawable.widget_arch_icon_box_light : R.drawable.widget_arch_icon_box
        );

        int subcardBgRes = isLight
            ? R.drawable.widget_arch_subcard_light
            : R.drawable.widget_arch_subcard_dark;
        int actionBgRes = isLight
            ? R.drawable.widget_arch_action_light
            : R.drawable.widget_arch_action_dark;
        int progressDrawableRes = isLight
            ? R.drawable.widget_arch_progress_light
            : R.drawable.widget_arch_progress_dark;

        views.setInt(R.id.widget_arch_fasting_strip, "setBackgroundResource", subcardBgRes);
        views.setInt(R.id.widget_arch_day_card, "setBackgroundResource", subcardBgRes);
        views.setInt(R.id.widget_arch_duha_strip, "setBackgroundResource", subcardBgRes);
        views.setInt(R.id.widget_arch_quiet_strip, "setBackgroundResource", subcardBgRes);
        views.setInt(R.id.widget_arch_wisdom_box, "setBackgroundResource", subcardBgRes);

        views.setInt(R.id.widget_arch_wisdom_refresh_btn, "setBackgroundResource", actionBgRes);
        views.setInt(R.id.widget_btn_tasbih, "setBackgroundResource", actionBgRes);
        views.setInt(R.id.widget_btn_adhkar, "setBackgroundResource", actionBgRes);
        views.setInt(R.id.widget_btn_qibla, "setBackgroundResource", actionBgRes);
        views.setInt(
            R.id.widget_btn_quiet,
            "setBackgroundResource",
            model.isQuietNow ? R.drawable.widget_arch_action_active : actionBgRes
        );

        views.setInt(R.id.widget_arch_elapsed_progress, "setProgressDrawable", progressDrawableRes);
        views.setInt(R.id.widget_arch_day_progress, "setProgressDrawable", progressDrawableRes);

        // Theme typography palette
        int primaryColor = isLight ? Color.parseColor("#0F3D2E") : Color.parseColor("#FFFFFF");
        int mutedColor = isLight
            ? Color.parseColor("#4B5E54")
            : isRoyal
                ? Color.parseColor("#E6D19E")
                : Color.parseColor("#CBD5E1");
        int goldColor = isLight
            ? Color.parseColor("#9A6B11")
            : isRoyal
                ? Color.parseColor("#F6D884")
                : Color.parseColor("#F3CA63");
        int emeraldColor = isLight
            ? Color.parseColor("#0D7A56")
            : Color.parseColor("#34D399");

        views.setTextColor(R.id.widget_city, goldColor);
        views.setTextColor(R.id.widget_next_name, primaryColor);
        views.setTextColor(R.id.widget_next_time, goldColor);
        views.setTextColor(R.id.widget_arch_iqama_sep, mutedColor);
        views.setTextColor(R.id.widget_arch_iqama_time, emeraldColor);
        views.setTextColor(R.id.widget_countdown, emeraldColor);
        views.setTextColor(R.id.widget_hijri, mutedColor);
        views.setTextColor(R.id.widget_arch_sunnah_wird, emeraldColor);
        views.setTextColor(R.id.widget_arch_fasting_strip, goldColor);
        views.setTextColor(R.id.widget_arch_achievement_pct, primaryColor);
        views.setTextColor(R.id.widget_arch_achievement_label, mutedColor);
        views.setTextColor(R.id.widget_arch_achievement_detail, goldColor);
        views.setTextColor(R.id.widget_arch_day_label, mutedColor);
        views.setTextColor(R.id.widget_arch_day_pct, goldColor);
        views.setTextColor(R.id.widget_arch_duha_text, primaryColor);
        views.setTextColor(R.id.widget_arch_duha_status, emeraldColor);
        views.setTextColor(R.id.widget_arch_quiet_text, model.isQuietNow ? emeraldColor : primaryColor);
        views.setTextColor(R.id.widget_arch_last_third_text, goldColor);
        views.setTextColor(R.id.widget_arch_wisdom_text, primaryColor);
        views.setTextColor(R.id.widget_arch_wisdom_source, goldColor);
        views.setTextColor(R.id.widget_btn_tasbih_label, isLight ? primaryColor : goldColor);
        views.setTextColor(R.id.widget_btn_adhkar_label, isLight ? primaryColor : goldColor);
        views.setTextColor(R.id.widget_btn_qibla_label, isLight ? primaryColor : goldColor);
        views.setTextColor(
            R.id.widget_btn_quiet_label,
            model.isQuietNow ? emeraldColor : (isLight ? primaryColor : goldColor)
        );

        // Font scaling (sm / md / lg)
        float titleSp = "sm".equals(model.fontScale) ? 16f : ("lg".equals(model.fontScale) ? 20f : 18f);
        float countdownSp = "sm".equals(model.fontScale) ? 19f : ("lg".equals(model.fontScale) ? 24f : 22f);
        float wisdomSp = "sm".equals(model.fontScale) ? 9.5f : ("lg".equals(model.fontScale) ? 11.5f : 10.5f);
        views.setTextViewTextSize(R.id.widget_next_name, TypedValue.COMPLEX_UNIT_SP, titleSp);
        views.setTextViewTextSize(R.id.widget_countdown, TypedValue.COMPLEX_UNIT_SP, countdownSp);
        views.setTextViewTextSize(R.id.widget_arch_wisdom_text, TypedValue.COMPLEX_UNIT_SP, wisdomSp);

        // Mosque photo arched backdrop (clipped cleanly on all Android API levels)
        int mosqueResId = resolveMosqueDrawableRes(model.mosqueBackgroundId);
        if (mosqueResId != 0) {
            Bitmap archBackdrop = renderArchedMosqueBitmap(
                context,
                mosqueResId,
                model.theme,
                model.mosqueBgOpacity,
                options
            );
            if (archBackdrop != null) {
                views.setImageViewBitmap(R.id.widget_arch_mosque_bg, archBackdrop);
                views.setViewVisibility(R.id.widget_arch_mosque_bg, View.VISIBLE);
            } else {
                views.setViewVisibility(R.id.widget_arch_mosque_bg, View.GONE);
            }
        } else {
            views.setViewVisibility(R.id.widget_arch_mosque_bg, View.GONE);
        }

        // Next prayer header + Adhan + Iqama + Countdown + Elapsed Progress
        views.setTextViewText(R.id.widget_city, model.cityNameAr);
        views.setImageViewResource(R.id.widget_arch_prayer_icon, resolvePrayerIconRes(model.nextPrayerKey));
        views.setTextViewText(R.id.widget_next_name, model.nextPrayerNameAr);
        views.setTextViewText(R.id.widget_next_time, model.nextPrayerTime12);

        if (model.nextIqamaTime12 != null && !model.nextIqamaTime12.isEmpty()) {
            views.setViewVisibility(R.id.widget_arch_iqama_sep, View.VISIBLE);
            views.setViewVisibility(R.id.widget_arch_iqama_time, View.VISIBLE);
            views.setTextViewText(R.id.widget_arch_iqama_time, "إقامة " + model.nextIqamaTime12);
        } else {
            views.setViewVisibility(R.id.widget_arch_iqama_sep, View.GONE);
            views.setViewVisibility(R.id.widget_arch_iqama_time, View.GONE);
        }

        bindCountdown(views, model);
        views.setProgressBar(R.id.widget_arch_elapsed_progress, 100, model.elapsedPercent, false);

        // Hijri & Rawatib/Wird row
        boolean showMetaRow = model.showHijriDate || model.showSunnahWird;
        views.setViewVisibility(R.id.widget_arch_meta_row, showMetaRow ? View.VISIBLE : View.GONE);
        if (model.showHijriDate && model.hijriDate != null && !model.hijriDate.isEmpty()) {
            views.setViewVisibility(R.id.widget_hijri, View.VISIBLE);
            views.setTextViewText(R.id.widget_hijri, model.hijriDate);
        } else {
            views.setViewVisibility(R.id.widget_hijri, View.GONE);
        }
        if (model.showSunnahWird) {
            views.setViewVisibility(R.id.widget_arch_sunnah_wird, View.VISIBLE);
            views.setTextViewText(
                R.id.widget_arch_sunnah_wird,
                "الرواتب " + model.rawatibCompleted + "/" + model.rawatibTarget
                    + " · الوِرد " + model.wirdPercent + "%"
            );
        } else {
            views.setViewVisibility(R.id.widget_arch_sunnah_wird, View.GONE);
        }

        // Fasting banner
        if (model.showFastingAlert && model.fastingBannerText != null && !model.fastingBannerText.isEmpty()) {
            views.setViewVisibility(R.id.widget_arch_fasting_strip, View.VISIBLE);
            views.setTextViewText(R.id.widget_arch_fasting_strip, model.fastingBannerText);
        } else {
            views.setViewVisibility(R.id.widget_arch_fasting_strip, View.GONE);
        }

        // Daily Achievement Ring + Day Progress Card
        if (model.showDayProgressRings) {
            views.setViewVisibility(R.id.widget_arch_day_card, View.VISIBLE);
            Bitmap ringBmp = renderProgressRingBitmap(model.overallDailyPercent, isLight);
            if (ringBmp != null) {
                views.setImageViewBitmap(R.id.widget_arch_achievement_ring, ringBmp);
            }
            views.setTextViewText(R.id.widget_arch_achievement_pct, model.overallDailyPercent + "%");
            views.setTextViewText(
                R.id.widget_arch_achievement_detail,
                model.rawatibCompleted + "/" + model.rawatibTarget + " · " + model.wirdPercent + "%"
            );
            views.setTextViewText(R.id.widget_arch_day_pct, model.dayProgressPercent + "%");
            views.setProgressBar(R.id.widget_arch_day_progress, 100, model.dayProgressPercent, false);
        } else {
            views.setViewVisibility(R.id.widget_arch_day_card, View.GONE);
        }

        // Duha / Ishraq Strip
        if (model.showDuhaSunrise) {
            views.setViewVisibility(R.id.widget_arch_duha_strip, View.VISIBLE);
            views.setTextViewText(R.id.widget_arch_duha_text, model.duhaSummaryText);
            views.setTextViewText(R.id.widget_arch_duha_status, model.duhaStatusText);
        } else {
            views.setViewVisibility(R.id.widget_arch_duha_strip, View.GONE);
        }

        // Quiet Mode & Last Third of Night Strip
        if (model.showQuietAndLastThird) {
            views.setViewVisibility(R.id.widget_arch_quiet_strip, View.VISIBLE);
            views.setImageViewResource(
                R.id.widget_arch_quiet_icon,
                model.isQuietNow ? R.drawable.ic_widget_bell_off : R.drawable.ic_widget_bell
            );
            views.setTextViewText(R.id.widget_arch_quiet_text, model.quietStatusLabel);
            views.setTextViewText(R.id.widget_arch_last_third_text, model.lastThirdLabel);
        } else {
            views.setViewVisibility(R.id.widget_arch_quiet_strip, View.GONE);
        }

        // Rotating Daily Wisdom Box
        if (model.showDailyInspiration) {
            views.setViewVisibility(R.id.widget_arch_wisdom_box, View.VISIBLE);
            views.setTextViewText(R.id.widget_arch_wisdom_text, model.wisdomText);
            views.setTextViewText(R.id.widget_arch_wisdom_source, model.wisdomSource);
        } else {
            views.setViewVisibility(R.id.widget_arch_wisdom_box, View.GONE);
        }

        // Bottom 4-Button Quick Actions Bar
        if (model.showQuickActions) {
            views.setViewVisibility(R.id.widget_arch_quick_actions, View.VISIBLE);
            views.setTextViewText(
                R.id.widget_btn_tasbih_label,
                "سبحة (" + model.tasbihCount + ")"
            );
            views.setTextViewText(
                R.id.widget_btn_quiet_label,
                model.isQuietNow ? "السكون ✓" : "السكون"
            );
        } else {
            views.setViewVisibility(R.id.widget_arch_quick_actions, View.GONE);
        }

        // Click Intents
        views.setOnClickPendingIntent(
            R.id.widget_root,
            createShortcutActivityIntent(context, "times", REQUEST_CODE_LAUNCH_APP)
        );
        views.setOnClickPendingIntent(
            R.id.widget_btn_adhkar,
            createShortcutActivityIntent(context, "adhkar", REQUEST_CODE_LAUNCH_ADHKAR)
        );
        views.setOnClickPendingIntent(
            R.id.widget_btn_qibla,
            createShortcutActivityIntent(context, "qibla", REQUEST_CODE_LAUNCH_QIBLA)
        );
        views.setOnClickPendingIntent(
            R.id.widget_btn_tasbih,
            createArchBroadcastIntent(context, ACTION_WIDGET_TASBIH_INCREMENT, REQUEST_CODE_TASBIH_TAP)
        );
        views.setOnClickPendingIntent(
            R.id.widget_btn_quiet,
            createArchBroadcastIntent(context, ACTION_WIDGET_TOGGLE_QUIET, REQUEST_CODE_QUIET_TOGGLE)
        );
        views.setOnClickPendingIntent(
            R.id.widget_arch_wisdom_refresh_btn,
            createArchBroadcastIntent(context, ACTION_WIDGET_NEXT_WISDOM, REQUEST_CODE_WISDOM_NEXT)
        );
    }

    private static void bindCountdown(RemoteViews views, WidgetDisplayModel model) {
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
    }

    private static PendingIntent createShortcutActivityIntent(
        Context context,
        String route,
        int requestCode
    ) {
        Intent launchIntent = new Intent(context, MainActivity.class);
        launchIntent.setAction(Intent.ACTION_VIEW);
        launchIntent.putExtra("mihrab_shortcut_route", route);
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

    private static PendingIntent createArchBroadcastIntent(
        Context context,
        String action,
        int requestCode
    ) {
        Intent intent = new Intent(context, PrayerWidgetArchProvider.class);
        intent.setAction(action);
        return PendingIntent.getBroadcast(
            context,
            requestCode,
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    private static int resolveMosqueDrawableRes(String mosqueId) {
        if ("makkah".equals(mosqueId)) return R.drawable.notif_kaaba;
        if ("madinah".equals(mosqueId)) return R.drawable.notif_nabawi;
        if ("aqsa".equals(mosqueId)) return R.drawable.notif_aqsa;
        if ("azhar".equals(mosqueId)) return R.drawable.notif_azhar;
        return 0;
    }

    private static int resolvePrayerIconRes(String prayerKey) {
        if ("fajr".equals(prayerKey)) return R.drawable.ic_widget_prayer_fajr;
        if ("maghrib".equals(prayerKey)) return R.drawable.ic_widget_prayer_sunset;
        if ("isha".equals(prayerKey)) return R.drawable.ic_widget_prayer_moon;
        return R.drawable.ic_widget_prayer_sun;
    }

    private static Bitmap renderArchedMosqueBitmap(
        Context context,
        int drawableResId,
        String theme,
        int opacityPercent,
        Bundle options
    ) {
        try {
            int minWdp = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MIN_WIDTH, 280) : 280;
            int maxHdp = options != null ? options.getInt(AppWidgetManager.OPTION_APPWIDGET_MAX_HEIGHT, 380) : 380;
            if (minWdp <= 0) minWdp = 280;
            if (maxHdp <= 0) maxHdp = 380;

            float aspect = Math.max(1.05f, Math.min(1.85f, (float) maxHdp / (float) minWdp));
            int outW = 280;
            int outH = Math.round(outW * aspect);

            BitmapFactory.Options boundsOpts = new BitmapFactory.Options();
            boundsOpts.inJustDecodeBounds = true;
            BitmapFactory.decodeResource(context.getResources(), drawableResId, boundsOpts);

            int sampleSize = 1;
            if (boundsOpts.outWidth > outW * 2 || boundsOpts.outHeight > outH * 2) {
                int halfW = boundsOpts.outWidth / 2;
                int halfH = boundsOpts.outHeight / 2;
                while ((halfW / sampleSize) >= outW && (halfH / sampleSize) >= outH) {
                    sampleSize *= 2;
                }
            }

            BitmapFactory.Options decodeOpts = new BitmapFactory.Options();
            decodeOpts.inSampleSize = Math.max(1, sampleSize);
            Bitmap src = BitmapFactory.decodeResource(context.getResources(), drawableResId, decodeOpts);
            if (src == null) return null;

            Bitmap output = Bitmap.createBitmap(outW, outH, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(output);

            float topRad = Math.min(outW * 0.48f, outW * (135f / Math.max(250f, (float) minWdp)));
            float botRad = Math.max(16f, outW * 0.085f);
            float[] radii = new float[] {
                topRad, topRad,
                topRad, topRad,
                botRad, botRad,
                botRad, botRad
            };
            Path archPath = new Path();
            archPath.addRoundRect(new RectF(0f, 0f, outW, outH), radii, Path.Direction.CW);

            Paint maskPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            canvas.drawPath(archPath, maskPaint);

            // Center-crop src into output inside arch mask
            float srcAspect = (float) src.getWidth() / Math.max(1f, (float) src.getHeight());
            float dstAspect = (float) outW / outH;
            Rect srcRect;
            if (srcAspect > dstAspect) {
                int cropW = Math.round(src.getHeight() * dstAspect);
                int left = Math.max(0, (src.getWidth() - cropW) / 2);
                srcRect = new Rect(left, 0, left + cropW, src.getHeight());
            } else {
                int cropH = Math.round(src.getWidth() / dstAspect);
                int top = Math.max(0, (src.getHeight() - cropH) / 2);
                srcRect = new Rect(0, top, src.getWidth(), top + cropH);
            }

            Paint photoPaint = new Paint(Paint.ANTI_ALIAS_FLAG | Paint.FILTER_BITMAP_FLAG);
            int clampedOpacity = Math.max(15, Math.min(80, opacityPercent));
            photoPaint.setAlpha(Math.round((clampedOpacity / 100f) * 255f));
            photoPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_IN));
            canvas.drawBitmap(src, srcRect, new Rect(0, 0, outW, outH), photoPaint);
            src.recycle();

            // Scrim overlay matching widget theme
            int[] scrimColors;
            if ("parchment".equals(theme)) {
                scrimColors = new int[] { 0xD9FCF7E8, 0xC6FAF2DC, 0xE6F3E5C2 };
            } else if ("royal_gold".equals(theme)) {
                scrimColors = new int[] { 0xCC1B1406, 0xB3150F04, 0xE00B0802 };
            } else if ("glass".equals(theme)) {
                scrimColors = new int[] { 0xA6091814, 0x8C091814, 0xCC06110E };
            } else if ("oled".equals(theme)) {
                scrimColors = new int[] { 0xCC000000, 0xB3000000, 0xE6000000 };
            } else {
                scrimColors = new int[] { 0xC70C1914, 0xB30E1D18, 0xD9091310 };
            }

            Paint scrimPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            scrimPaint.setXfermode(new PorterDuffXfermode(PorterDuff.Mode.SRC_ATOP));
            scrimPaint.setShader(
                new LinearGradient(
                    0f,
                    0f,
                    0f,
                    outH,
                    scrimColors,
                    new float[] { 0f, 0.5f, 1f },
                    Shader.TileMode.CLAMP
                )
            );
            canvas.drawRect(0f, 0f, outW, outH, scrimPaint);

            return output;
        } catch (Exception ignored) {
            return null;
        }
    }

    private static Bitmap renderProgressRingBitmap(int percent, boolean isLight) {
        try {
            int size = 84;
            Bitmap bmp = Bitmap.createBitmap(size, size, Bitmap.Config.ARGB_8888);
            Canvas canvas = new Canvas(bmp);
            float stroke = 7f;
            float pad = stroke / 2f + 3f;
            RectF oval = new RectF(pad, pad, size - pad, size - pad);

            Paint trackPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
            trackPaint.setStyle(Paint.Style.STROKE);
            trackPaint.setStrokeWidth(stroke);
            trackPaint.setColor(isLight ? 0x40C49A3A : 0x38D4AF37);
            canvas.drawOval(oval, trackPaint);

            int clamped = Math.max(0, Math.min(100, percent));
            if (clamped > 0) {
                Paint arcPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
                arcPaint.setStyle(Paint.Style.STROKE);
                arcPaint.setStrokeCap(Paint.Cap.ROUND);
                arcPaint.setStrokeWidth(stroke);
                arcPaint.setColor(isLight ? 0xFF0D7A56 : 0xFF10B981);
                canvas.drawArc(oval, -90f, (clamped / 100f) * 360f, false, arcPaint);
            }
            return bmp;
        } catch (Exception ignored) {
            return null;
        }
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
        long nowMs = System.currentTimeMillis();
        String todayKey = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date(nowMs));

        // Interactive Tasbih state (always available even before payload sync)
        String savedTasbihDate = prefs.getString(KEY_TASBIH_DATE, "");
        model.tasbihCount = todayKey.equals(savedTasbihDate)
            ? Math.max(0, prefs.getInt(KEY_TASBIH_COUNT, 0))
            : 0;

        String rawJson = prefs.getString(KEY_PAYLOAD_JSON, null);
        if (rawJson == null || rawJson.isEmpty()) {
            bindWisdomFromPool(prefs, null, model);
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
                model.showSunnahWird = settings.optBoolean("showSunnahWird", true);
                model.showDayProgressRings = settings.optBoolean("showDayProgressRings", true);
                model.showDuhaSunrise = settings.optBoolean("showDuhaSunrise", false);
                model.showQuietAndLastThird = settings.optBoolean("showQuietAndLastThird", true);
                model.showDailyInspiration = settings.optBoolean("showDailyInspiration", true);
                model.showQuickActions = settings.optBoolean("showQuickActions", true);
                model.showFastingAlert = settings.optBoolean("showFastingAlert", true);
                model.mosqueBackgroundId = settings.optString("mosqueBackgroundId", "none");
                model.mosqueBgOpacity = settings.optInt("mosqueBgOpacity", 35);
                model.fontScale = settings.optString("fontScale", "md");
            }

            // Sunnah & Wird progress
            JSONObject sunnah = root.optJSONObject("sunnahProgress");
            if (sunnah != null) {
                model.rawatibCompleted = Math.max(0, sunnah.optInt("rawatibCompleted", 0));
                model.rawatibTarget = Math.max(1, sunnah.optInt("rawatibTarget", 12));
                model.rawatibPercent = Math.max(0, Math.min(100, sunnah.optInt("rawatibPercent", 0)));
                model.wirdPercent = Math.max(0, Math.min(100, sunnah.optInt("wirdPercent", 0)));
                model.overallDailyPercent = Math.round((model.rawatibPercent + model.wirdPercent) / 2f);
            }

            // Fasting banner
            JSONObject fasting = root.optJSONObject("fastingAlert");
            if (fasting != null) {
                boolean upcoming = fasting.optBoolean("isUpcomingSeason", false);
                boolean intentFast = fasting.optBoolean("isFastingIntent", false);
                String occasionTitle = fasting.optString("occasionTitle", "");
                if ((upcoming || intentFast) && !occasionTitle.isEmpty()) {
                    model.fastingBannerText = intentFast
                        ? "🌙 صائم اليوم (" + occasionTitle + ")"
                        : "🌙 " + occasionTitle;
                }
            }

            // Wisdom pool
            JSONObject bgReminders = root.optJSONObject("backgroundReminders");
            JSONArray wisdomPool = bgReminders != null ? bgReminders.optJSONArray("periodicPool") : null;
            bindWisdomFromPool(prefs, wisdomPool, model);

            // Quiet Mode evaluation (honors native toggle override if newer)
            JSONObject quietObj = root.optJSONObject("quietMode");
            boolean isQuiet = evaluateQuietState(prefs, quietObj, nowMs);
            model.isQuietNow = isQuiet;
            model.quietStatusLabel = isQuiet ? "السكون: مفعّل ✓" : "السكون: متاح";

            // Prayer schedule resolution
            String todayDateKey = root.optString("todayDateKey", "");
            String tomorrowDateKey = root.optString("tomorrowDateKey", "");
            JSONArray todaySchedule = root.optJSONArray("todaySchedule");
            JSONArray tomorrowSchedule = root.optJSONArray("tomorrowSchedule");

            JSONArray activeDaySchedule = todaySchedule;
            JSONArray nextDaySchedule = tomorrowSchedule != null ? tomorrowSchedule : todaySchedule;
            model.hijriDate = todayHijri;

            if (!tomorrowDateKey.isEmpty() && tomorrowDateKey.equals(todayKey) && tomorrowSchedule != null) {
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

            fillFiveDailyPrayers(model, activeDaySchedule, isFriday);

            // Find upcoming prayer + previous prayer boundary for progress %
            JSONObject matchedNext = null;
            long matchedEpoch = 0L;
            long prevEpoch = 0L;

            for (int i = 0; i < activeDaySchedule.length(); i++) {
                JSONObject item = activeDaySchedule.optJSONObject(i);
                if (item == null) continue;
                String time24 = item.optString("time24", "");
                long candidateEpoch = parseTimeTodayEpoch(nowCal, time24, 0);
                if (candidateEpoch > nowMs) {
                    matchedNext = item;
                    matchedEpoch = candidateEpoch;
                    if (i > 0) {
                        JSONObject prevItem = activeDaySchedule.optJSONObject(i - 1);
                        if (prevItem != null) {
                            prevEpoch = parseTimeTodayEpoch(nowCal, prevItem.optString("time24", ""), 0);
                        }
                    } else {
                        String ishaTime = findTime24InSchedule(activeDaySchedule, "isha");
                        if (!ishaTime.isEmpty()) {
                            prevEpoch = parseTimeTodayEpoch(nowCal, ishaTime, -1);
                        }
                    }
                    break;
                }
            }

            // After Isha: roll forward to next day's Fajr
            if (matchedNext == null && nextDaySchedule != null && nextDaySchedule.length() > 0) {
                JSONObject firstTomorrow = nextDaySchedule.optJSONObject(0);
                if (firstTomorrow != null) {
                    matchedNext = firstTomorrow;
                    matchedEpoch = parseTimeTodayEpoch(nowCal, firstTomorrow.optString("time24", "05:00"), 1);
                    String todayIsha = findTime24InSchedule(activeDaySchedule, "isha");
                    if (!todayIsha.isEmpty()) {
                        prevEpoch = parseTimeTodayEpoch(nowCal, todayIsha, 0);
                    }
                    if (!tomorrowHijri.isEmpty() && todayDateKey.equals(todayKey)) {
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

                // Compute elapsed percentage between prev prayer & next prayer
                if (prevEpoch > 0L && matchedEpoch > prevEpoch) {
                    long totalWindow = Math.max(60_000L, matchedEpoch - prevEpoch);
                    long elapsed = Math.max(0L, nowMs - prevEpoch);
                    model.elapsedPercent = Math.min(100, Math.max(4, Math.round((elapsed * 100f) / totalWindow)));
                }

                // Compute Iqama time
                if (!"sunrise".equals(model.nextPrayerKey)) {
                    int iqamaMins = resolveIqamaMinutes(root, model.nextPrayerKey);
                    if (iqamaMins > 0) {
                        model.nextIqamaTime12 = format12HourArabicEpoch(matchedEpoch + iqamaMins * 60_000L);
                    }
                }
            }

            // Day progress (Fajr -> Isha)
            String fajr24 = findTime24InSchedule(activeDaySchedule, "fajr");
            String isha24 = findTime24InSchedule(activeDaySchedule, "isha");
            if (!fajr24.isEmpty() && !isha24.isEmpty()) {
                long fajrEpoch = parseTimeTodayEpoch(nowCal, fajr24, 0);
                long ishaEpoch = parseTimeTodayEpoch(nowCal, isha24, 0);
                if (nowMs <= fajrEpoch) {
                    model.dayProgressPercent = 0;
                } else if (nowMs >= ishaEpoch) {
                    model.dayProgressPercent = 100;
                } else {
                    long span = Math.max(3600_000L, ishaEpoch - fajrEpoch);
                    model.dayProgressPercent = Math.min(
                        100,
                        Math.max(0, Math.round(((nowMs - fajrEpoch) * 100f) / span))
                    );
                }
            }

            // Ishraq & Duha live calculation
            String sunrise24 = findTime24InSchedule(activeDaySchedule, "sunrise");
            String dhuhr24 = findTime24InSchedule(activeDaySchedule, "dhuhr");
            if (!sunrise24.isEmpty() && !dhuhr24.isEmpty()) {
                long sunriseMs = parseTimeTodayEpoch(nowCal, sunrise24, 0);
                long dhuhrMs = parseTimeTodayEpoch(nowCal, dhuhr24, 0);
                long ishraqMs = sunriseMs + 15L * 60_000L;
                long duhaEndMs = dhuhrMs - 10L * 60_000L;
                model.duhaSummaryText = "الإشراق " + format12HourArabicEpoch(ishraqMs)
                    + " · نهاية الضحى " + format12HourArabicEpoch(duhaEndMs);
                if (nowMs < sunriseMs) {
                    model.duhaStatusText = "قبل شروق الشمس";
                } else if (nowMs < ishraqMs) {
                    model.duhaStatusText = "انتظر الإشراق";
                } else if (nowMs <= duhaEndMs) {
                    model.duhaStatusText = "الضحى متاحة";
                } else {
                    model.duhaStatusText = "انتهى وقت الضحى";
                }
            }

            // Last third of night live calculation
            String maghrib24 = findTime24InSchedule(activeDaySchedule, "maghrib");
            String tomorrowFajr24 = findTime24InSchedule(nextDaySchedule, "fajr");
            if (!maghrib24.isEmpty() && !fajr24.isEmpty()) {
                long todayFajrMs = parseTimeTodayEpoch(nowCal, fajr24, 0);
                long maghribMs;
                long nextFajrMs;
                if (nowMs < todayFajrMs) {
                    maghribMs = parseTimeTodayEpoch(nowCal, maghrib24, -1);
                    nextFajrMs = todayFajrMs;
                } else {
                    maghribMs = parseTimeTodayEpoch(nowCal, maghrib24, 0);
                    nextFajrMs = parseTimeTodayEpoch(
                        nowCal,
                        !tomorrowFajr24.isEmpty() ? tomorrowFajr24 : fajr24,
                        1
                    );
                }
                if (nextFajrMs > maghribMs) {
                    long nightMs = nextFajrMs - maghribMs;
                    long lastThirdStartMs = nextFajrMs - (nightMs / 3L);
                    if (nowMs >= lastThirdStartMs && nowMs < nextFajrMs) {
                        model.lastThirdLabel = "الثلث الأخير الآن";
                    } else {
                        model.lastThirdLabel = "الثلث الأخير " + format12HourArabicEpoch(lastThirdStartMs);
                    }
                }
            }
        } catch (Exception ignored) {
            // Fall back safely to model defaults
        }
        return model;
    }

    private static void bindWisdomFromPool(
        SharedPreferences prefs,
        JSONArray pool,
        WidgetDisplayModel model
    ) {
        int idx = Math.max(0, prefs.getInt(KEY_WISDOM_INDEX, 0));
        if (pool != null && pool.length() > 0) {
            JSONObject item = pool.optJSONObject(idx % pool.length());
            if (item != null) {
                String txt = item.optString("text", "");
                String src = item.optString("source", "");
                if (!txt.isEmpty()) {
                    model.wisdomText = txt;
                    model.wisdomSource = !src.isEmpty() ? src : "حكمة إيمانية مأثورة";
                    return;
                }
            }
        }
        String[] fallback = FALLBACK_WISDOM_POOL[idx % FALLBACK_WISDOM_POOL.length];
        model.wisdomText = fallback[0];
        model.wisdomSource = fallback[1];
    }

    private static boolean evaluateQuietState(
        SharedPreferences prefs,
        JSONObject quietObj,
        long nowMs
    ) {
        if (prefs.getBoolean(KEY_QUIET_OVERRIDE_SET, false)) {
            if (prefs.getBoolean(KEY_QUIET_OVERRIDE_ACTIVE, false)) {
                return true;
            }
            // If manually turned off via widget, still honor scheduled slots only if not explicitly false
            return false;
        }
        if (quietObj == null) return false;
        if (quietObj.optBoolean("manualActive", false)) return true;
        long pauseUntilMs = quietObj.optLong("pauseUntilMs", 0L);
        if (pauseUntilMs > nowMs) return true;
        JSONArray schedules = quietObj.optJSONArray("schedules");
        if (schedules != null) {
            Calendar cal = Calendar.getInstance();
            cal.setTimeInMillis(nowMs);
            int nowMin = cal.get(Calendar.HOUR_OF_DAY) * 60 + cal.get(Calendar.MINUTE);
            for (int i = 0; i < schedules.length(); i++) {
                JSONObject slot = schedules.optJSONObject(i);
                if (slot == null || !slot.optBoolean("enabled", false)) continue;
                int startMin = parseQuietMin(slot.optString("startTime", "23:00"), 23 * 60);
                int endMin = parseQuietMin(slot.optString("endTime", "06:00"), 6 * 60);
                if (startMin == endMin) return true;
                if (startMin < endMin) {
                    if (nowMin >= startMin && nowMin < endMin) return true;
                } else {
                    if (nowMin >= startMin || nowMin < endMin) return true;
                }
            }
        }
        return quietObj.optBoolean("isQuietNow", false);
    }

    private static int parseQuietMin(String hhmm, int fallback) {
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

    private static int resolveIqamaMinutes(JSONObject root, String prayerKey) {
        int fallback;
        switch (prayerKey) {
            case "fajr":
                fallback = 25;
                break;
            case "maghrib":
                fallback = 10;
                break;
            default:
                fallback = 20;
                break;
        }
        if (root == null) return fallback;
        JSONObject iqama = root.optJSONObject("iqamaSettings");
        if (iqama == null) return fallback;
        JSONObject minsObj = iqama.optJSONObject("minutes");
        if (minsObj == null) return fallback;
        return Math.max(0, minsObj.optInt(prayerKey, fallback));
    }

    private static String findTime24InSchedule(JSONArray schedule, String targetKey) {
        if (schedule == null || targetKey == null) return "";
        for (int i = 0; i < schedule.length(); i++) {
            JSONObject item = schedule.optJSONObject(i);
            if (item != null && targetKey.equals(item.optString("key"))) {
                return item.optString("time24", "");
            }
        }
        return "";
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

    private static String format12HourArabicEpoch(long epochMs) {
        Calendar cal = Calendar.getInstance();
        cal.setTimeInMillis(epochMs);
        int h = cal.get(Calendar.HOUR_OF_DAY);
        int m = cal.get(Calendar.MINUTE);
        int h12 = h % 12 == 0 ? 12 : h % 12;
        String suffix = h >= 12 ? "م" : "ص";
        return String.format(Locale.US, "%02d:%02d %s", h12, m, suffix);
    }

    private static final class WidgetDisplayModel {
        boolean hasSchedule = false;
        String theme = "emerald";
        String mosqueBackgroundId = "none";
        int mosqueBgOpacity = 35;
        String fontScale = "md";

        boolean showHijriDate = true;
        boolean showSunnahWird = true;
        boolean showDayProgressRings = true;
        boolean showDuhaSunrise = false;
        boolean showQuietAndLastThird = true;
        boolean showDailyInspiration = true;
        boolean showQuickActions = true;
        boolean showFastingAlert = true;

        String cityNameAr = "مواقيت الصلاة - محراب";
        String hijriDate = "افتح التطبيق لمزامنة مدينتك";
        String nextLabelAr = "الصلاة القادمة";
        String nextPrayerKey = "fajr";
        String nextPrayerNameAr = "المواقيت";
        String nextPrayerTime12 = "--:--";
        String nextIqamaTime12 = null;
        long nextTriggerEpochMs = 0L;
        int elapsedPercent = 30;

        int rawatibCompleted = 0;
        int rawatibTarget = 12;
        int rawatibPercent = 0;
        int wirdPercent = 0;
        int overallDailyPercent = 0;
        int dayProgressPercent = 0;

        String fastingBannerText = null;
        String duhaSummaryText = "الإشراق --:-- · نهاية الضحى --:--";
        String duhaStatusText = "الضحى";

        boolean isQuietNow = false;
        String quietStatusLabel = "السكون: متاح";
        String lastThirdLabel = "الثلث الأخير --:--";

        String wisdomText = FALLBACK_WISDOM_POOL[0][0];
        String wisdomSource = FALLBACK_WISDOM_POOL[0][1];
        int tasbihCount = 0;

        final String[] dailyLabels = new String[] { "الفجر", "الظهر", "العصر", "المغرب", "العشاء" };
        final String[] dailyTimes12 = new String[] { "--:--", "--:--", "--:--", "--:--", "--:--" };
    }
}
