import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Calendar,
  Plane,
  ShieldPlus,
  ChevronRight,
  ChevronLeft,
  Play,
  Square,
  Volume2,
  Plus,
  Minus,
  Lightbulb,
  Check,
  RotateCcw,
  Clock,
  Sparkles,
  Loader2,
  Download,
  WifiOff,
  CheckCircle2,
  Mic,
  ListChecks,
  BookMarked,
} from 'lucide-react';
import { CityLocation, PrayerTimeData, UserSettings } from '../types';
import { QadaPlannerPanel } from './QadaPlannerPanel';
import { HifzCompanionPanel } from './HifzCompanionPanel';
import { computeQadaAnalytics, loadQadaState } from '../utils/qadaData';
import { computeHifzStats, loadHifzState } from '../utils/hifzData';
import {
  HijriCalendarDay,
  buildHijriMonthCalendar,
  getUpcomingIslamicEvents,
} from '../utils/hijriCalendarData';
import {
  RUQYAH_DUA_SHEIKHS,
  RUQYAH_ITEMS,
  RUQYAH_RECITERS,
  RuqyahDuaSheikh,
  RuqyahItem,
  RuqyahReciter,
  buildContinuousRuqyahUrls,
  buildVerseAudioUrls,
} from '../utils/ruqyahData';
import {
  downloadAllAudioForOffline,
  getOfflineCacheStats,
  resolvePlayableAudioUrl,
} from '../utils/offlineAudioManager';
import { adhanPlayer } from '../utils/audioAdhan';
import { toArabicDigits } from '../utils/khatmaData';

export type HubSectionTab = 'calendar' | 'travel' | 'ruqyah' | 'qada' | 'hifz';

interface CompanionHubSectionProps {
  currentLocation: CityLocation;
  prayerTimes: PrayerTimeData;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  initialSubTab?: HubSectionTab;
  onSubTabChange?: (tab: HubSectionTab) => void;
  onTestCompanionReminder?: (kind: 'qada' | 'hifz') => void;
}

const WEEKDAY_HEADERS_SAT_FIRST = [
  'السبت',
  'الأحد',
  'الإثنين',
  'الثلاثاء',
  'الأربعاء',
  'الخميس',
  'الجمعة',
];

function format12HourAr(timeStr?: string): string {
  if (!timeStr || !timeStr.includes(':')) return '--:--';
  const [hRaw, mRaw] = timeStr.split(':').map(Number);
  if (Number.isNaN(hRaw) || Number.isNaN(mRaw)) return '--:--';
  const h12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  const suffix = hRaw >= 12 ? 'م' : 'ص';
  return `${String(h12).padStart(2, '0')}:${String(mRaw).padStart(2, '0')} ${suffix}`;
}

