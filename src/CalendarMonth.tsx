"use client";

import { memo } from "react";
import { CalendarDay } from "./CalendarDay";
import {
  buildWeeks,
  isBetween,
  isDateDisabled,
  monthKey,
  sameDay,
  toISODate,
  type Bounds,
} from "./dateUtils";
import { formatFullDate, formatMonthYear, getWeekdayLabels } from "./formatDate";
import type { DateRange } from "./types";

export type CalendarMonthProps = {
  /** First day of the month to render. */
  month: Date;
  bounds: Bounds;
  draft: DateRange;
  minNights: number;
  today: Date;
  locale: string;
  focusedDate: Date | null;
  /** Desktop months carry their own weekday header; the mobile stack shares one. */
  showWeekdays: boolean;
  registerCell: (iso: string, el: HTMLDivElement | null) => void;
  registerMonth?: (key: string, el: HTMLDivElement | null) => void;
};

export const CalendarMonth = memo(function CalendarMonth({
  month,
  bounds,
  draft,
  minNights,
  today,
  locale,
  focusedDate,
  showWeekdays,
  registerCell,
  registerMonth,
}: CalendarMonthProps) {
  const key = monthKey(month);
  const weeks = buildWeeks(month);
  const title = formatMonthYear(month, locale);

  return (
    <div
      className="wf-dp-month"
      data-key={key}
      ref={registerMonth ? (el) => registerMonth(key, el) : undefined}
    >
      <div className="wf-dp-month-title" aria-hidden>
        {title}
      </div>
      <div role="grid" aria-label={title}>
        {showWeekdays && (
          <div className="wf-dp-weekdays" role="row">
            {getWeekdayLabels(locale).map((w, i) => (
              <div key={i} role="columnheader" className="wf-dp-weekday">
                {w}
              </div>
            ))}
          </div>
        )}
        <div className="wf-dp-grid">
          {weeks.map((week, wi) => (
            <div key={wi} role="row" className="wf-dp-week">
              {week.map((date, di) =>
                date ? (
                  <CalendarDay
                    key={di}
                    iso={toISODate(date)}
                    dayNumber={date.getDate()}
                    disabled={isDateDisabled(date, bounds, draft, minNights)}
                    isStart={sameDay(draft.start, date)}
                    isEnd={sameDay(draft.end, date)}
                    inRange={isBetween(date, draft.start, draft.end)}
                    isToday={sameDay(date, today)}
                    isFocused={sameDay(focusedDate, date)}
                    ariaLabel={formatFullDate(date, locale)}
                    registerCell={registerCell}
                  />
                ) : (
                  <div key={di} role="gridcell" aria-hidden className="wf-dp-cell wf-dp-empty" />
                )
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
