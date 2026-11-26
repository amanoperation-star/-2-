import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  GitBranch,
  RotateCcw,
  Smartphone,
  Terminal,
  Tv,
  AlertCircle,
} from 'lucide-react';

const GITHUB_REPO_STORAGE_KEY = 'apk_github_repo_url';
const CHECKLIST_STORAGE_KEY = 'apk_guide_checklist_v1';
const DEVICE_TAB_STORAGE_KEY = 'apk_guide_device_tab';

type DeviceGuideTab = 'mobile' | 'tv';

interface GuideStep {
  id: string;
  num: string;
  title: string;
  description: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 'push_repo',
    num: '01',
    title: 'رفع ملفات المشروع إلى مستودع GitHub',
    description:
      'قم بتنزيل ملفات المشروع من هنا ثم ارفعها إلى مستودع GitHub خاص بك (أو حدّث المستودع الحالي بالملفات الجديدة).',
  },
  {
    id: 'run_action',
    num: '02',
    title: 'تشغيل مسار البناء السحابي في تبويب Actions',
    description:
      'افتح تبويب Actions داخل مستودعك، واختر مسار Build Android APK (Mobile & Android TV) ثم اضغط Run workflow وانتظر نحو 3 دقائق.',
  },
  {
    id: 'download_apk',
    num: '03',
    title: 'تنزيل ملف APK الجاهز',
    description:
      'بعد ظهور علامة الصح الخضراء، انزل إلى قسم Artifacts وحمّل almawaqeet-mihrab-android-tv-mobile-apk وفك ضغطه، أو حمّل APK مباشرة من صفحة Releases.',
  },
  {
    id: 'install_device',
    num: '04',
    title: 'التثبيت على هاتف الأندرويد أو شاشة Android TV',
    description:
      'اتبع خطوات الجهاز بالأسفل لتثبيت الملف وتشغيل التطبيق بدون إنترنت بالريموت أو اللمس.',
  },
];

function normalizeGitHubRepoUrl(rawInput: string): {
  isEmpty: boolean;
  isValid: boolean;
  normalizedUrl: string;
  slug: string;
} {
  const trimmed = rawInput.trim();
  if (!trimmed) {
    return { isEmpty: true, isValid: false, normalizedUrl: '', slug: '' };
  }

  let candidate = trimmed;
  if (/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(candidate)) {
    candidate = `https://github.com/${candidate}`;
  } else if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    const host = parsed.hostname.toLowerCase();
    if (host !== 'github.com' && host !== 'www.github.com') {
      return { isEmpty: false, isValid: false, normalizedUrl: '', slug: '' };
    }
    const segments = parsed.pathname
      .replace(/\.git$/i, '')
      .split('/')
      .filter(Boolean);
    if (segments.length < 2) {
      return { isEmpty: false, isValid: false, normalizedUrl: '', slug: '' };
    }
    const owner = segments[0];
    const repo = segments[1];
    const slug = `${owner}/${repo}`;
    return {
      isEmpty: false,
      isValid: true,
      normalizedUrl: `https://github.com/${slug}`,
      slug,
    };
  } catch {
    return { isEmpty: false, isValid: false, normalizedUrl: '', slug: '' };
  }
}

