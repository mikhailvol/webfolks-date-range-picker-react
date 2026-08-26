import type { DateRange } from "./types";

export const EMPTY_RANGE: DateRange = { start: null, end: null };

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Local-midnight copy of a date (calendar day only, no time component). */
export function stripTime(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function sameDay(a?: Date | null, b?: Date | null): boolean {
  return (
    !!a &&
    !!b &&
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Strictly between start and end (exclusive on both sides). */
export function isBetween(date: Date, start: Date | null, end: Date | null): boolean {
  return !!start && !!end && date > start && date < end;
}

/** Whole nights between two local dates; DST-safe via rounding. */
export function nightsBetween(start: Date, end: Date): number {
  return Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
}

export function addDays(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

/** First day of the month `n` months away from the given month. */
export function addMonthsToMonth(month: Date, n: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + n, 1);
}

/** Move a date by whole months, clamping the day to the target month's length. */
export function addMonthsClamped(date: Date, n: number): Date {
  const target = new Date(date.getFullYear(), date.getMonth() + n, 1);
  const lastDay = endOfMonth(target).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(date.getDate(), lastDay));
}

/** Compare two dates by month only (<0, 0, >0). */
export function compareMonth(a: Date, b: Date): number {
  return a.getFullYear() * 12 + a.getMonth() - (b.getFullYear() * 12 + b.getMonth());
}

export function clampDate(d: Date, min: Date, max: Date): Date {
  if (d < min) return stripTime(min);
  if (d > max) return stripTime(max);
  return d;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

/** `"YYYY-MM"` key for a month, used for scroll anchoring. */
export function monthKey(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

/**
 * Serialize a local calendar date as `yyyy-mm-dd`.
 * Never use `Date#toISOString()` for calendar dates — the UTC shift can move the day.
 */
export function toISODate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

/** Parse `yyyy-mm-dd` into a local-midnight Date; `null` when invalid. */
export function fromISODate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return null;
  const [, y, mo, d] = m;
  const date = new Date(Number(y), Number(mo) - 1, Number(d));
  return date.getFullYear() === Number(y) &&
    date.getMonth() === Number(mo) - 1 &&
    date.getDate() === Number(d)
    ? date
    : null;
}

function sameOrBothNull(a: Date | null, b: Date | null): boolean {
  return (!a && !b) || sameDay(a, b);
}

export function rangesEqual(a: DateRange, b: DateRange): boolean {
  return sameOrBothNull(a.start, b.start) && sameOrBothNull(a.end, b.end);
}

// Bounds ---------------------------------------------------------------------

export type Bounds = {
  minSelectable: Date;
  maxSelectable: Date;
  minMonth: Date;
  maxMonth: Date;
};

export function computeBounds(opts: {
  today: Date;
  disablePast: boolean;
  maxYearsFuture: number;
  maxYearsPast: number;
  minDate?: Date;
  maxDate?: Date;
}): Bounds {
  const t = opts.today;
  const minSelectable = opts.minDate
    ? stripTime(opts.minDate)
    : opts.disablePast
      ? stripTime(t)
      : new Date(t.getFullYear() - Math.max(0, opts.maxYearsPast), t.getMonth(), t.getDate());
  const maxSelectable = opts.maxDate
    ? stripTime(opts.maxDate)
    : endOfMonth(new Date(t.getFullYear() + Math.max(0, opts.maxYearsFuture), t.getMonth(), 1));
  return {
    minSelectable,
    maxSelectable,
    minMonth: startOfMonth(minSelectable),
    maxMonth: startOfMonth(maxSelectable),
  };
}

/** Outside the selectable window entirely (independent of the current draft). */
export function isStaticallyDisabled(date: Date, bounds: Bounds): boolean {
  return date < bounds.minSelectable || date > bounds.maxSelectable;
}

/**
 * Disabled either statically (bounds) or dynamically: while only a start date
 * is selected, later dates closer than `minNights` cannot become the end.
 */
export function isDateDisabled(
  date: Date,
  bounds: Bounds,
  draft: DateRange,
  minNights: number
): boolean {
  if (isStaticallyDisabled(date, bounds)) return true;
  if (draft.start && !draft.end && minNights > 0 && date > draft.start) {
    if (nightsBetween(draft.start, date) < minNights) return true;
  }
  return false;
}

export function isRangeComplete(range: DateRange, minNights: number): boolean {
  return !!(range.start && range.end) && nightsBetween(range.start, range.end) >= minNights;
}

// Selection ------------------------------------------------------------------

export type SelectionResult = {
  range: DateRange;
  /** The click completed the range (start + valid end). */
  completed: boolean;
  /** The click changed the selection at all. */
  changed: boolean;
};

/**
 * The core selection rules of the WebFolks picker:
 * - no start, or a full range already selected → the click starts a new range;
 * - a later date at least `minNights` away completes the range;
 * - a later date closer than `minNights` is ignored;
 * - an earlier date restarts the range from that date;
 * - the same day completes a 0-night range only when `minNights` is 0.
 */
export function applyDaySelection(
  range: DateRange,
  date: Date,
  minNights: number
): SelectionResult {
  const day = stripTime(date);
  if (!range.start || (range.start && range.end)) {
    return { range: { start: day, end: null }, completed: false, changed: true };
  }
  const start = range.start;
  if (sameDay(day, start)) {
    if (minNights === 0) return { range: { start, end: day }, completed: true, changed: true };
    return { range, completed: false, changed: false };
  }
  if (day < start) {
    return { range: { start: day, end: null }, completed: false, changed: true };
  }
  if (nightsBetween(start, day) >= minNights) {
    return { range: { start, end: day }, completed: true, changed: true };
  }
  return { range, completed: false, changed: false };
}

/** Single-date mode: every click selects that day as a complete "range". */
export function applySingleDaySelection(date: Date): SelectionResult {
  const day = stripTime(date);
  return { range: { start: day, end: day }, completed: true, changed: true };
}

// Month grids ----------------------------------------------------------------

/** Weeks of a month as rows of 7, Monday-first, padded with `null`. */
export function buildWeeks(month: Date): (Date | null)[][] {
  const first = startOfMonth(month);
  const daysInMonth = endOfMonth(month).getDate();
  const lead = (first.getDay() + 6) % 7;
  const cells: (Date | null)[] = [];
  for (let i = 0; i < lead; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push(new Date(month.getFullYear(), month.getMonth(), d));
  }
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (Date | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** Every month from `minMonth` to `maxMonth` inclusive (mobile stacked view). */
export function monthsInRange(minMonth: Date, maxMonth: Date): Date[] {
  const months: Date[] = [];
  let cursor = startOfMonth(minMonth);
  while (compareMonth(cursor, maxMonth) <= 0) {
    months.push(cursor);
    cursor = addMonthsToMonth(cursor, 1);
  }
  return months;
}
