/** True when `zone` is an IANA timezone name this runtime understands, e.g. "Asia/Kolkata". */
export function isValidTimeZone(zone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-CA', { timeZone: zone });
    return true;
  } catch {
    return false;
  }
}

/**
 * The calendar date (YYYY-MM-DD) at the instant `now` in the given timezone.
 * Independent of the server's own timezone, so a server running in UTC still
 * agrees with a farmer in India about what "today" is.
 */
export function dateInTimeZone(now: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const part = (type: 'year' | 'month' | 'day') => parts.find((entry) => entry.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}
