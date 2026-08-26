"use client";

import type { RefObject } from "react";

export type PickerFooterProps = {
  /** Live summary: "Select dates", partial, or the full range (+ nights). */
  summary: string;
  ctaLabel: string;
  ctaDisabled: boolean;
  ctaRef: RefObject<HTMLButtonElement | null>;
  onCtaClick: () => void;
  ctaClassName?: string;
  /** Mobile footer stacks vertically with sticky positioning. */
  mobile?: boolean;
};

export function PickerFooter({
  summary,
  ctaLabel,
  ctaDisabled,
  ctaRef,
  onCtaClick,
  ctaClassName,
  mobile,
}: PickerFooterProps) {
  return (
    <div className={mobile ? "wf-dp-m-footer" : "wf-dp-footer"}>
      <div className="wf-dp-footer-left" aria-live="polite">
        {summary}
      </div>
      <button
        type="button"
        className={["wf-dp-cta", ctaClassName].filter(Boolean).join(" ")}
        disabled={ctaDisabled}
        ref={ctaRef}
        onClick={onCtaClick}
      >
        {ctaLabel}
      </button>
    </div>
  );
}