function loadSavedChecklist(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CHECKLIST_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

export const ApkGuideCard: React.FC = () => {
  const [repoInput, setRepoInput] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return localStorage.getItem(GITHUB_REPO_STORAGE_KEY) || '';
  });

  const [deviceTab, setDeviceTab] = useState<DeviceGuideTab>(() => {
    if (typeof window === 'undefined') return 'tv';
    return localStorage.getItem(DEVICE_TAB_STORAGE_KEY) === 'mobile' ? 'mobile' : 'tv';
  });

  const [checklist, setChecklist] = useState<Record<string, boolean>>(() => loadSavedChecklist());
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(GITHUB_REPO_STORAGE_KEY, repoInput);
    }
  }, [repoInput]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(DEVICE_TAB_STORAGE_KEY, deviceTab);
    }
  }, [deviceTab]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(checklist));
      } catch {
        // ignore storage quota errors
      }
    }
  }, [checklist]);

  const parsedRepo = useMemo(() => normalizeGitHubRepoUrl(repoInput), [repoInput]);
  const completedCount = GUIDE_STEPS.filter((step) => checklist[step.id]).length;

  const actionsUrl = parsedRepo.isValid ? `${parsedRepo.normalizedUrl}/actions` : '';
  const releasesUrl = parsedRepo.isValid ? `${parsedRepo.normalizedUrl}/releases` : '';
  const directApkUrl = parsedRepo.isValid
    ? `${parsedRepo.normalizedUrl}/releases/latest/download/almawaqeet-mihrab-android-tv.apk`
    : '';

  const handleCopy = async (id: string, text: string) => {
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      window.setTimeout(() => {
        setCopiedId((prev) => (prev === id ? null : prev));
      }, 2200);
    } catch {
      // ignore clipboard permissions
    }
  };

  const toggleStep = (id: string) => {
    setChecklist((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const resetChecklist = () => {
    setChecklist({});
  };

  return (
    <div className="p-5 rounded-3xl bg-[#03201a]/85 border border-[#e5b869]/35 space-y-5 shadow-lg text-right" dir="rtl">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-[#e5b869]/20">
        <div className="space-y-1">
          <h4 className="text-base sm:text-lg font-bold font-amiri text-[#fbbf24]">
            دليل استخراج ملف APK وتثبيته على الهاتف وشاشات Android TV
          </h4>
          <p className="text-xs text-slate-300 tabular-nums">
            البناء السحابي عبر GitHub Actions بدون برامج · التقدّم: {completedCount} من {GUIDE_STEPS.length} خطوات
          </p>
        </div>
        {completedCount > 0 && (
          <button
            type="button"
            onClick={resetChecklist}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-[#041814] border border-[#e5b869]/30 text-slate-300 hover:text-[#fbbf24] hover:border-[#fbbf24]/60 text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>إعادة ضبط الخطوات</span>
          </button>
        )}
      </div>

      {/* GitHub Repository Link & Quick Release/Actions Links */}
      <div className="p-4 rounded-2xl bg-[#041814] border border-[#e5b869]/30 space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <label htmlFor="apk-github-repo-input" className="text-xs sm:text-sm font-bold text-[#fbbf24] flex items-center gap-2">
            <GitBranch className="w-4 h-4 shrink-0" />
            <span>رابط مستودعك على GitHub (لتوليد روابط التحميل والإصدارات مباشرة)</span>
          </label>
          {parsedRepo.isValid && (
            <span className="text-[11px] font-mono text-emerald-300 tabular-nums" dir="ltr">
              {parsedRepo.slug}
            </span>
          )}
        </div>

        <input
          id="apk-github-repo-input"
          type="text"
          dir="ltr"
          value={repoInput}
          onChange={(e) => setRepoInput(e.target.value)}
          placeholder="https://github.com/username/almawaqeet-app  أو  username/repo"
          className="w-full min-h-[44px] bg-[#02120f] border border-[#e5b869]/35 rounded-xl px-4 py-2.5 text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-[#fbbf24]"
        />

        {!parsedRepo.isEmpty && !parsedRepo.isValid && (
          <div className="flex items-center gap-2 text-xs text-amber-300">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>أدخل رابط مستودع GitHub صحيح مثل: https://github.com/user/repo أو user/repo</span>
          </div>
        )}

        {parsedRepo.isValid ? (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <a
              href={actionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 font-black text-xs flex items-center gap-1.5 hover:brightness-105 transition-all whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
              <span>فتح صفحة Actions للبناء</span>
            </a>

            <a
              href={releasesUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#062d24] border border-emerald-500/45 text-emerald-200 hover:border-emerald-400 font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5 shrink-0" />
              <span>صفحة الإصدارات (Releases)</span>
            </a>

            <button
              type="button"
              onClick={() => void handleCopy('direct_apk', directApkUrl)}
              className="min-h-[44px] px-4 py-2 rounded-xl bg-[#05221c] border border-[#e5b869]/40 text-[#fbbf24] hover:border-[#fbbf24] font-bold text-xs flex items-center gap-1.5 transition-colors whitespace-nowrap"
              title="ينسخ الرابط المباشر لأحدث إصدار لاستخدامه في تطبيق Downloader على شاشة التلفاز"
            >
              <Copy className="w-3.5 h-3.5 shrink-0" />
              <span>{copiedId === 'direct_apk' ? 'تم نسخ رابط التلفاز ✓' : 'نسخ رابط APK المباشر للتلفاز'}</span>
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-slate-400 leading-relaxed">
            عند لصق رابط مستودعك بالأعلى، ستظهر أزرار مباشرة لفتح <strong>GitHub Actions</strong> و<strong>Releases</strong> ونسخ رابط التحميل لتطبيق <strong>Downloader</strong> على شاشة التلفاز.
          </p>
        )}
      </div>

      {/* Interactive 4-Step Checklist */}
      <div className="space-y-2.5">
        <div className="text-xs font-bold text-slate-300">خطوات استخراج ملف APK (اضغط على الخطوة لتسجيل إتمامها):</div>
        <div className="space-y-2">
          {GUIDE_STEPS.map((step) => {
            const isDone = Boolean(checklist[step.id]);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggleStep(step.id)}
                className={`w-full min-h-[56px] p-3.5 rounded-2xl border text-right flex items-start gap-3 transition-all ${
                  isDone
                    ? 'bg-emerald-950/45 border-emerald-500/50 text-emerald-100'
                    : 'bg-[#041814] border-[#e5b869]/25 hover:border-[#fbbf24]/55 text-slate-200'
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 mt-0.5 border font-mono text-xs font-bold tabular-nums transition-colors ${
                    isDone
                      ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                      : 'bg-[#02120f] border-[#e5b869]/45 text-[#fbbf24]'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : step.num}
                </div>
                <div className="space-y-0.5 flex-1">
                  <div className={`text-xs sm:text-sm font-bold ${isDone ? 'line-through text-emerald-300' : 'text-white'}`}>
                    {step.title}
                  </div>
                  <p className="text-[11px] sm:text-xs text-slate-300 leading-relaxed">{step.description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Device-Specific Installation Switcher (Mobile vs Android TV / Google TV) */}
      <div className="space-y-3 pt-2 border-t border-[#e5b869]/20">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="text-xs sm:text-sm font-bold text-[#fbbf24]">
            دليل التثبيت حسب جهازك:
          </div>
          <div className="inline-flex items-center p-1 rounded-xl bg-[#02120f] border border-[#e5b869]/30 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setDeviceTab('tv')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                deviceTab === 'tv'
                  ? 'bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Tv className="w-3.5 h-3.5 shrink-0" />
              <span>شاشة Android TV / Google TV</span>
            </button>
            <button
              type="button"
              onClick={() => setDeviceTab('mobile')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                deviceTab === 'mobile'
                  ? 'bg-gradient-to-r from-[#fbbf24] to-[#d97706] text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-[#fbbf24]'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span>هاتف أندرويد</span>
            </button>
          </div>
        </div>

        {deviceTab === 'tv' ? (
          <div className="p-4 rounded-2xl bg-[#041814] border border-emerald-500/30 space-y-2.5 text-xs text-slate-200 leading-relaxed">
            <div className="font-bold text-emerald-300">
              طرق تثبيت الـ APK على شاشات Android TV و Google TV:
            </div>
            <ol className="space-y-1.5 list-decimal list-inside">
              <li>
                <strong>عبر تطبيق Send Files to TV (الأسهل لاسلكياً):</strong> نزّل ملف الـ APK على هاتفك، وثبّت تطبيق <em>Send Files to TV</em> على الهاتف والشاشة معاً (على نفس شبكة الواي فاي)، ثم أرسل الملف إلى التلفاز وافتحه للتثبيت.
              </li>
              <li>
                <strong>أو عبر تطبيق Downloader من الشاشة مباشرة:</strong> إذا نشرت إصداراً في <em>Releases</em>، افتح تطبيق <em>Downloader</em> على التلفاز والصق رابط التحميل المباشر المنسوخ من الأعلى.
              </li>
              <li>
                <strong>أو عبر فلاشة USB:</strong> انسخ ملف الـ APK إلى فلاشة USB وأدخلها في الشاشة ثم افتح الملف من أي مدير ملفات مثل <em>FX File Explorer</em>.
              </li>
              <li>
                <strong>تفعيل الأذونات والريموت:</strong> عند طلب الشاشة، فعّل خيار <em>السماح بالتطبيقات غير المعروفة</em> للتطبيق المثبّت، وبعد التثبيت سيظهر التطبيق ببانر شاشة التلفاز مع تحكم كامل بأسهم الريموت ومنع إطفاء الشاشة.
              </li>
            </ol>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-[#041814] border border-[#e5b869]/30 space-y-2.5 text-xs text-slate-200 leading-relaxed">
            <div className="font-bold text-[#fbbf24]">
              خطوات التثبيت على هاتف أو تابلت الأندرويد:
            </div>
            <ol className="space-y-1.5 list-decimal list-inside">
              <li>
                حمّل ملف <strong>app-debug.apk</strong> (أو <strong>almawaqeet-mihrab-android-tv.apk</strong>) من صفحة <em>Actions Artifacts</em> أو من <em>Releases</em> على هاتفك.
              </li>
              <li>
                اضغط على الملف من الإشعارات أو مدير الملفات؛ وإذا ظهرت رسالة أمان اختر <strong>الإعدادات</strong> وفعّل <strong>السماح من هذا المصدر</strong>.
              </li>
              <li>
                اضغط <strong>تثبيت (Install)</strong>، وبمجرد الانتهاء يعمل التطبيق كاملاً بدون إنترنت مع المواقيت والأذان الأساسي، ويمكنك تنزيل باقي أصوات الشيوخ من قسم <em>حفظ بدون نت</em> في الإعدادات.
              </li>
            </ol>
          </div>
        )}
      </div>

      {/* Optional Developer Quick Commands */}
      <div className="pt-2 border-t border-[#e5b869]/15 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Terminal className="w-3.5 h-3.5 text-[#fbbf24] shrink-0" />
          <span>أوامر سريعة للمزامنة أو إنشاء إصدار Release جديد:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void handleCopy('apk_sync_cmd', 'npm run apk:sync')}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#052921] border border-[#e5b869]/35 text-[#fbbf24] hover:border-[#fbbf24] text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3 h-3 shrink-0" />
            <span>{copiedId === 'apk_sync_cmd' ? 'تم نسخ أمر المزامنة ✓' : 'نسخ: npm run apk:sync'}</span>
          </button>
          <button
            type="button"
            onClick={() => void handleCopy('tag_release_cmd', 'git tag v1.0.0 && git push origin v1.0.0')}
            className="min-h-[38px] px-3 py-1.5 rounded-xl bg-[#052921] border border-emerald-500/35 text-emerald-300 hover:border-emerald-400 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
          >
            <Copy className="w-3 h-3 shrink-0" />
            <span>{copiedId === 'tag_release_cmd' ? 'تم نسخ أمر الإصدار ✓' : 'نسخ أمر نشر Release'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