export const CompanionHubSection: React.FC<CompanionHubSectionProps> = ({
  currentLocation,
  prayerTimes,
  settings,
  onUpdateSettings,
  initialSubTab,
  onSubTabChange,
  onTestCompanionReminder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<HubSectionTab>(initialSubTab || 'calendar');
  const [qadaRemainingBadge, setQadaRemainingBadge] = useState<number>(() => {
    const a = computeQadaAnalytics(loadQadaState());
    return a.totalRemainingWithWitr;
  });
  const [hifzDueBadge, setHifzDueBadge] = useState<number>(() => {
    return computeHifzStats(loadHifzState()).dueCount;
  });

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    const syncBadges = () => {
      setQadaRemainingBadge(computeQadaAnalytics(loadQadaState()).totalRemainingWithWitr);
      setHifzDueBadge(computeHifzStats(loadHifzState()).dueCount);
    };
    window.addEventListener('qada_state_changed', syncBadges);
    window.addEventListener('hifz_state_changed', syncBadges);
    return () => {
      window.removeEventListener('qada_state_changed', syncBadges);
      window.removeEventListener('hifz_state_changed', syncBadges);
    };
  }, []);

  const handleSelectSubTab = (tab: HubSectionTab) => {
    setActiveSubTab(tab);
    onSubTabChange?.(tab);
  };

  // --- 1. Hijri Calendar State ---
  const [monthOffset, setMonthOffset] = useState<number>(0);
  const monthCalendar = useMemo(
    () =>
      buildHijriMonthCalendar(
        monthOffset,
        currentLocation,
        settings.calculationMethod,
        settings.asrMethod,
        settings.hijriAdjustment || 0
      ),
    [
      monthOffset,
      currentLocation,
      settings.calculationMethod,
      settings.asrMethod,
      settings.hijriAdjustment,
    ]
  );

  const [selectedDateKey, setSelectedDateKey] = useState<string>(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  });

  const selectedDay: HijriCalendarDay = useMemo(() => {
    return (
      monthCalendar.days.find((d) => d.dateKey === selectedDateKey) ||
      monthCalendar.days.find((d) => d.isToday) ||
      monthCalendar.days[0]
    );
  }, [monthCalendar.days, selectedDateKey]);

  const upcomingEvents = useMemo(
    () => getUpcomingIslamicEvents(settings.hijriAdjustment || 0),
    [settings.hijriAdjustment]
  );

  // Leading empty cells so Sat = col 0 (weekdayIndex 6 -> 0, 0 -> 1, ..., 5 -> 6)
  const leadingEmptyCells = useMemo(() => {
    if (monthCalendar.days.length === 0) return 0;
    const firstWeekday = monthCalendar.days[0].weekdayIndex; // 0 Sun..6 Sat
    return (firstWeekday + 1) % 7;
  }, [monthCalendar.days]);

  // --- 2. Travel Mode State ---
  const travelEnabled = Boolean(settings.travelModeEnabled);
  const travelDistance = settings.travelDistanceKm ?? 120;
  const travelJamType = settings.travelJamType || 'taqdeem';
  const meetsQasrDistance = travelDistance >= 81;

  // --- 3. Ruqyah State & Sequential Audio Player ---
  const [ruqyahFilter, setRuqyahFilter] = useState<'all' | 'quran' | 'sunnah'>('all');
  const [selectedReciterId, setSelectedReciterId] = useState<string>(RUQYAH_RECITERS[0].id);
  const [selectedDuaSheikhId, setSelectedDuaSheikhId] = useState<RuqyahDuaSheikh['id']>(() => {
    if (typeof window === 'undefined') return 'ghamdi';
    const saved = localStorage.getItem('ruqyah_dua_sheikh');
    return (saved === 'jibreel' || saved === 'durayhim' ? saved : 'ghamdi') as RuqyahDuaSheikh['id'];
  });
  const [ruqyahFontSize, setRuqyahFontSize] = useState<number>(22);
  const [wakeLockActive, setWakeLockActive] = useState<boolean>(false);
  const wakeLockRef = useRef<any>(null);

  const [playingItemId, setPlayingItemId] = useState<string | null>(null);
  const [playlistMode, setPlaylistMode] = useState<'none' | 'quran' | 'sunnah'>('none');
  const [audioLoading, setAudioLoading] = useState<boolean>(false);
  const [audioProgressLabel, setAudioProgressLabel] = useState<string | null>(null);
  const ruqyahAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackSessionRef = useRef<number>(0);

  const [offlineCacheStats, setOfflineCacheStats] = useState<{ cachedCount: number; totalCount: number }>({
    cachedCount: 0,
    totalCount: 0,
  });
  const [isDownloadingOffline, setIsDownloadingOffline] = useState<boolean>(false);
  const [downloadProgressText, setDownloadProgressText] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const refreshStats = async () => {
      const stats = await getOfflineCacheStats();
      if (mounted) setOfflineCacheStats(stats);
    };
    void refreshStats();
    window.addEventListener('offline_audio_cache_updated', refreshStats);
    return () => {
      mounted = false;
      window.removeEventListener('offline_audio_cache_updated', refreshStats);
    };
  }, []);

  const handleDownloadAllOffline = async () => {
    if (isDownloadingOffline) return;
    setIsDownloadingOffline(true);
    setDownloadProgressText('جاري تجهيز الصوتيات...');
    try {
      const stats = await downloadAllAudioForOffline((done, total) => {
        setDownloadProgressText(`تم حفظ ${toArabicDigits(done)} / ${toArabicDigits(total)}`);
        setOfflineCacheStats({ cachedCount: done, totalCount: total });
      });
      setOfflineCacheStats(stats);
    } finally {
      setIsDownloadingOffline(false);
      setDownloadProgressText(null);
    }
  };

  const [repeatCounts, setRepeatCounts] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const todayKey = new Date().toISOString().split('T')[0];
      const saved = localStorage.getItem(`ruqyah_counts_${todayKey}`);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const saveRepeatCount = (itemId: string, count: number) => {
    setRepeatCounts((prev) => {
      const next = { ...prev, [itemId]: count };
      try {
        const todayKey = new Date().toISOString().split('T')[0];
        localStorage.setItem(`ruqyah_counts_${todayKey}`, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const stopRuqyahPlayback = () => {
    playbackSessionRef.current += 1;
    if (ruqyahAudioRef.current) {
      ruqyahAudioRef.current.pause();
      ruqyahAudioRef.current.src = '';
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setPlayingItemId(null);
    setPlaylistMode('none');
    setAudioLoading(false);
    setAudioProgressLabel(null);
  };

  useEffect(() => {
    return () => {
      stopRuqyahPlayback();
      if (wakeLockRef.current) {
        wakeLockRef.current.release?.().catch(() => {});
      }
    };
  }, []);

  const toggleWakeLock = async () => {
    if (wakeLockActive) {
      try {
        await wakeLockRef.current?.release?.();
      } catch {
        // ignore
      }
      wakeLockRef.current = null;
      setWakeLockActive(false);
      return;
    }

    try {
      if ('wakeLock' in navigator && (navigator as any).wakeLock) {
        wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
        wakeLockRef.current.addEventListener?.('release', () => setWakeLockActive(false));
      }
      setWakeLockActive(true);
    } catch {
      setWakeLockActive(true);
    }
  };

  const playUrlWithFallbacks = async (urls: string[], sessionId: number): Promise<boolean> => {
    for (const rawUrl of urls) {
      if (playbackSessionRef.current !== sessionId) return false;
      setAudioLoading(true);
      const playableUrl = await resolvePlayableAudioUrl(rawUrl);
      if (playbackSessionRef.current !== sessionId) return false;

      const ok = await new Promise<boolean>((resolve) => {
        if (!ruqyahAudioRef.current) {
          ruqyahAudioRef.current = new Audio();
        }
        const audio = ruqyahAudioRef.current;
        audio.pause();
        audio.src = playableUrl;
        audio.oncanplay = () => setAudioLoading(false);
        audio.onended = () => {
          setAudioLoading(false);
          resolve(true);
        };
        audio.onerror = () => {
          setAudioLoading(false);
          resolve(false);
        };
        audio.play().catch(() => {
          setAudioLoading(false);
          resolve(false);
        });
      });

      if (playbackSessionRef.current !== sessionId) return false;
      if (ok) return true;
    }
    return false;
  };

  const playRuqyahItemAudio = async (
    item: RuqyahItem,
    reciter: RuqyahReciter,
    duaSheikhId: RuqyahDuaSheikh['id'],
    sessionId: number
  ): Promise<boolean> => {
    if (item.category === 'sunnah') {
      const sheikh = RUQYAH_DUA_SHEIKHS.find((s) => s.id === duaSheikhId) || RUQYAH_DUA_SHEIKHS[0];
      const tracks = item.duaTracksBySheikh?.[duaSheikhId] || item.duaTracksBySheikh?.ghamdi || [];

      for (let i = 0; i < tracks.length; i++) {
        if (playbackSessionRef.current !== sessionId) return false;
        const partLabel = tracks.length > 1 ? ` (${toArabicDigits(i + 1)}/${toArabicDigits(tracks.length)})` : '';
        setAudioProgressLabel(`بصوت ${sheikh.nameAr}${partLabel}`);
        const ok = await playUrlWithFallbacks(tracks[i].urls, sessionId);
        if (!ok || playbackSessionRef.current !== sessionId) {
          if (playbackSessionRef.current !== sessionId) return false;
          adhanPlayer.playChime();
          return false;
        }
      }
      return true;
    }

    // Play uninterrupted single continuous MP3 for Quran Ruqyah item (no pause/cut between verses)
    if (item.continuousTrackId) {
      setAudioProgressLabel(`${item.title} · بصوت ${reciter.nameAr} (تلاوة متصلة كاملة)`);
      const continuousUrls = buildContinuousRuqyahUrls(reciter, item.continuousTrackId);
      const completed = await playUrlWithFallbacks(continuousUrls, sessionId);
      if (playbackSessionRef.current !== sessionId) return false;
      if (completed) return true;
    }

    // Online fallback to individual verses only if continuous track failed to load
    const verses = item.verseCodes || [];
    for (let idx = 0; idx < verses.length; idx++) {
      if (playbackSessionRef.current !== sessionId) return false;
      const code = verses[idx];
      const urls = buildVerseAudioUrls(reciter.id, reciter.everyayahFolder, code);
      setAudioProgressLabel(`${item.title} · آية ${toArabicDigits(idx + 1)} من ${toArabicDigits(verses.length)}`);
      const completed = await playUrlWithFallbacks(urls, sessionId);
      if (!completed || playbackSessionRef.current !== sessionId) {
        return false;
      }
    }
    return true;
  };

  const handleTogglePlayItem = async (item: RuqyahItem) => {
    if (playingItemId === item.id) {
      stopRuqyahPlayback();
      return;
    }

    adhanPlayer.stop();
    stopRuqyahPlayback();
    const sessionId = ++playbackSessionRef.current;
    const reciter = RUQYAH_RECITERS.find((r) => r.id === selectedReciterId) || RUQYAH_RECITERS[0];

    setPlayingItemId(item.id);
    setPlaylistMode('none');
    await playRuqyahItemAudio(item, reciter, selectedDuaSheikhId, sessionId);
    if (playbackSessionRef.current === sessionId) {
      stopRuqyahPlayback();
    }
  };

  const handlePlayFullQuranRuqyah = async () => {
    if (playlistMode === 'quran') {
      stopRuqyahPlayback();
      return;
    }

    adhanPlayer.stop();
    stopRuqyahPlayback();
    const sessionId = ++playbackSessionRef.current;
    const reciter = RUQYAH_RECITERS.find((r) => r.id === selectedReciterId) || RUQYAH_RECITERS[0];
    const quranItems = RUQYAH_ITEMS.filter((it) => it.category === 'quran');

    setPlaylistMode('quran');
    for (let i = 0; i < quranItems.length; i++) {
      const item = quranItems[i];
      if (playbackSessionRef.current !== sessionId) break;
      // Pre-warm next track so card-to-card transitions are instant
      const nextItem = quranItems[i + 1];
      if (nextItem?.continuousTrackId) {
        void resolvePlayableAudioUrl(buildContinuousRuqyahUrls(reciter, nextItem.continuousTrackId)[0]);
      }
      setPlayingItemId(item.id);
      const ok = await playRuqyahItemAudio(item, reciter, selectedDuaSheikhId, sessionId);
      if (!ok) break;
    }
    if (playbackSessionRef.current === sessionId) {
      stopRuqyahPlayback();
    }
  };

  const handlePlayFullSunnahDuas = async () => {
    if (playlistMode === 'sunnah') {
      stopRuqyahPlayback();
      return;
    }

    adhanPlayer.stop();
    stopRuqyahPlayback();
    const sessionId = ++playbackSessionRef.current;
    const reciter = RUQYAH_RECITERS.find((r) => r.id === selectedReciterId) || RUQYAH_RECITERS[0];
    const sunnahItems = RUQYAH_ITEMS.filter((it) => it.category === 'sunnah');

    setPlaylistMode('sunnah');
    for (const item of sunnahItems) {
      if (playbackSessionRef.current !== sessionId) break;
      setPlayingItemId(item.id);
      const ok = await playRuqyahItemAudio(item, reciter, selectedDuaSheikhId, sessionId);
      if (!ok) break;
    }
    if (playbackSessionRef.current === sessionId) {
      stopRuqyahPlayback();
    }
  };

  const filteredRuqyahItems = useMemo(() => {
    if (ruqyahFilter === 'all') return RUQYAH_ITEMS;
    return RUQYAH_ITEMS.filter((it) => it.category === ruqyahFilter);
  }, [ruqyahFilter]);

  return (
    <div dir="rtl" className="max-w-5xl mx-auto space-y-6 animate-fade-in text-right">
      {/* Top Hero Header & 3-Segment Switcher */}
      <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/45 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl sm:text-3xl font-bold font-amiri text-[#F3CA63]">
              ❖ زاد المسلم الشامل ❖
            </h2>
            <p className="text-xs sm:text-sm text-slate-300">
              التقويم الهجري · رخصة المسافر · الرقية الشرعية · قضاء الفوائت · الحفظ والتسميع التفاعلي
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-300 shrink-0">
            <span>المدينة:</span>
            <span className="text-[#F3CA63] font-bold">{currentLocation.nameAr}</span>
          </div>
        </div>

        {/* 5-Segment Interactive View Switcher */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 bg-[#02110E] p-1.5 rounded-2xl border border-[#D4AF37]/30">
          <button
            type="button"
            onClick={() => handleSelectSubTab('calendar')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'calendar'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                : 'text-slate-300 hover:text-[#F3CA63] hover:bg-[#08241C]'
            }`}
          >
            <Calendar className="w-4 h-4 shrink-0" />
            <span>التقويم والمناسبات</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('travel')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'travel'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                : 'text-slate-300 hover:text-[#F3CA63] hover:bg-[#08241C]'
            }`}
          >
            <Plane className="w-4 h-4 shrink-0" />
            <span>رخصة المسافر</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('ruqyah')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'ruqyah'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                : 'text-slate-300 hover:text-[#F3CA63] hover:bg-[#08241C]'
            }`}
          >
            <ShieldPlus className="w-4 h-4 shrink-0" />
            <span>الرقية الشرعية</span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('qada')}
            className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'qada'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                : 'text-slate-300 hover:text-[#F3CA63] hover:bg-[#08241C]'
            }`}
          >
            <ListChecks className="w-4 h-4 shrink-0" />
            <span>
              قضاء الفوائت
              {qadaRemainingBadge > 0 ? ` (${toArabicDigits(qadaRemainingBadge)})` : ''}
            </span>
          </button>

          <button
            type="button"
            onClick={() => handleSelectSubTab('hifz')}
            className={`min-h-[44px] col-span-2 sm:col-span-1 px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all whitespace-nowrap ${
              activeSubTab === 'hifz'
                ? 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 shadow'
                : 'text-slate-300 hover:text-[#F3CA63] hover:bg-[#08241C]'
            }`}
          >
            <BookMarked className="w-4 h-4 shrink-0" />
            <span>
              الحفظ والتسميع
              {hifzDueBadge > 0 ? ` (${toArabicDigits(hifzDueBadge)})` : ''}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================
          SECTION 1: HIJRI MONTHLY CALENDAR & ISLAMIC OCCASIONS
         ============================================================ */}
      {activeSubTab === 'calendar' && (
        <div className="space-y-6">
          {/* Upcoming Islamic Occasions Countdown Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {upcomingEvents.slice(0, 3).map((ev) => (
              <div
                key={ev.id}
                className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/40 flex items-center justify-between gap-3"
              >
                <div className="space-y-1 min-w-0">
                  <div className="text-xs font-bold text-[#F3CA63] truncate">{ev.titleAr}</div>
                  <div className="text-[11px] text-slate-400">{ev.hijriDateLabel}</div>
                </div>
                <div className="text-left shrink-0">
                  <div className="text-xl font-black font-mono tabular-nums text-[#10B981]">
                    {ev.isToday ? 'اليوم' : `${toArabicDigits(ev.daysRemaining)}`}
                  </div>
                  {!ev.isToday && <span className="text-[10px] text-slate-400 block">يوماً متبقياً</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Main Calendar Grid + Selected Day Prayer Times */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            {/* Monthly Calendar Grid (2 columns on desktop) */}
            <div className="lg:col-span-2 rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/40 p-4 sm:p-6 space-y-4">
              {/* Month Switcher Header */}
              <div className="flex items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/25">
                <button
                  type="button"
                  onClick={() => setMonthOffset((m) => m - 1)}
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#111C18] border border-[#D4AF37]/40 text-[#F3CA63] hover:bg-[#172822] flex items-center justify-center gap-1 text-xs font-bold"
                  title="الشهر السابق"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span className="hidden sm:inline">السابق</span>
                </button>

                <div className="text-center">
                  <h3 className="text-lg sm:text-xl font-bold font-amiri text-[#F3CA63]">
                    {monthCalendar.hijriMonthNameAr} {toArabicDigits(monthCalendar.hijriYear)} هـ
                  </h3>
                  {monthOffset !== 0 && (
                    <button
                      type="button"
                      onClick={() => setMonthOffset(0)}
                      className="text-[11px] text-emerald-300 hover:underline mt-0.5"
                    >
                      العودة للشهر الحالي
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => setMonthOffset((m) => m + 1)}
                  className="min-h-[44px] min-w-[44px] px-3 rounded-xl bg-[#111C18] border border-[#D4AF37]/40 text-[#F3CA63] hover:bg-[#172822] flex items-center justify-center gap-1 text-xs font-bold"
                  title="الشهر التالي"
                >
                  <span className="hidden sm:inline">التالي</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold text-[#D4AF37] pb-1">
                {WEEKDAY_HEADERS_SAT_FIRST.map((w) => (
                  <div key={w} className="py-1 truncate">
                    {w}
                  </div>
                ))}
              </div>

              {/* 29/30 Days Grid */}
              <div className="grid grid-cols-7 gap-1.5">
                {Array.from({ length: leadingEmptyCells }).map((_, idx) => (
                  <div key={`empty-${idx}`} className="min-h-[60px]" aria-hidden="true" />
                ))}

                {monthCalendar.days.map((day) => {
                  const isSelected = selectedDay?.dateKey === day.dateKey;
                  return (
                    <button
                      key={day.dateKey}
                      type="button"
                      onClick={() => setSelectedDateKey(day.dateKey)}
                      className={`min-h-[62px] p-1.5 rounded-xl border flex flex-col items-center justify-between transition-all text-center ${
                        isSelected
                          ? 'bg-[#111C18] border-[#F3CA63] ring-2 ring-[#F3CA63]/40 text-white'
                          : day.isToday
                          ? 'bg-[#083027] border-[#10B981] text-white'
                          : day.isWhiteDay
                          ? 'bg-[#0A221C] border-[#D4AF37]/45 text-amber-100 hover:border-[#F3CA63]'
                          : 'bg-[#031410] border-[#D4AF37]/20 text-slate-200 hover:border-[#D4AF37]/50'
                      }`}
                      title={day.occasionLabel || `${day.hijriDay} ${day.hijriMonthNameAr}`}
                    >
                      <span className="text-sm sm:text-base font-black font-mono tabular-nums leading-none">
                        {toArabicDigits(day.hijriDay)}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono tabular-nums leading-none">
                        {day.gregorianDay} {day.gregorianMonthNameAr}
                      </span>
                      <div className="h-1.5 flex items-center justify-center gap-0.5">
                        {day.occasionLabel && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#F3CA63]" />
                        )}
                        {(day.isMonOrThu || day.isWhiteDay) && (
                          <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Legend (Clean text without pills) */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-3 border-t border-[#D4AF37]/20 text-xs text-slate-300">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#10B981]" />
                  <span>أيام صيام التطوع (البيض / الإثنين والخميس)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F3CA63]" />
                  <span>مناسبة إسلامية</span>
                </span>
              </div>
            </div>

            {/* Selected Day Details & Prayer Timetable */}
            {selectedDay && (
              <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/45 p-5 space-y-4">
                <div className="pb-3 border-b border-[#D4AF37]/25 space-y-1">
                  <div className="text-xs text-[#D4AF37] font-bold">
                    {selectedDay.weekdayAr} {selectedDay.isToday ? '· اليوم' : ''}
                  </div>
                  <h4 className="text-xl font-bold font-amiri text-white">
                    {toArabicDigits(selectedDay.hijriDay)} {selectedDay.hijriMonthNameAr}{' '}
                    {toArabicDigits(selectedDay.hijriYear)} هـ
                  </h4>
                  <div className="text-xs text-slate-400">
                    الموافق {selectedDay.gregorianDay} {selectedDay.gregorianMonthNameAr} {selectedDay.gregorianDate.getFullYear()} م
                  </div>
                </div>

                {/* Day Notes / Occasions */}
                {(selectedDay.occasionLabel || selectedDay.isMonOrThu || selectedDay.isFriday) && (
                  <div className="p-3 rounded-xl bg-[#071410] border border-[#10B981]/35 text-xs text-emerald-300 space-y-1">
                    {selectedDay.occasionLabel && (
                      <div className="font-bold text-[#F3CA63]">✦ {selectedDay.occasionLabel}</div>
                    )}
                    {selectedDay.isMonOrThu && <div>• يستحب صيام هذا اليوم ({selectedDay.weekdayAr})</div>}
                    {selectedDay.isFriday && <div>• يوم الجمعة: قراءة سورة الكهف والإكثار من الصلاة على النبي ﷺ</div>}
                  </div>
                )}

                {/* 6 Astronomical Prayer Times for the Selected Day */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-[#F3CA63] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" />
                    <span>مواقيت الصلاة لهذا اليوم:</span>
                  </div>
                  {[
                    { label: 'الفجر', time: selectedDay.prayerTimes.fajr },
                    { label: 'الشروق', time: selectedDay.prayerTimes.sunrise },
                    { label: selectedDay.isFriday ? 'الجمعة / الظهر' : 'الظهر', time: selectedDay.prayerTimes.dhuhr },
                    { label: 'العصر', time: selectedDay.prayerTimes.asr },
                    { label: 'المغرب', time: selectedDay.prayerTimes.maghrib },
                    { label: 'العشاء', time: selectedDay.prayerTimes.isha },
                  ].map((row) => (
                    <div
                      key={row.label}
                      className="flex items-center justify-between py-2 px-3 rounded-xl bg-[#08120F] border border-[#D4AF37]/20 text-xs sm:text-sm"
                    >
                      <span className="font-bold text-slate-200">{row.label}</span>
                      <span className="font-mono tabular-nums font-bold text-[#F3CA63]">
                        {format12HourAr(row.time)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 2: TRAVELER'S PRAYER CONCESSION (QASR & JAM')
         ============================================================ */}
      {activeSubTab === 'travel' && (
        <div className="space-y-6">
          {/* Travel Mode Master Card */}
          <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/45 p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#D4AF37]/25">
              <div className="space-y-1">
                <h3 className="text-xl font-bold font-amiri text-[#F3CA63] flex items-center gap-2">
                  <Plane className="w-5 h-5 text-[#10B981]" />
                  <span>تفعيل وضع المسافر (رخصة القصر والجمع)</span>
                </h3>
                <p className="text-xs text-slate-300">
                  عند التفعيل، يتم عرض عدد ركعات القصر وتوقيت الجمع في المحراب الرئيسي لمساعدتك طوال سفرك.
                </p>
              </div>

              <button
                type="button"
                onClick={() => onUpdateSettings({ travelModeEnabled: !travelEnabled })}
                className={`min-h-[44px] px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 ${
                  travelEnabled
                    ? 'bg-[#10B981] text-slate-950 shadow-[0_0_20px_rgba(16,185,129,0.35)]'
                    : 'bg-[#111C18] border border-[#D4AF37]/50 text-[#F3CA63] hover:bg-[#172822]'
                }`}
              >
                {travelEnabled ? (
                  <>
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>وضع المسافر مفعّل الآن</span>
                  </>
                ) : (
                  <span>تفعيل وضع المسافر</span>
                )}
              </button>
            </div>

            {/* Distance Estimator & Jam' Preference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/30 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="text-[#F3CA63]">مسافة السفر التقريبية (كم):</span>
                  <span className="font-mono tabular-nums text-white text-sm">
                    {toArabicDigits(travelDistance)} كم
                  </span>
                </div>
                <input
                  type="range"
                  min={20}
                  max={500}
                  step={5}
                  value={travelDistance}
                  onChange={(e) => onUpdateSettings({ travelDistanceKm: Number(e.target.value) })}
                  className="w-full accent-[#D4AF37] cursor-pointer"
                />
                <div
                  className={`text-xs font-medium ${
                    meetsQasrDistance ? 'text-[#10B981]' : 'text-amber-300'
                  }`}
                >
                  {meetsQasrDistance
                    ? '✓ المسافة تجاوزت حد القصر الشرعي (نحو ٨١–٨٥ كم)؛ تجوز رخصة القصر والجمع.'
                    : '• أقل من مسافة القصر المعتمدة عند جمهور العلماء (نحو ٨١ كم).'}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#111C18] border border-[#D4AF37]/30 space-y-3">
                <div className="text-xs font-bold text-[#F3CA63]">نظام الجمع المفضل أثناء السفر:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ travelJamType: 'taqdeem' })}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      travelJamType === 'taqdeem'
                        ? 'bg-[#083027] border-[#10B981] text-emerald-300'
                        : 'bg-[#07120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    جمع تقديم (في وقت الأولى)
                  </button>
                  <button
                    type="button"
                    onClick={() => onUpdateSettings({ travelJamType: 'takheer' })}
                    className={`min-h-[44px] px-3 py-2 rounded-xl border text-xs font-bold transition-all ${
                      travelJamType === 'takheer'
                        ? 'bg-[#083027] border-[#10B981] text-emerald-300'
                        : 'bg-[#07120F] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                    }`}
                  >
                    جمع تأخير (في وقت الثانية)
                  </button>
                </div>
                <div className="text-[11px] text-slate-400">
                  {travelJamType === 'taqdeem'
                    ? 'تُصلى الثانية مع الأولى في وقت الأولى مع استحضار نية الجمع قبل التسليم من الأولى.'
                    : 'تُنوى تأخير الأولى في وقتها لتُصلى مع الثانية في وقت الثانية.'}
                </div>
              </div>
            </div>
          </div>

          {/* 5-Prayer Qasr Table + Jam' Windows */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Qasr Rakat Breakdown */}
            <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-4">
              <h4 className="text-lg font-bold font-amiri text-[#F3CA63]">
                ❖ جدول ركعات الصلاة في السفر (القصر) ❖
              </h4>
              <div className="space-y-2.5">
                {[
                  { name: 'صلاة الفجر', normal: '٢ ركعتان', travel: '٢ ركعتان (لا تُقصر)', isShortened: false },
                  { name: 'صلاة الظهر', normal: '٤ ركعات', travel: '٢ ركعتان قصراً', isShortened: true },
                  { name: 'صلاة العصر', normal: '٤ ركعات', travel: '٢ ركعتان قصراً', isShortened: true },
                  { name: 'صلاة المغرب', normal: '٣ ركعات', travel: '٣ ركعات (لا تُقصر)', isShortened: false },
                  { name: 'صلاة العشاء', normal: '٤ ركعات', travel: '٢ ركعتان قصراً', isShortened: true },
                ].map((row) => (
                  <div
                    key={row.name}
                    className="flex items-center justify-between gap-3 p-3 rounded-xl bg-[#07120F] border border-[#D4AF37]/20 text-xs sm:text-sm"
                  >
                    <span className="font-bold text-white">{row.name}</span>
                    <div className="flex items-center gap-2 text-left">
                      <span className="text-slate-500 line-through text-[11px]">{row.isShortened ? row.normal : ''}</span>
                      <span className={`font-bold ${row.isShortened ? 'text-[#10B981]' : 'text-[#F3CA63]'}`}>
                        {row.travel}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-300 leading-relaxed pt-2 border-t border-[#D4AF37]/20">
                السنن في السفر: يُشرع ترك السنن الرواتب للظهر والمغرب والعشاء تخفيفاً، مع المواظبة على سنة الفجر والوتر.
              </p>
            </div>

            {/* Today's Jam' Windows */}
            <div className="rounded-3xl bg-[#111C18] border border-[#D4AF37]/40 p-5 space-y-4">
              <h4 className="text-lg font-bold font-amiri text-[#F3CA63]">
                ❖ نوافذ الجمع المتاحة اليوم ({currentLocation.nameAr}) ❖
              </h4>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-[#07120F] border border-[#10B981]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">الظهر + العصر (ركعتان + ركعتان)</span>
                    <span className="text-xs font-bold text-[#10B981]">
                      {travelJamType === 'taqdeem' ? 'وقت التقديم' : 'وقت التأخير'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono tabular-nums">
                    {travelJamType === 'taqdeem'
                      ? `يُصليان معاً في وقت الظهر: من ${format12HourAr(prayerTimes.dhuhr)} حتى قبيل ${format12HourAr(prayerTimes.asr)}`
                      : `يُصليان معاً في وقت العصر: من ${format12HourAr(prayerTimes.asr)} حتى قبيل ${format12HourAr(prayerTimes.maghrib)}`}
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#07120F] border border-[#D4AF37]/30 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-white">المغرب + العشاء (٣ ركعات + ركعتان)</span>
                    <span className="text-xs font-bold text-[#F3CA63]">
                      {travelJamType === 'taqdeem' ? 'وقت التقديم' : 'وقت التأخير'}
                    </span>
                  </div>
                  <div className="text-xs text-slate-300 font-mono tabular-nums">
                    {travelJamType === 'taqdeem'
                      ? `يُصليان معاً في وقت المغرب: من ${format12HourAr(prayerTimes.maghrib)} حتى قبيل ${format12HourAr(prayerTimes.isha)}`
                      : `يُصليان معاً في وقت العشاء: من ${format12HourAr(prayerTimes.isha)} حتى قبيل الفجر`}
                  </div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-[#041b16] border border-[#D4AF37]/25 text-xs text-slate-300 space-y-1.5 leading-relaxed">
                <div className="font-bold text-[#F3CA63]">ضوابط مختصرة مهمة:</div>
                <div>١. الترتيب: يُصلّى الظهر قبل العصر، والمغرب قبل العشاء.</div>
                <div>٢. الموالاة في جمع التقديم: عدم الفصل الطويل بين الصلاتين (إقامة لكل صلاة).</div>
                <div>٣. إن صلّى المسافر خلف إمام مقيم في المسجد وجب عليه الإتمام ٤ ركعات.</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 3: RUQYAH SHARIAH & HEALING INVOCATIONS
         ============================================================ */}
      {activeSubTab === 'ruqyah' && (
        <div className="space-y-5">
          {/* Audio & Reading Toolbar */}
          <div className="rounded-3xl bg-[#041b16]/95 border border-[#D4AF37]/45 p-4 sm:p-5 space-y-4">
            {/* Row 1: Quran Ruqyah Reciter + Sunnah Duas Sheikh Selector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Quran Reciter */}
              <div className="p-3 rounded-2xl bg-[#071410] border border-[#D4AF37]/30 space-y-2">
                <div className="text-[11px] font-bold text-[#F3CA63] flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-[#10B981]" />
                  <span>قارئ آيات الرقية والشفاء (متاح بدون نت):</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedReciterId}
                    onChange={(e) => {
                      stopRuqyahPlayback();
                      setSelectedReciterId(e.target.value);
                    }}
                    className="flex-1 min-h-[44px] bg-[#111C18] border border-[#D4AF37]/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-[#F3CA63]"
                    aria-label="اختيار القارئ للرقية القرآنية"
                  >
                    {RUQYAH_RECITERS.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.nameAr}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handlePlayFullQuranRuqyah}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      playlistMode === 'quran'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-gradient-to-r from-[#D4AF37] to-[#B8962E] text-slate-950 hover:brightness-105'
                    }`}
                  >
                    {playlistMode === 'quran' ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف الآيات</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تشغيل الآيات كاملة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Famous Sheikh for Prophetic Duas */}
              <div className="p-3 rounded-2xl bg-[#071410] border border-[#10B981]/35 space-y-2">
                <div className="text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-[#F3CA63]" />
                  <span>الشيخ قارئ الأدعية النبوية المأثورة (بدون نت):</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedDuaSheikhId}
                    onChange={(e) => {
                      const val = e.target.value as RuqyahDuaSheikh['id'];
                      stopRuqyahPlayback();
                      setSelectedDuaSheikhId(val);
                      try {
                        localStorage.setItem('ruqyah_dua_sheikh', val);
                      } catch {
                        // ignore
                      }
                    }}
                    className="flex-1 min-h-[44px] bg-[#111C18] border border-emerald-500/40 rounded-xl px-3 py-2 text-xs sm:text-sm text-white font-bold focus:outline-none focus:border-[#10B981]"
                    aria-label="اختيار الشيخ للأدعية النبوية"
                  >
                    {RUQYAH_DUA_SHEIKHS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.nameAr}
                      </option>
                    ))}
                  </select>

                  <button
                    type="button"
                    onClick={handlePlayFullSunnahDuas}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                      playlistMode === 'sunnah'
                        ? 'bg-rose-600 text-white shadow'
                        : 'bg-[#10B981] text-slate-950 hover:brightness-105'
                    }`}
                  >
                    {playlistMode === 'sunnah' ? (
                      <>
                        <Square className="w-3.5 h-3.5 fill-current" />
                        <span>إيقاف الأدعية</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>تشغيل الأدعية كاملة</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {audioProgressLabel && (
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#08241C] border border-[#10B981]/40 text-xs text-[#10B981] font-bold">
                {audioLoading && <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />}
                <span>جاري التشغيل: {audioProgressLabel}</span>
              </div>
            )}

            {/* Row 2: Offline Audio Vault + Font Size + Wake Lock */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pt-1">
              {/* Offline Vault Button */}
              <button
                type="button"
                onClick={handleDownloadAllOffline}
                disabled={isDownloadingOffline}
                className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  offlineCacheStats.totalCount > 0 &&
                  offlineCacheStats.cachedCount >= offlineCacheStats.totalCount
                    ? 'bg-[#083027] border-[#10B981]/60 text-emerald-300'
                    : 'bg-[#111C18] border-[#D4AF37]/45 text-[#F3CA63] hover:bg-[#172822]'
                }`}
              >
                {isDownloadingOffline ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-[#F3CA63]" />
                    <span>{downloadProgressText || 'جاري الحفظ بدون إنترنت...'}</span>
                  </>
                ) : offlineCacheStats.totalCount > 0 &&
                  offlineCacheStats.cachedCount >= offlineCacheStats.totalCount ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-[#10B981]" />
                    <span>
                      كل صوتيات التطبيق محفوظة بدون نت ({toArabicDigits(offlineCacheStats.cachedCount)} /{' '}
                      {toArabicDigits(offlineCacheStats.totalCount)})
                    </span>
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4 text-[#F3CA63]" />
                    <span>
                      حفظ كل صوتيات التطبيق للعمل بدون نت (
                      {toArabicDigits(offlineCacheStats.cachedCount)} /{' '}
                      {toArabicDigits(offlineCacheStats.totalCount)})
                    </span>
                  </>
                )}
              </button>

              {/* Font Size + Wake Lock */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1 bg-[#111C18] p-1 rounded-xl border border-[#D4AF37]/30">
                  <button
                    type="button"
                    onClick={() => setRuqyahFontSize((s) => Math.max(18, s - 2))}
                    className="min-w-[40px] min-h-[40px] px-2 rounded-lg text-slate-200 hover:text-[#F3CA63] text-xs font-bold flex items-center justify-center gap-0.5"
                    title="تصغير الخط"
                  >
                    <span>أ-</span>
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="text-xs font-mono tabular-nums text-slate-400 px-1">
                    {ruqyahFontSize}
                  </span>
                  <button
                    type="button"
                    onClick={() => setRuqyahFontSize((s) => Math.min(34, s + 2))}
                    className="min-w-[40px] min-h-[40px] px-2 rounded-lg text-slate-200 hover:text-[#F3CA63] text-xs font-bold flex items-center justify-center gap-0.5"
                    title="تكبير الخط"
                  >
                    <span>أ+</span>
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={toggleWakeLock}
                  className={`min-h-[44px] px-3.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                    wakeLockActive
                      ? 'bg-[#10B981]/20 border-[#10B981] text-emerald-300'
                      : 'bg-[#111C18] border-[#D4AF37]/40 text-[#F3CA63] hover:bg-[#172822]'
                  }`}
                >
                  <Lightbulb className="w-4 h-4" />
                  <span>{wakeLockActive ? 'الشاشة مضاءة ✓' : 'إبقاء الشاشة مضاءة'}</span>
                </button>
              </div>
            </div>

            {/* Category Filter Buttons */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#D4AF37]/20">
              {[
                { id: 'all', label: 'الكل (القرآن والسنة)' },
                { id: 'quran', label: 'آيات الشفاء والتحصين' },
                { id: 'sunnah', label: 'الأدعية النبوية المأثورة' },
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setRuqyahFilter(f.id as any)}
                  className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                    ruqyahFilter === f.id
                      ? 'bg-[#083027] border-[#10B981] text-emerald-300'
                      : 'bg-[#111C18] border-[#D4AF37]/25 text-slate-300 hover:border-[#D4AF37]/60'
                  }`}
                >
                  {f.label}
                </button>
              ))}
              <span className="mr-auto text-[11px] text-emerald-300/80 flex items-center gap-1">
                <WifiOff className="w-3.5 h-3.5 text-[#F3CA63]" />
                <span>الآيات والأدعية تعمل بدون إنترنت</span>
              </span>
            </div>
          </div>

          {/* Ruqyah Cards List */}
          <div className="space-y-4">
            {filteredRuqyahItems.map((item) => {
              const isPlaying = playingItemId === item.id;
              const currentCount = repeatCounts[item.id] || 0;
              const isDone = currentCount >= item.recommendedCount;

              return (
                <div
                  key={item.id}
                  className={`rounded-3xl p-5 sm:p-6 border transition-all space-y-4 ${
                    isPlaying
                      ? 'bg-[#08241C] border-[#10B981] shadow-[0_0_25px_rgba(16,185,129,0.2)]'
                      : 'bg-[#111C18] border-[#D4AF37]/35'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#D4AF37]/20">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold font-amiri text-[#F3CA63]">
                        {item.title}
                      </h4>
                      <span className="text-xs text-slate-400">{item.source}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePlayItem(item)}
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all ${
                          isPlaying
                            ? 'bg-rose-600 border-rose-500 text-white'
                            : 'bg-[#071410] border-[#D4AF37]/45 text-[#F3CA63] hover:bg-[#172822]'
                        }`}
                      >
                        {isPlaying ? (
                          <>
                            <Square className="w-3.5 h-3.5 fill-current" />
                            <span>إيقاف</span>
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5 fill-current" />
                            <span>استماع</span>
                          </>
                        )}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          saveRepeatCount(item.id, Math.min(item.recommendedCount, currentCount + 1))
                        }
                        className={`min-h-[44px] px-4 py-2 rounded-xl border text-xs font-mono font-bold tabular-nums flex items-center gap-1.5 transition-all ${
                          isDone
                            ? 'bg-[#10B981] border-emerald-400 text-slate-950'
                            : 'bg-[#071410] border-[#10B981]/50 text-emerald-300 hover:bg-[#083027]'
                        }`}
                        title="اضغط لاحتساب تكرار القراءة"
                      >
                        {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span>
                          {toArabicDigits(currentCount)} / {toArabicDigits(item.recommendedCount)}
                        </span>
                      </button>

                      {currentCount > 0 && (
                        <button
                          type="button"
                          onClick={() => saveRepeatCount(item.id, 0)}
                          className="min-w-[40px] min-h-[40px] rounded-xl bg-[#071410] border border-[#D4AF37]/25 text-slate-400 hover:text-white flex items-center justify-center"
                          title="إعادة تصفير العدّاد"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Tashkeel Text */}
                  <p
                    style={{ fontSize: `${ruqyahFontSize}px`, lineHeight: 1.95 }}
                    className="font-amiri text-amber-50 whitespace-pre-line leading-loose"
                  >
                    {item.arabicText}
                  </p>

                  {/* Virtue / Guidance */}
                  <div className="pt-2 border-t border-[#D4AF37]/15 text-xs text-emerald-300/90">
                    {item.virtue}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================
          SECTION 4: QADA PRAYERS & FASTING PLANNER
         ============================================================ */}
      {activeSubTab === 'qada' && (
        <QadaPlannerPanel
          onTestReminder={
            onTestCompanionReminder ? () => onTestCompanionReminder('qada') : undefined
          }
        />
      )}

      {/* ============================================================
          SECTION 5: HIFZ & INTERACTIVE TASMI' COMPANION
         ============================================================ */}
      {activeSubTab === 'hifz' && (
        <HifzCompanionPanel
          onTestReminder={
            onTestCompanionReminder ? () => onTestCompanionReminder('hifz') : undefined
          }
        />
      )}
    </div>
  );
};
