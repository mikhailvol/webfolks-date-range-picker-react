"use client";

import { memo } from "react";

export type CalendarDayProps = {
  iso: string;
  dayNumber: number;
  disabled: boolean;
  isStart: boolean;
  isEnd: boolean;
  inRange: boolean;
  isToday: boolean;
  /** Roving tabindex: exactly one enabled cell in the calendar is tabbable. */
  isFocused: boolean;
  ariaLabel: string;
  registerCell: (iso: string, el: HTMLDivElement | null) => void;
};

export const CalendarDay = memo(function CalendarDay({
  iso,
  dayNumber,
  disabled,
  isStart,
  isEnd,
  inRange,
  isToday,
  isFocused,
  ariaLabel,
  registerCell,
}: CalendarDayProps) {
  const classes = [
    "wf-dp-cell",
    disabled && "wf-dp-disabled",
    isToday && "wf-dp-today",
    inRange && "wf-dp-inrange",
    isStart && "wf-dp-start",
    isEnd && "wf-dp-end",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      role="gridcell"
      data-date={iso}
      className={classes}
      aria-label={ariaLabel}
      aria-disabled={disabled || undefined}
      aria-selected={isStart || isEnd || inRange || undefined}
      aria-current={isToday ? "date" : undefined}
      tabIndex={disabled ? -1 : isFocused ? 0 : -1}
      ref={(el) => registerCell(iso, el)}
    >
      <span className="wf-dp-day">{dayNumber}</span>
    </div>
  );
});
