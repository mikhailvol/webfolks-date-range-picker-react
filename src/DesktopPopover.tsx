"use client";

import type { CSSProperties, KeyboardEvent, ReactNode, RefObject } from "react";
import type { TapGestureHandlers } from "./useTapVsScroll";
import type { DateRangePickerStrings } from "./types";

export type DesktopPopoverProps = {
  id: string;
  popoverRef: RefObject<HTMLDivElement | null>;
  style?: CSSProperties;
  className?: string;
  onKeyDown: (e: KeyboardEvent) => void;
  gesture: TapGestureHandlers;
  canGoPrev: boolean;
  canGoNext: boolean;
  onPrev: () => void;
  onNext: () => void;
  strings: DateRangePickerStrings;
  months: ReactNode;
  footer: ReactNode;
};

export function DesktopPopover({
  id,
  popoverRef,
  style,
  className,
  onKeyDown,
  gesture,
  canGoPrev,
  canGoNext,
  onPrev,
  onNext,
  strings,
  months,
  footer,
}: DesktopPopoverProps) {
  return (
    <div
      id={id}
      ref={popoverRef}
      role="group"
      aria-label={strings.selectDates}
      className={["wf-dp-popover", "open", className].filter(Boolean).join(" ")}
      style={style ?? { position: "fixed", top: -9999, left: -9999 }}
      onKeyDown={onKeyDown}
    >
      <div className="wf-dp-cal-wrap" {...gesture}>
        <button
          type="button"
          className="wf-dp-btn prev"
          disabled={!canGoPrev}
          aria-label={strings.previousMonth}
          onClick={onPrev}
        >
          <svg width="100%" height="100%" viewBox="0 0 48 48" fill="currentColor" aria-hidden>
            <path d="M30.83 32.67L21.66 23.5L30.83 14.33L28 11.5L16 23.5L28 35.5L30.83 32.67Z" />
          </svg>
        </button>
        <div className="wf-dp-cal">{months}</div>
        <button
          type="button"
          className="wf-dp-btn next"
          disabled={!canGoNext}
          aria-label={strings.nextMonth}
          onClick={onNext}
        >
          <svg width="48" height="48" viewBox="0 0 48 48" fill="currentColor" aria-hidden>
            <path d="M17.17 32.92L26.34 23.75L17.17 14.58L20 11.75L32 23.75L20 35.75L17.17 32.92Z" />
          </svg>
        </button>
      </div>
      {footer}
    </div>
  );
}
