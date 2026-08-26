"use client";

import { forwardRef } from "react";
import { PickerBase } from "./PickerBase";
import type { DateRangePickerProps, DateRangePickerRef } from "./types";

/**
 * WebFolks Date Range Picker — one input, two dates. Desktop popover with one
 * or two months, fullscreen mobile experience. For a classic one-date picker
 * use {@link DatePicker} from the same package.
 */
export const DateRangePicker = forwardRef<DateRangePickerRef, DateRangePickerProps>(
  function DateRangePicker(props, ref) {
    return <PickerBase {...props} mode="range" ref={ref} />;
  }
);
