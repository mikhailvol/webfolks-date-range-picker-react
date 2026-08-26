"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { CalendarMonth } from "./CalendarMonth";
import { DesktopPopover } from "./DesktopPopover";
import { MobileSheet } from "./MobileSheet";
import { PickerFooter } from "./PickerFooter";
import {
  EMPTY_RANGE,
  addDays,
  addMonthsClamped,
  addMonthsToMonth,
  applyDaySelection,
  applySingleDaySelection,
  clampDate,
  compareMonth,
  computeBounds,
  fromISODate,
  isDateDisabled,
  isRangeComplete,
  monthKey,
  monthsInRange,
  nightsBetween,
  rangesEqual,
  sameDay,
  startOfMonth,
  stripTime,
  toISODate,
} from "./dateUtils";
import { formatWithPattern, getWeekdayLabels, resolveLocale } from "./formatDate";
import { useIsMobile } from "./useIsMobile";
import { usePopoverPosition } from "./usePopoverPosition";
import { useTapVsScroll } from "./useTapVsScroll";
import {
  defaultStrings,
  type DateRange,
  type DateRangePickerProps,
  type DateRangePickerRangeProps,
  type DateRangePickerRef,
} from "./types";

/** Ceiling for skip-disabled scans, spanning any gap up to a year (original constant). */
const MAX_SKIP_STEPS = 370;

