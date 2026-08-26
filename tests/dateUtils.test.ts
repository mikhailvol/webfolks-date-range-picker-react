import { describe, expect, it } from "vitest";
import {
  applyDaySelection,
  buildWeeks,
  computeBounds,
  fromISODate,
  isDateDisabled,
  isRangeComplete,
  monthsInRange,
  nightsBetween,
  rangesEqual,
  sameDay,
  toISODate,
} from "../src/dateUtils";

const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

describe("nightsBetween", () => {
  it("counts whole nights", () => {
    expect(nightsBetween(d(2026, 3, 10), d(2026, 3, 13))).toBe(3);
    expect(nightsBetween(d(2026, 3, 10), d(2026, 3, 10))).toBe(0);
  });

  it("is DST-safe across spring-forward and fall-back", () => {
    // These spans include DST transitions in most Western timezones.
    expect(nightsBetween(d(2026, 3, 28), d(2026, 3, 30))).toBe(2);
    expect(nightsBetween(d(2026, 10, 24), d(2026, 10, 26))).toBe(2);
  });
});

describe("toISODate / fromISODate", () => {
  it("round-trips local calendar dates without UTC drift", () => {
    const date = d(2026, 1, 1);
    expect(toISODate(date)).toBe("2026-01-01");
    expect(sameDay(fromISODate("2026-01-01"), date)).toBe(true);
  });

  it("rejects invalid strings", () => {
    expect(fromISODate("2026-02-30")).toBeNull();
    expect(fromISODate("not-a-date")).toBeNull();
  });
});

describe("applyDaySelection", () => {
  const empty = { start: null, end: null };

  it("first click selects the start date", () => {
    const r = applyDaySelection(empty, d(2026, 3, 20), 1);
    expect(r.changed).toBe(true);
    expect(r.completed).toBe(false);
    expect(sameDay(r.range.start, d(2026, 3, 20))).toBe(true);
    expect(r.range.end).toBeNull();
  });

  it("a later valid date completes the range", () => {
    const withStart = { start: d(2026, 3, 20), end: null };
    const r = applyDaySelection(withStart, d(2026, 3, 25), 1);
    expect(r.completed).toBe(true);
    expect(sameDay(r.range.end, d(2026, 3, 25))).toBe(true);
  });

  it("a later date closer than minNights is ignored", () => {
    const withStart = { start: d(2026, 3, 20), end: null };
    const r = applyDaySelection(withStart, d(2026, 3, 21), 3);
    expect(r.changed).toBe(false);
    expect(r.range).toBe(withStart);
  });

  it("an earlier date restarts the range", () => {
    const withStart = { start: d(2026, 3, 20), end: null };
    const r = applyDaySelection(withStart, d(2026, 3, 10), 1);
    expect(r.completed).toBe(false);
    expect(sameDay(r.range.start, d(2026, 3, 10))).toBe(true);
    expect(r.range.end).toBeNull();
  });

  it("same-day completes only when minNights is 0", () => {
    const withStart = { start: d(2026, 3, 20), end: null };
    const blocked = applyDaySelection(withStart, d(2026, 3, 20), 1);
    expect(blocked.changed).toBe(false);
    const allowed = applyDaySelection(withStart, d(2026, 3, 20), 0);
    expect(allowed.completed).toBe(true);
    expect(sameDay(allowed.range.end, d(2026, 3, 20))).toBe(true);
  });

  it("clicking with a full range selected starts a new one", () => {
    const full = { start: d(2026, 3, 20), end: d(2026, 3, 25) };
    const r = applyDaySelection(full, d(2026, 4, 1), 1);
    expect(sameDay(r.range.start, d(2026, 4, 1))).toBe(true);
    expect(r.range.end).toBeNull();
  });
});

