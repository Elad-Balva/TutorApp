/** Local midnight for date comparison in user's timezone */
function startOfLocalDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

/** Signed calendar-day difference: toDate's day minus fromDate's day */
function localCalendarDaysBetween(fromDate, toDate) {
  const a = startOfLocalDay(fromDate).getTime();
  const b = startOfLocalDay(toDate).getTime();
  return Math.round((b - a) / 86400000);
}

/**
 * Hebrew hint for when the lesson is relative to now.
 * - Before start (same local day): hours/minutes until start
 * - Before start (other days): מחר / בעוד N ימים
 * - After start, before end: היום • בשיעור
 * - After end: לפני N שעות (same day) / אתמול / לפני N ימים
 */
export function formatLessonScheduleBadge(lesson) {
  const start = new Date(lesson.startTime);
  const now = new Date();
  const durationMs = Number(lesson.expectedDurationInHours ?? 1) * 3600000;
  const end = new Date(start.getTime() + durationMs);

  if (now < start) {
    const dayDiff = localCalendarDaysBetween(now, start);
    if (dayDiff === 0) {
      const ms = start - now;
      const hours = Math.floor(ms / 3600000);
      const mins = Math.floor((ms % 3600000) / 60000);
      if (hours >= 1) return `בעוד ${hours} שעות`;
      if (mins >= 1) return `בעוד ${mins} דקות`;
      return "בקרוב";
    }
    if (dayDiff === 1) return "מחר";
    return `בעוד ${dayDiff} ימים`;
  }

  if (now <= end) {
    return "היום • בשיעור";
  }

  const daysSinceStart = localCalendarDaysBetween(start, now);
  if (daysSinceStart === 0) {
    const ms = now - start;
    const hours = Math.floor(ms / 3600000);
    const mins = Math.floor((ms % 3600000) / 60000);
    if (hours >= 1) return `לפני ${hours} שעות`;
    if (mins >= 1) return `לפני ${mins} דקות`;
    return "לפני רגע";
  }
  if (daysSinceStart === 1) return "אתמול";
  return `לפני ${daysSinceStart} ימים`;
}
