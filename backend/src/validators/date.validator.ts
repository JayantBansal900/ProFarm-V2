import { z } from 'zod';

export const dateStringRegex = /^\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01])$/;

/** Gregorian calendar date, years 0001–9999; no Date parsing or timezone conversion. */
export function isValidDateOnly(value: string): boolean {
  // A JavaScript regex `$` also matches before a trailing newline.
  if (value.length !== 10 || !dateStringRegex.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 1) return false;
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const monthLengths = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return day <= monthLengths[month - 1];
}

export const dateOnlySchema = z.string().refine(isValidDateOnly, {
  message: 'Date must be a real calendar date in YYYY-MM-DD format (years 0001–9999)',
});
