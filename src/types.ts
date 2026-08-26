import type { CSSProperties, FocusEventHandler } from "react";

/** A calendar date range. Dates are local-midnight `Date` objects (never UTC-shifted). */
export type DateRange = {
  start: Date | null;
  end: Date | null;
};

/**
 * `instant` — the input updates on every click and `onChange` fires as soon as
 * the range completes. `confirm` — the input and `onChange` update only when
 * the user presses the "Select dates" button.
 */
export type CommitMode = "instant" | "confirm";

/** Horizontal alignment of the desktop popover relative to the input. */
export type PopoverAlign = "left" | "center" | "right";

/** Vertical opening direction of the desktop popover. `auto` picks by viewport space. */
export type PopoverDrop = "down" | "up" | "auto";

/** Every piece of UI text, overridable for i18n. */
export type DateRangePickerStrings = {
  /** Popover CTA + mobile header title. */
  selectDates: string;
  /** Shown after the separator while only a start date is selected. */
  endDate: string;
  /** aria-label of the mobile close button. */
  close: string;
  /** aria-label of the previous-month button. */
  previousMonth: string;
  /** aria-label of the next-month button. */
  nextMonth: string;
  /** Singular/plural for the nights counter, e.g. "(1 night)" / "(3 nights)". */
  night: string;
  nights: string;
  /** Default validation message for an incomplete range. */
  errorIncomplete: string;
};

export const defaultStrings: DateRangePickerStrings = {
  selectDates: "Select dates",
  endDate: "End Date",
  close: "Close",
  previousMonth: "Previous month",
  nextMonth: "Next month",
  night: "night",
  nights: "nights",
  errorIncomplete: "Please select a date range.",
};

/** Optional class overrides merged onto the library's own classes. */
export type DateRangePickerClassNames = Partial<{
  root: string;
  input: string;
  error: string;
  popover: string;
  cta: string;
}>;

export type DateRangePickerProps = {
  /** Controlled value. Omit (and optionally pass `defaultValue`) for uncontrolled use. */
  value?: DateRange;
  /** Initial value when uncontrolled. */
  defaultValue?: DateRange;
  /** Fires when a range is committed (complete range in instant mode; CTA press in confirm mode; `clear()`). */
  onChange?: (range: DateRange) => void;
  /** Fires when a start date is picked but the range is not complete yet. */
  onPartialChange?: (range: DateRange) => void;
  /** Fires when the popover/modal opens or closes. */
  onOpenChange?: (open: boolean) => void;
  onBlur?: FocusEventHandler<HTMLInputElement>;

  /**
   * Minimum length of the range in nights (end date exclusive).
   * `0` allows same-day selection. Default `1`.
   */
  minNights?: number;
  /** Disable dates before today. Default `true`. */
  disablePast?: boolean;
  /** How many years into the future can be selected. Default `2`. */
  maxYearsFuture?: number;
  /** How many years into the past (only when `disablePast` is `false`). Default `2`. */
  maxYearsPast?: number;
  /** Exact earliest selectable date. Overrides `disablePast`/`maxYearsPast`. */
  minDate?: Date;
  /** Exact latest selectable date. Overrides `maxYearsFuture`. */
  maxDate?: Date;

  /** Display format pattern, e.g. `"EEE, MMM d"`, `"YYYY-MM-DD"`. Default `"EEE, MMM d"`. */
  format?: string;
  /** Text between the start and end dates. Default `" — "`. */
  separator?: string;
  /** BCP-47 locale for month/weekday names, e.g. `"en"`, `"uk"`, `"de"`. Default `"en"`. */
  locale?: string;
  /** Append "(n nights)" to the footer summary once the range completes. Default `false`. */
  showNights?: boolean;
  /** See {@link CommitMode}. Default `"instant"`. */
  commitMode?: CommitMode;
  /** Desktop popover alignment. Default `"center"`. */
  align?: PopoverAlign;
  /** Desktop popover direction. Default `"down"`. */
  drop?: PopoverDrop;
  /** Desktop only: close automatically after the first completed selection (first open only). Default `false`. */
  autoCloseFirst?: boolean;
  /** A complete range is required; closing without one shows the error. Default `false`. */
  required?: boolean;
  /** Open the picker when the `error` prop transitions to truthy (e.g. on failed form submit). Default `false`. */
  openOnError?: boolean;

  /**
   * External error, e.g. from your form library. A string is shown as the
   * message; `true` shows the default message; falsy hides it (internal
   * incomplete-range validation may still show).
   */
  error?: string | boolean;
  /** Override any UI text. Merged over the English defaults. */
  strings?: Partial<DateRangePickerStrings>;

  disabled?: boolean;
  placeholder?: string;
  id?: string;
  /** Name for the two hidden `yyyy-mm-dd` inputs (`{name}_start` / `{name}_end`) for plain HTML forms. */
  name?: string;
  className?: string;
  classNames?: DateRangePickerClassNames;
  style?: CSSProperties;
};

/** Imperative API, exposed via `ref`. */
export type DateRangePickerRef = {
  open: () => void;
  close: () => void;
  /** Clears the selection and commits `{ start: null, end: null }`. */
  clear: () => void;
  /** Focuses the input. */
  focus: () => void;
  getValue: () => DateRange;
};
