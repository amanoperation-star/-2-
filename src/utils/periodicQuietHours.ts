function parseTimeMinutes(hhmm: string | undefined, fallbackMinutes: number): number {
  if (!hhmm || !hhmm.includes(':')) return fallbackMinutes;
  const [hRaw, mRaw] = hhmm.trim().split(':').map(Number);
  if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return fallbackMinutes;
  const h = Math.max(0, Math.min(23, Math.floor(hRaw)));
  const m = Math.max(0, Math.min(59, Math.floor(mRaw)));
  return h * 60 + m;
}

export function isWithinPeriodicQuietHours(
  date: Date,
  startHHmm: string = '23:00',
  endHHmm: string = '06:00'
): boolean {
  const startMin = parseTimeMinutes(startHHmm, 23 * 60);
  const endMin = parseTimeMinutes(endHHmm, 6 * 60);
  if (startMin === endMin) return false;

  const currentMin = date.getHours() * 60 + date.getMinutes();
  if (startMin > endMin) {
    // Spans across midnight (e.g. 23:00 -> 06:00)
    return currentMin >= startMin || currentMin < endMin;
  }
  // Same-day window (e.g. 00:30 -> 05:30)
  return currentMin >= startMin && currentMin < endMin;
}

export function getNextTimeAfterPeriodicQuietHours(
  date: Date,
  startHHmm: string = '23:00',
  endHHmm: string = '06:00'
): Date {
  if (!isWithinPeriodicQuietHours(date, startHHmm, endHHmm)) {
    return new Date(date.getTime());
  }
  const startMin = parseTimeMinutes(startHHmm, 23 * 60);
  const endMin = parseTimeMinutes(endHHmm, 6 * 60);
  const endHour = Math.floor(endMin / 60);
  const endMinute = endMin % 60;

  const target = new Date(date.getTime());
  target.setSeconds(0, 0);
  target.setHours(endHour, endMinute, 0, 0);

  const currentMin = date.getHours() * 60 + date.getMinutes();
  if (startMin > endMin && currentMin >= startMin) {
    target.setDate(target.getDate() + 1);
  }
  if (target.getTime() <= date.getTime()) {
    target.setDate(target.getDate() + 1);
  }
  return target;
}

export function formatQuietTime12Ar(hhmm: string | undefined): string {
  if (!hhmm || !hhmm.includes(':')) return '--:--';
  const [hRaw, mRaw] = hhmm.split(':').map(Number);
  if (!Number.isFinite(hRaw) || !Number.isFinite(mRaw)) return '--:--';
  const suffix = hRaw >= 12 ? 'م' : 'ص';
  const h12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  return `${String(h12).padStart(2, '0')}:${String(mRaw).padStart(2, '0')} ${suffix}`;
}
