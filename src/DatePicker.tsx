"use client";

import { forwardRef, useImperativeHandle, useRef } from "react";
import { PickerBase } from "./PickerBase";
import type { DatePickerProps, DatePickerRef, DateRangePickerRef } from "./types";

/**
 * Classic single-date picker built on the same engine as
 * {@link DateRangePicker}: one month by default, `Date | null` value, and in
 * instant mode the desktop popover closes as soon as a date is picked. The
 * mobile experience is the same fullscreen scrollable calendar, confirmed
 * with the CTA.
 */
export const DatePicker = forwardRef<DatePickerRef, DatePickerProps>(
  function DatePicker({ months = 1, ...props }, ref) {
    const inner = useRef<DateRangePickerRef>(null);

    useImperativeHandle(ref, () => ({
      open: () => inner.current?.open(),
      close: () => inner.current?.close(),
      clear: () => inner.current?.clear(),
      focus: () => inner.current?.focus(),
      getValue: () => inner.current?.getValue().start ?? null,
    }));

    return <PickerBase {...props} months={months} mode="single" ref={inner} />;
  }
);
