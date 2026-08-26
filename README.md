# WebFolks Date Range Picker — React

The [WebFolks Date Range Picker](https://github.com/mikhailvol/webfolks-date-range-picker) rebuilt as a native **React + TypeScript** component. Same UX, zero dependencies, drop it into any React or Next.js project.

- **One input, two dates** — a single field holds the whole range. Or switch to `mode="single"` for a classic one-date picker.
- **Desktop** — popover anchored to the input, two months side by side (or one, via `months={1}`), smart positioning (`drop`, `align`, viewport collision handling).
- **Mobile** (<768px) — fullscreen experience: sticky header, sticky weekdays, scrollable stacked months, sticky footer with a live summary and CTA. Scrolling never accidentally selects a date.
- **Smart range logic** — minimum nights, same-day mode, restart rules, disabled dates, past/future bounds.
- **Commit modes** — `instant` input updates or `confirm`-on-CTA.
- **Accessible** — ARIA grid semantics, roving focus, arrow keys, Home/End, PageUp/PageDown, Enter/Space, Escape, disabled dates skipped, live status for screen readers.
- **Locale-aware** — month/weekday names via `Intl`, custom display patterns, every UI string overridable.
- **Themeable** — plain CSS with `--wf-dp-*` variables, same names as the original.
- **Zero dependencies** — React 18+ is the only peer. SSR-safe, App Router ready (`"use client"` is baked in).

## Installation

```bash
npm install github:mikhailvol/webfolks-date-range-picker-react
```

(or `npm install webfolks-date-range-picker-react` once published to npm)

Import the stylesheet once — e.g. in `app/layout.tsx` for Next.js:

```tsx
import "webfolks-date-range-picker-react/styles.css";
```

## Quick start

```tsx
"use client";

import { useState } from "react";
import { DateRangePicker, type DateRange } from "webfolks-date-range-picker-react";

export function BookingDates() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <DateRangePicker
      value={range}
      onChange={setRange}
      placeholder="Select date range"
    />
  );
}
```

Uncontrolled use works too — omit `value` and read the result from `onChange` (or pass `name` to get hidden `yyyy-mm-dd` inputs for plain HTML forms).

### Single-date mode

`mode="single"` turns it into a classic datepicker: the value becomes `Date | null`, every click replaces the selection, and in `instant` mode the desktop popover closes as soon as a date is picked. The mobile experience stays the same fullscreen scrollable calendar, confirmed with the CTA. `minNights` and `showNights` don't apply.

```tsx
const [date, setDate] = useState<Date | null>(null);

<DateRangePicker mode="single" value={date} onChange={setDate} placeholder="Select date" />
```

### One month on desktop

`months={1}` renders a compact single-month popover (mobile is unaffected):

```tsx
<DateRangePicker months={1} />
```

The classic one-calendar datepicker is the combination of both:

```tsx
<DateRangePicker mode="single" months={1} value={date} onChange={setDate} />
```

For a **range** in a single calendar that closes as soon as it completes, add `autoClose`:

```tsx
<DateRangePicker months={1} autoClose value={range} onChange={setRange} />
```

## Props

Every `data-wf-dp-*` attribute of the original became a typed prop:

| Prop | Original attribute | Default | What it does |
|---|---|---|---|
| `mode` | — *(new)* | `"range"` | `"range"` for two dates; `"single"` for a classic one-date picker (`value` becomes `Date \| null`). |
| `months` | — *(new)* | `2` | Months shown side by side in the desktop popover: `1` or `2`. |
| `minNights` | `data-wf-dp-min-nights` | `1` | Minimum range length in nights. `0` allows same-day selection. Ignored in single mode. |
| `disablePast` | `data-wf-dp-disable-past` | `true` | Disable dates before today. |
| `maxYearsFuture` | `data-wf-dp-max-years` | `2` | How many years ahead can be selected (through the end of that month). |
| `maxYearsPast` | `data-wf-dp-max-years-past` | `2` | Years back (only with `disablePast={false}`). |
| `minDate` / `maxDate` | — *(new)* | — | Exact bounds; override the year-based window. |
| `format` | `data-wf-dp-format` | `"EEE, MMM d"` | Display pattern (tokens below). |
| `separator` | `data-wf-dp-separator` | `" — "` | Text between start and end dates. |
| `locale` | `data-wf-dp-locale` | `"en"` | BCP-47 tag for month/weekday names (`"uk"`, `"de"`, `"pl"`, …). |
| `showNights` | `data-wf-dp-show-nights` | `false` | Append "(n nights)" to the footer summary. |
| `commitMode` | `data-wf-dp-commit-mode` | `"instant"` | `"instant"` updates on every click; `"confirm"` commits on the CTA. |
| `align` | `data-wf-dp-align` | `"center"` | Popover alignment: `"left" \| "center" \| "right"`. |
| `drop` | `data-wf-dp-drop` | `"down"` | Popover direction: `"down" \| "up" \| "auto"`. |
| `autoCloseFirst` | `data-wf-dp-autoclose-first` | `false` | Desktop only: close after the first completed selection (first open only). |
| `autoClose` | — *(new)* | `false` | Desktop only, instant mode: close on **every** completed selection. Single mode always does this. |
| `required` | `data-wf-dp-required` | `false` | Closing without a complete range shows the error. |
| `openOnError` | `data-wf-dp-open-on-error` | `false` | Reopen the picker when the `error` prop turns truthy (e.g. failed submit). |
| `error` | — | — | External error: a string message, or `true` for the default text. |
| `strings` | — | English | Override any UI text (see i18n below). |
| `value` / `defaultValue` / `onChange` | `wf-datepicker:change` | — | Controlled / uncontrolled value; `onChange` fires on commit. |
| `onPartialChange` | `wf-datepicker:partial` | — | Fires when a start date is picked. |
| `onOpenChange` | — | — | Open/close notifications. |
| `name` | hidden-fields recipe | — | Renders hidden `{name}_start` / `{name}_end` inputs with `yyyy-mm-dd` values. |
| `disabled`, `placeholder`, `id`, `className`, `classNames`, `style`, `onBlur` | — | — | Standard input concerns. |

### Imperative API (replaces `picker.open()` / `picker.close()` / reset buttons)

```tsx
import { useRef } from "react";
import { DateRangePicker, type DateRangePickerRef } from "webfolks-date-range-picker-react";

const picker = useRef<DateRangePickerRef>(null);

<DateRangePicker ref={picker} ... />
<button onClick={() => picker.current?.open()}>Open dates</button>
<button onClick={() => picker.current?.clear()}>Reset dates</button>
```

`clear()` commits `{ start: null, end: null }` through `onChange`, so form state stays in sync — no global reset-button discovery needed.

## Date format tokens

Same tokens as the original:

| Token | Meaning |
|---|---|
| `YYYY`, `yyyy` | Full year (2026) |
| `YY`, `yy` | Short year (26) |
| `MMMM` | Full month name (October) |
| `MMM` | Short month name (Oct) |
| `MM`, `M` | Month number (10) |
| `DD`, `D`, `dd`, `d` | Day number (13) |
| `EEEE` | Full weekday name (Monday) |
| `EEE` | Short weekday name (Mon) |

## react-hook-form

The component is a plain controlled input, so it plugs straight into `Controller` — no adapter needed:

```tsx
import { useForm, Controller } from "react-hook-form";
import { DateRangePicker, type DateRange } from "webfolks-date-range-picker-react";

type FormValues = { stay: DateRange };

const { control, handleSubmit } = useForm<FormValues>({
  defaultValues: { stay: { start: null, end: null } },
});

<Controller
  name="stay"
  control={control}
  rules={{
    validate: (v) => (v.start && v.end) || "Please select a date range",
  }}
  render={({ field, fieldState }) => (
    <DateRangePicker
      value={field.value}
      onChange={field.onChange}
      onBlur={field.onBlur}
      error={fieldState.error?.message}
      openOnError
    />
  )}
/>
```

Validation, touched state, reset, and programmatic `setValue` all behave like any other controlled field.

## Serializing dates

`value` holds local-midnight `Date` objects. **Never serialize them with `toISOString()`** — the UTC shift can move the calendar day. Use the exported helpers:

```tsx
import { toISODate, fromISODate } from "webfolks-date-range-picker-react";

toISODate(range.start!);      // "2026-03-20" (local calendar date)
fromISODate("2026-03-20");    // Date at local midnight
```

## Theming

Override the CSS variables (same names as the original library) anywhere in your app:

```css
:root {
  --wf-dp-primary: #2960e3;        /* buttons, highlights, active states */
  --wf-dp-primary-hover: color-mix(in srgb, var(--wf-dp-primary) 90%, black);
  --wf-dp-range-color: color-mix(in srgb, var(--wf-dp-primary) 10%, white);

  --wf-dp-fg-strong: #1b1c1f;      /* titles, day cells */
  --wf-dp-fg-medium: #3e4146;      /* weekdays, footer summary */
  --wf-dp-fg-weak: #818996;        /* icons */

  --wf-dp-border: #e5e7eb;
  --wf-dp-bg: #ffffff;
  --wf-dp-error: #e53935;
  --wf-dp-hover: #f3f4f6;
  --wf-dp-shadow: 0 10px 25px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.06);

  --wf-dp-radius-popover: 14px;
  --wf-dp-radius-input: 10px;
  --wf-dp-z-index: 9999;
}
```

For structural restyling, pass `classNames={{ root, input, error, popover, cta }}` — your classes are appended to the library's, or restyle the stable `wf-dp-*` class names directly.

## i18n

`locale` localizes month and weekday names via `Intl`. The remaining UI text is overridable:

```tsx
<DateRangePicker
  locale="uk"
  strings={{
    selectDates: "Оберіть дати",
    selectDate: "Оберіть дату",
    endDate: "Дата виїзду",
    close: "Закрити",
    night: "ніч",
    nights: "ночей",
    errorIncomplete: "Будь ласка, оберіть діапазон дат.",
    errorIncompleteDate: "Будь ласка, оберіть дату.",
  }}
/>
```

In single mode the CTA/title uses `strings.selectDate` and the validation message uses `strings.errorIncompleteDate`.

## Behavior notes (vs. the original Webflow library)

Intentional improvements while porting:

- **Tab** moves between the calendar and the CTA (standard ARIA grid behavior); day-to-day movement is arrows/Home/End/PageUp/PageDown. The original hijacked Tab to move day-by-day.
- Disabled dates use `aria-disabled` (perceivable to screen readers) instead of `aria-hidden`.
- Day cells expose full localized dates ("Saturday, March 7, 2026") instead of raw ISO strings.
- Non-ASCII month names ("Мар", "Mär") no longer get mangled by the bare-`M`/`D` format tokens.
- Configuration is typed props instead of `data-wf-dp-*` attributes; events are callbacks instead of custom DOM events; auto-initialization, `__wfDatepicker`, and global reset-button discovery are gone.

Everything else — selection rules, commit modes, positioning, the mobile experience, tap-vs-scroll handling, bounds and validation — matches the original.

## Development

```bash
npm install
npm test          # vitest: pure date logic + component interactions
npm run build     # tsup → dist (ESM + CJS + d.ts) + styles.css
cd demo && npm install && npm run dev   # Next.js App Router demo on :3999
```

## Credits

Built by [WebFolks.io](https://www.webfolks.io/) — a React port of our vanilla-JS
[WebFolks Date Range Picker](https://github.com/mikhailvol/webfolks-date-range-picker) for Webflow.

## License

[MIT](LICENSE.md) — free to use in commercial and private projects; keep the copyright notice with the code.
