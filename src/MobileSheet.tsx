"use client";

import type { KeyboardEvent, ReactNode, RefObject } from "react";
import type { TapGestureHandlers } from "./useTapVsScroll";
import type { DateRangePickerStrings } from "./types";

export type MobileSheetProps = {
  id: string;
  popoverRef: RefObject<HTMLDivElement | null>;
  scrollerRef: RefObject<HTMLDivElement | null>;
  className?: string;
  onKeyDown: (e: KeyboardEvent) => void;
  gesture: TapGestureHandlers;
  onClose: () => void;
  strings: DateRangePickerStrings;
  weekdayLabels: string[];
  months: ReactNode;
  footer: ReactNode;
};

/**
 * Fullscreen mobile experience: sticky header with a close action, a shared
 * sticky weekday row, a scrollable stack of every month in the selectable
 * window, and a sticky footer with the live summary and CTA.
 */
export function MobileSheet({
  id,
  popoverRef,
  scrollerRef,
  className,
  onKeyDown,
  gesture,
  onClose,
  strings,
  weekdayLabels,
  months,
  footer,
}: MobileSheetProps) {
  return (
    <div
      id={id}
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label={strings.selectDates}
      className={["wf-dp-popover", "wf-dp-popover--mobile", "open", className]
        .filter(Boolean)
        .join(" ")}
      onKeyDown={onKeyDown}
    >
      <div className="wf-dp-modal">
        <div className="wf-dp-m-header">
          <div className="wf-dp-m-title">{strings.selectDates}</div>
          <button
            type="button"
            className="wf-dp-m-close"
            aria-label={strings.close}
            onClick={onClose}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M18.3 5.71a1 1 0 0 0-1.41 0L12 10.59 7.11 5.7a1 1 0 1 0-1.41 1.41L10.59 12l-4.9 4.89a1 1 0 1 0 1.41 1.41L12 13.41l4.89 4.89a1 1 0 0 0 1.41-1.41L13.41 12l4.89-4.89a1 1 0 0 0 0-1.4z" />
            </svg>
          </button>
        </div>

        <div className="wf-dp-m-weekdays" aria-hidden>
          {weekdayLabels.map((w, i) => (
            <div key={i} className="wf-dp-weekday">
              {w}
            </div>
          ))}
        </div>

        <div className="wf-dp-m-scroll" ref={scrollerRef} {...gesture}>
          <div className="wf-dp-cal wf-dp-cal--stack">{months}</div>
        </div>

        {footer}
      </div>
    </div>
  );
}