describe("bounds", () => {
  const today = d(2026, 8, 26);

  it("disablePast blocks yesterday but not today", () => {
    const b = computeBounds({ today, disablePast: true, maxYearsFuture: 2, maxYearsPast: 2 });
    expect(isDateDisabled(d(2026, 8, 25), b, { start: null, end: null }, 1)).toBe(true);
    expect(isDateDisabled(today, b, { start: null, end: null }, 1)).toBe(false);
  });

  it("future bound is the end of the month maxYearsFuture ahead", () => {
    const b = computeBounds({ today, disablePast: true, maxYearsFuture: 2, maxYearsPast: 2 });
    expect(isDateDisabled(d(2028, 8, 31), b, { start: null, end: null }, 1)).toBe(false);
    expect(isDateDisabled(d(2028, 9, 1), b, { start: null, end: null }, 1)).toBe(true);
  });

  it("past selection window opens with disablePast=false", () => {
    const b = computeBounds({ today, disablePast: false, maxYearsFuture: 2, maxYearsPast: 1 });
    expect(isDateDisabled(d(2025, 8, 26), b, { start: null, end: null }, 1)).toBe(false);
    expect(isDateDisabled(d(2025, 8, 25), b, { start: null, end: null }, 1)).toBe(true);
  });

  it("explicit minDate/maxDate override the year-based window", () => {
    const b = computeBounds({
      today,
      disablePast: true,
      maxYearsFuture: 2,
      maxYearsPast: 2,
      minDate: d(2026, 9, 1),
      maxDate: d(2026, 9, 30),
    });
    expect(isDateDisabled(d(2026, 8, 31), b, { start: null, end: null }, 1)).toBe(true);
    expect(isDateDisabled(d(2026, 9, 15), b, { start: null, end: null }, 1)).toBe(false);
    expect(isDateDisabled(d(2026, 10, 1), b, { start: null, end: null }, 1)).toBe(true);
  });

  it("dates violating minNights are dynamically disabled while selecting", () => {
    const b = computeBounds({ today, disablePast: true, maxYearsFuture: 2, maxYearsPast: 2 });
    const draft = { start: d(2026, 9, 10), end: null };
    expect(isDateDisabled(d(2026, 9, 11), b, draft, 3)).toBe(true);
    expect(isDateDisabled(d(2026, 9, 13), b, draft, 3)).toBe(false);
    // Earlier dates stay enabled — they restart the range.
    expect(isDateDisabled(d(2026, 9, 5), b, draft, 3)).toBe(false);
  });
});

describe("isRangeComplete", () => {
  it("honors minNights, including the 0-night mode", () => {
    expect(isRangeComplete({ start: d(2026, 3, 20), end: d(2026, 3, 21) }, 1)).toBe(true);
    expect(isRangeComplete({ start: d(2026, 3, 20), end: d(2026, 3, 21) }, 2)).toBe(false);
    expect(isRangeComplete({ start: d(2026, 3, 20), end: d(2026, 3, 20) }, 0)).toBe(true);
    expect(isRangeComplete({ start: d(2026, 3, 20), end: null }, 1)).toBe(false);
  });
});

describe("month grids", () => {
  it("builds Monday-first weeks with padding", () => {
    // March 2026 starts on a Sunday → 6 leading blanks.
    const weeks = buildWeeks(d(2026, 3, 1));
    expect(weeks[0]!.slice(0, 6).every((c) => c === null)).toBe(true);
    expect(weeks[0]![6]!.getDate()).toBe(1);
    expect(weeks.every((w) => w.length === 7)).toBe(true);
    const days = weeks.flat().filter(Boolean);
    expect(days.length).toBe(31);
  });

  it("enumerates every month in the window", () => {
    const months = monthsInRange(d(2026, 11, 1), d(2027, 2, 1));
    expect(months.length).toBe(4);
    expect(months[0]!.getMonth()).toBe(10);
    expect(months[3]!.getFullYear()).toBe(2027);
  });
});

describe("rangesEqual", () => {
  it("compares by calendar day", () => {
    expect(
      rangesEqual(
        { start: d(2026, 3, 20), end: null },
        { start: new Date(2026, 2, 20, 15, 30), end: null }
      )
    ).toBe(true);
    expect(rangesEqual({ start: null, end: null }, { start: d(2026, 3, 20), end: null })).toBe(
      false
    );
  });
});