/** useLayoutEffect that stays silent during SSR renders. */
const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export const DateRangePicker = forwardRef<DateRangePickerRef, DateRangePickerProps>(
  function DateRangePicker(props, ref) {
    const {
      onOpenChange,
      onBlur,
      months = 2,
      minNights = 1,
      disablePast = true,
      maxYearsFuture = 2,
      maxYearsPast = 2,
      minDate,
      maxDate,
      format = "EEE, MMM d",
      separator = " — ",
      locale = "en",
      showNights = false,
      commitMode = "instant",
      align = "center",
      drop = "down",
      autoCloseFirst = false,
      autoClose = false,
      required = false,
      openOnError = false,
      error,
      strings: stringsOverride,
      disabled = false,
      placeholder,
      id,
      name,
      className,
      classNames,
      style,
    } = props;
    const mode = props.mode ?? "range";
    /** Single-date mode is a 0-night "range" internally: start === end. */
    const effMinNights = mode === "single" ? 0 : minNights;

    const strings = useMemo(() => {
      const merged = { ...defaultStrings, ...stringsOverride };
      // Single-date mode swaps in its own CTA/title and error text so the
      // subcomponents can stay mode-agnostic.
      return mode === "single"
        ? { ...merged, selectDates: merged.selectDate, errorIncomplete: merged.errorIncompleteDate }
        : merged;
    }, [stringsOverride, mode]);
    const resolvedLocale = useMemo(() => resolveLocale(locale), [locale]);
    const [today] = useState(() => stripTime(new Date()));
    const bounds = useMemo(
      () =>
        computeBounds({
          today,
          disablePast,
          maxYearsFuture,
          maxYearsPast,
          minDate,
          maxDate,
        }),
      [today, disablePast, maxYearsFuture, maxYearsPast, minDate, maxDate]
    );

    // Committed value (what the form sees) --------------------------------
    // Single mode exposes `Date | null` externally; internally everything is
    // a DateRange with start === end.
    const normalize = (v: DateRange | Date | null | undefined): DateRange =>
      v == null
        ? EMPTY_RANGE
        : v instanceof Date
          ? { start: stripTime(v), end: stripTime(v) }
          : v;

    const value = props.value;
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = useState<DateRange>(() =>
      normalize(props.defaultValue)
    );
    const committed = isControlled ? normalize(value) : internalValue;

    // Working selection shown in the calendar -----------------------------
    const [draft, setDraft] = useState<DateRange>(committed);

    // External value updates (form reset, programmatic set) re-seed the draft.
    const prevValueRef = useRef<DateRange | Date | null | undefined>(value);
    useEffect(() => {
      if (isControlled) {
        const prev = normalize(prevValueRef.current);
        const next = normalize(value);
        if (!rangesEqual(prev, next)) {
          setDraft(next);
          setInternalError(false);
        }
      }
      prevValueRef.current = value;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value, isControlled]);

    const [open, setOpen] = useState(false);
    const [internalError, setInternalError] = useState(false);
    const isMobile = useIsMobile();

    const clampLeftMonth = (m: Date): Date => {
      const lastLeft = addMonthsToMonth(bounds.maxMonth, -(months - 1));
      const upper = compareMonth(lastLeft, bounds.minMonth) < 0 ? bounds.minMonth : lastLeft;
      if (compareMonth(m, bounds.minMonth) < 0) return bounds.minMonth;
      if (compareMonth(m, upper) > 0) return upper;
      return m;
    };
    const [leftMonth, setLeftMonth] = useState<Date>(() =>
      clampLeftMonth(startOfMonth(committed.start ?? today))
    );
    const [focusedDate, setFocusedDate] = useState<Date | null>(null);

    const inputRef = useRef<HTMLInputElement | null>(null);
    const popoverRef = useRef<HTMLDivElement | null>(null);
    const scrollerRef = useRef<HTMLDivElement | null>(null);
    const ctaRef = useRef<HTMLButtonElement | null>(null);
    const cellRefs = useRef(new Map<string, HTMLDivElement>());
    const monthRefs = useRef(new Map<string, HTMLDivElement>());
    const openCountRef = useRef(0);
    const suppressFocusOpenRef = useRef(false);
    const closedByPointerRef = useRef(false);
    const pendingFocusRef = useRef<"cell" | "cta" | null>(null);
    const popoverId = useId();

    const complete = isRangeComplete(draft, effMinNights);

    // Formatting ----------------------------------------------------------
    const fmt = (d: Date) => formatWithPattern(d, format, resolvedLocale);
    const formatRange = (r: DateRange) =>
      r.start && r.end ? `${fmt(r.start)}${separator}${fmt(r.end)}` : "";
    const formatPartial = (start: Date) => `${fmt(start)}${separator}${strings.endDate}`;

    const displaySource = commitMode === "instant" ? draft : committed;
    const displayValue =
      mode === "single"
        ? displaySource.start
          ? fmt(displaySource.start)
          : ""
        : displaySource.start && displaySource.end
          ? formatRange(displaySource)
          : commitMode === "instant" && draft.start
            ? formatPartial(draft.start)
            : "";

    const footerSummary =
      mode === "single"
        ? draft.start
          ? fmt(draft.start)
          : strings.selectDates
        : complete
          ? formatRange(draft) +
            (showNights
              ? ` (${nightsBetween(draft.start!, draft.end!)} ${
                  nightsBetween(draft.start!, draft.end!) === 1 ? strings.night : strings.nights
                })`
              : "")
          : draft.start
            ? formatPartial(draft.start)
            : strings.selectDates;

    // Error ---------------------------------------------------------------
    const externalErrorText = typeof error === "string" && error.trim() ? error : null;
    const errorShown = Boolean(error) || internalError;
    const errorText = errorShown ? (externalErrorText ?? strings.errorIncomplete) : null;

    // Open / close --------------------------------------------------------
    const openPicker = () => {
      if (disabled || open) return;
      openCountRef.current += 1;
      setFocusedDate(draft.start ?? today);
      if (!isMobile) {
        setLeftMonth((prev) => {
          const anchor = startOfMonth(draft.start ?? today);
          const last = addMonthsToMonth(prev, months - 1);
          const visible =
            compareMonth(anchor, prev) >= 0 && compareMonth(anchor, last) <= 0;
          return visible ? prev : clampLeftMonth(anchor);
        });
      }
      pendingFocusRef.current = "cell";
      setOpen(true);
      onOpenChange?.(true);
    };

    const closePicker = (validate = false, restoreFocus = true) => {
      setOpen(false);
      onOpenChange?.(false);
      if (validate) {
        // Validate the working selection, as the original does: a dangling
        // start is an error; with `required`, so is anything short of complete.
        const partial = mode === "range" && !!(draft.start && !draft.end);
        const requiredMissing = required && !isRangeComplete(draft, effMinNights);
        setInternalError(partial || requiredMissing);
      }
      if (restoreFocus) {
        suppressFocusOpenRef.current = true;
        inputRef.current?.focus();
        window.setTimeout(() => {
          suppressFocusOpenRef.current = false;
        }, 120);
      }
    };

    // Commit --------------------------------------------------------------
    const commitRange = (next: DateRange) => {
      if (!isControlled) setInternalValue(next);
      if (mode === "single") {
        (props.onChange as ((date: Date | null) => void) | undefined)?.(next.start);
      } else {
        (props.onChange as ((range: DateRange) => void) | undefined)?.(next);
      }
    };

    // Selection -----------------------------------------------------------
    const selectDay = (date: Date, via: "pointer" | "keyboard") => {
      if (isDateDisabled(date, bounds, draft, effMinNights)) return;
      const result =
        mode === "single"
          ? applySingleDaySelection(date)
          : applyDaySelection(draft, date, effMinNights);
      if (!result.changed) return;

      setDraft(result.range);
      setInternalError(false);

      if (!result.completed) {
        if (mode === "range") {
          (props as DateRangePickerRangeProps).onPartialChange?.(result.range);
        }
      } else if (commitMode === "instant") {
        commitRange(result.range);
        // A classic datepicker closes on pick; ranges close via autoClose
        // (every completion) or autoCloseFirst (first open only).
        const shouldClose =
          !isMobile &&
          (mode === "single" ||
            autoClose ||
            (autoCloseFirst && openCountRef.current === 1));
        if (shouldClose) {
          closePicker(true);
          return;
        }
      }

      const focusTarget = result.range.end ?? result.range.start;
      if (focusTarget) {
        ensureVisible(focusTarget);
        setFocusedDate(focusTarget);
      }
      if (via === "keyboard") {
        pendingFocusRef.current =
          commitMode === "confirm" && result.completed ? "cta" : "cell";
      }
    };

    const gesture = useTapVsScroll((iso) => {
      const date = fromISODate(iso);
      if (date) selectDay(date, "pointer");
    });

    // Month navigation ----------------------------------------------------
    const canGoPrev = compareMonth(addMonthsToMonth(leftMonth, -1), bounds.minMonth) >= 0;
    const canGoNext = compareMonth(addMonthsToMonth(leftMonth, months), bounds.maxMonth) <= 0;
    const goPrev = () => canGoPrev && setLeftMonth(addMonthsToMonth(leftMonth, -1));
    const goNext = () => canGoNext && setLeftMonth(addMonthsToMonth(leftMonth, 1));

    const ensureVisible = (date: Date) => {
      if (isMobile) return;
      setLeftMonth((prev) => {
        const m = startOfMonth(date);
        const last = addMonthsToMonth(prev, months - 1);
        if (compareMonth(m, prev) < 0) return clampLeftMonth(m);
        if (compareMonth(m, last) > 0) return clampLeftMonth(addMonthsToMonth(m, -(months - 1)));
        return prev;
      });
    };

    // Keyboard navigation -------------------------------------------------
    const skipDisabled = (target: Date, dir: 1 | -1): Date | null => {
      let cursor = clampDate(target, bounds.minSelectable, bounds.maxSelectable);
      let steps = 0;
      while (steps < MAX_SKIP_STEPS && isDateDisabled(cursor, bounds, draft, effMinNights)) {
        const next = clampDate(addDays(cursor, dir), bounds.minSelectable, bounds.maxSelectable);
        if (sameDay(next, cursor)) return null; // stuck at a bound
        cursor = next;
        steps++;
      }
      return steps >= MAX_SKIP_STEPS ? null : cursor;
    };

    const moveFocusTo = (target: Date, dir: 1 | -1) => {
      const resolved = skipDisabled(target, dir);
      if (!resolved) return;
      ensureVisible(resolved);
      setFocusedDate(resolved);
      pendingFocusRef.current = "cell";
    };

    const moveFocusByDays = (delta: number) => {
      const base = focusedDate ?? draft.start ?? today;
      moveFocusTo(addDays(base, delta), delta >= 0 ? 1 : -1);
    };

    const moveFocusByMonths = (delta: number) => {
      const base = focusedDate ?? draft.start ?? today;
      moveFocusTo(addMonthsClamped(base, delta), delta >= 0 ? 1 : -1);
    };

    const onPopoverKeyDown = (e: ReactKeyboardEvent) => {
      const key = e.key;
      const active = document.activeElement as HTMLElement | null;
      const onCell = !!active?.getAttribute?.("data-date");

      if ((key === "Enter" || key === " ") && onCell && focusedDate) {
        e.preventDefault();
        selectDay(focusedDate, "keyboard");
        return;
      }
      if (!onCell) return;

      switch (key) {
        case "ArrowLeft":
          e.preventDefault();
          moveFocusByDays(-1);
          break;
        case "ArrowRight":
          e.preventDefault();
          moveFocusByDays(1);
          break;
        case "ArrowUp":
          e.preventDefault();
          moveFocusByDays(-7);
          break;
        case "ArrowDown":
          e.preventDefault();
          moveFocusByDays(7);
          break;
        case "PageUp":
          e.preventDefault();
          moveFocusByMonths(-1);
          break;
        case "PageDown":
          e.preventDefault();
          moveFocusByMonths(1);
          break;
        case "Home": {
          e.preventDefault();
          const dow = ((focusedDate ?? today).getDay() + 6) % 7;
          moveFocusByDays(-dow);
          break;
        }
        case "End": {
          e.preventDefault();
          const dow = ((focusedDate ?? today).getDay() + 6) % 7;
          moveFocusByDays(6 - dow);
          break;
        }
      }
    };

    // Focus application (roving focus + CTA hand-off) ---------------------
    useEffect(() => {
      if (!open) return;
      const want = pendingFocusRef.current;
      if (!want) return;
      pendingFocusRef.current = null;
      if (want === "cta") {
        ctaRef.current?.focus();
        return;
      }
      const iso = focusedDate ? toISODate(focusedDate) : null;
      const el = iso ? cellRefs.current.get(iso) : null;
      if (el && el.getAttribute("aria-disabled") !== "true") {
        el.focus({ preventScroll: !isMobile });
        return;
      }
      const first = popoverRef.current?.querySelector<HTMLElement>(
        '[data-date]:not([aria-disabled="true"])'
      );
      if (first) {
        first.focus({ preventScroll: !isMobile });
        const d = fromISODate(first.getAttribute("data-date") ?? "");
        if (d) setFocusedDate(d);
      }
    });

    // Document-level dismissal (outside click, focus-out, Escape) ---------
    useEffect(() => {
      if (!open) return;
      const isOutside = (t: EventTarget | null) =>
        !(t instanceof Node) ||
        (!popoverRef.current?.contains(t) && t !== inputRef.current);

      const onPointerDown = (e: PointerEvent) => {
        if (isOutside(e.target)) closePicker(true, false);
      };
      const onFocusIn = (e: FocusEvent) => {
        if (isOutside(e.target)) closePicker(true, false);
      };
      const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" || e.key === "Esc") {
          e.preventDefault();
          closePicker(true);
        }
      };
      document.addEventListener("pointerdown", onPointerDown);
      document.addEventListener("focusin", onFocusIn);
      document.addEventListener("keydown", onKeyDown, true);
      return () => {
        document.removeEventListener("pointerdown", onPointerDown);
        document.removeEventListener("focusin", onFocusIn);
        document.removeEventListener("keydown", onKeyDown, true);
      };
    });

    // Mobile: body scroll lock + initial scroll to the relevant month -----
    useEffect(() => {
      if (!open || !isMobile) return;
      const previous = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = previous;
      };
    }, [open, isMobile]);

    useIsoLayoutEffect(() => {
      if (!open || !isMobile) return;
      const scroller = scrollerRef.current;
      if (!scroller) return;
      const anchor = draft.start ?? today;
      const el = monthRefs.current.get(monthKey(anchor));
      if (el) scroller.scrollTop = Math.max(0, el.offsetTop);
      // Only on open / layout switch — re-renders preserve scroll natively.
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, isMobile]);

    // openOnError: opening when an external error appears (e.g. failed submit)
    const prevErrorRef = useRef(Boolean(error));
    useEffect(() => {
      const now = Boolean(error);
      if (openOnError && now && !prevErrorRef.current) openPicker();
      prevErrorRef.current = now;
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [error, openOnError]);

    // Positioning (desktop) ----------------------------------------------
    const positionStyle = usePopoverPosition({
      open,
      enabled: !isMobile,
      anchorRef: inputRef,
      popoverRef,
      drop,
      align,
      recalcKey: monthKey(leftMonth),
    });

    // Imperative API ------------------------------------------------------
    useImperativeHandle(ref, () => ({
      open: openPicker,
      close: () => closePicker(true),
      clear: () => {
        setDraft(EMPTY_RANGE);
        setInternalError(false);
        commitRange(EMPTY_RANGE);
      },
      focus: () => inputRef.current?.focus(),
      getValue: () => draft,
    }));

    // CTA -----------------------------------------------------------------
    const onCtaClick = () => {
      if (commitMode === "confirm" && complete) commitRange(draft);
      closePicker(true);
    };

    // Cell / month ref registries ----------------------------------------
    const registerCell = (iso: string, el: HTMLDivElement | null) => {
      if (el) cellRefs.current.set(iso, el);
      else cellRefs.current.delete(iso);
    };
    const registerMonth = (key: string, el: HTMLDivElement | null) => {
      if (el) monthRefs.current.set(key, el);
      else monthRefs.current.delete(key);
    };

    // Render --------------------------------------------------------------
    const monthProps = {
      bounds,
      draft,
      minNights: effMinNights,
      today,
      locale: resolvedLocale,
      focusedDate,
      registerCell,
    };

    const footer = (
      <PickerFooter
        summary={footerSummary}
        ctaLabel={strings.selectDates}
        ctaDisabled={!complete}
        ctaRef={ctaRef}
        onCtaClick={onCtaClick}
        ctaClassName={classNames?.cta}
        mobile={isMobile}
      />
    );

    const popover = isMobile ? (
      <MobileSheet
        id={popoverId}
        popoverRef={popoverRef}
        scrollerRef={scrollerRef}
        className={classNames?.popover}
        onKeyDown={onPopoverKeyDown}
        gesture={gesture}
        onClose={() => closePicker(true)}
        strings={strings}
        weekdayLabels={getWeekdayLabels(resolvedLocale)}
        months={monthsInRange(bounds.minMonth, bounds.maxMonth).map((m) => (
          <CalendarMonth
            key={monthKey(m)}
            month={m}
            showWeekdays={false}
            registerMonth={registerMonth}
            {...monthProps}
          />
        ))}
        footer={footer}
      />
    ) : (
      <DesktopPopover
        id={popoverId}
        popoverRef={popoverRef}
        style={positionStyle}
        className={classNames?.popover}
        onKeyDown={onPopoverKeyDown}
        gesture={gesture}
        canGoPrev={canGoPrev}
        canGoNext={canGoNext}
        onPrev={goPrev}
        onNext={goNext}
        strings={strings}
        singleMonth={months === 1}
        months={Array.from({ length: months }, (_, i) => (
          <CalendarMonth
            key={i}
            month={addMonthsToMonth(leftMonth, i)}
            showWeekdays
            {...monthProps}
          />
        ))}
        footer={footer}
      />
    );

    return (
      <span
        className={["wf-dp-field", className, classNames?.root].filter(Boolean).join(" ")}
        style={style}
      >
        <input
          ref={inputRef}
          type="text"
          readOnly
          inputMode="none"
          autoComplete="off"
          id={id}
          disabled={disabled}
          placeholder={placeholder}
          value={displayValue}
          className={[
            "wf-dp-input",
            errorShown && "wf-dp-input-error",
            classNames?.input,
          ]
            .filter(Boolean)
            .join(" ")}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          aria-invalid={errorShown || undefined}
          onPointerDown={() => {
            if (disabled) return;
            if (open) {
              closedByPointerRef.current = true;
              closePicker(true);
            }
          }}
          onClick={() => {
            if (disabled) return;
            if (closedByPointerRef.current) {
              closedByPointerRef.current = false;
              return;
            }
            if (!open) openPicker();
          }}
          onFocus={(e) => {
            if (disabled || open || suppressFocusOpenRef.current) return;
            // Open only for keyboard-origin focus; mouse opens via click.
            let keyboardFocus = true;
            try {
              keyboardFocus = e.target.matches(":focus-visible");
            } catch {
              /* older engines: treat any focus as keyboard */
            }
            if (keyboardFocus) openPicker();
          }}
          onKeyDown={(e) => {
            if (disabled || open) return;
            if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
              e.preventDefault();
              openPicker();
            }
          }}
          onBlur={onBlur}
        />
        {name &&
          (mode === "single" ? (
            <input
              type="hidden"
              name={name}
              value={committed.start ? toISODate(committed.start) : ""}
            />
          ) : (
            <>
              <input
                type="hidden"
                name={`${name}_start`}
                value={committed.start ? toISODate(committed.start) : ""}
              />
              <input
                type="hidden"
                name={`${name}_end`}
                value={committed.end ? toISODate(committed.end) : ""}
              />
            </>
          ))}
        {errorText && (
          <div
            className={["wf-dp-error", classNames?.error].filter(Boolean).join(" ")}
            role="alert"
          >
            {errorText}
          </div>
        )}
        {open && createPortal(popover, document.body)}
      </span>
    );
  }
);
