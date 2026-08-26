"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  DatePicker,
  DateRangePicker,
  toISODate,
  type DateRange,
  type DateRangePickerRef,
} from "webfolks-date-range-picker-react";

const showRange = (r: DateRange) =>
  `{ start: ${r.start ? toISODate(r.start) : "null"}, end: ${r.end ? toISODate(r.end) : "null"} }`;
const showDate = (d: Date | null) => (d ? toISODate(d) : "null");

const EMPTY: DateRange = { start: null, end: null };

function Example({
  title,
  description,
  code,
  value,
  children,
}: {
  title: string;
  description: string;
  code: string;
  value?: string;
  children: ReactNode;
}) {
  return (
    <div className="card">
      <h3>{title}</h3>
      <p className="desc">{description}</p>
      <div className="demo">{children}</div>
      <pre>
        <code>{code}</code>
      </pre>
      {value && <span className="value">{value}</span>}
    </div>
  );
}

// Range picker examples -------------------------------------------------------

function DefaultRange() {
  const [range, setRange] = useState(EMPTY);
  return (
    <Example
      title="Default"
      description="Two months, instant commit, minimum 1 night, past dates disabled, selectable up to 2 years ahead."
      code={`<DateRangePicker value={range} onChange={setRange} placeholder="Select date range" />`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker value={range} onChange={setRange} placeholder="Select date range" />
    </Example>
  );
}

function ConfirmRange() {
  const [range, setRange] = useState(EMPTY);
  return (
    <Example
      title="Confirm mode with nights counter"
      description="The input and onChange update only when the user presses “Select dates”. The footer counts nights once the range completes."
      code={`<DateRangePicker commitMode="confirm" showNights minNights={2} ... />`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker
        value={range}
        onChange={setRange}
        commitMode="confirm"
        showNights
        minNights={2}
        placeholder="Min 2 nights, confirm to apply"
      />
    </Example>
  );
}

function NightRules() {
  const [sameDay, setSameDay] = useState(EMPTY);
  const [week, setWeek] = useState(EMPTY);
  return (
    <Example
      title="Night rules"
      description="minNights={0} lets a second tap on the same day complete a 0-night range. minNights={7} disables everything closer than a week while the end date is being picked."
      code={`<DateRangePicker minNights={0} ... />   // same-day allowed
<DateRangePicker minNights={7} ... />   // at least a week`}
      value={`same-day: ${showRange(sameDay)} · week: ${showRange(week)}`}
    >
      <DateRangePicker value={sameDay} onChange={setSameDay} minNights={0} placeholder="Same-day allowed" />
      <DateRangePicker value={week} onChange={setWeek} minNights={7} placeholder="At least 7 nights" />
    </Example>
  );
}

function PastAndFormat() {
  const [range, setRange] = useState(EMPTY);
  return (
    <Example
      title="Past dates and custom format"
      description="Open the past window with disablePast={false}, and shape the display with format and separator tokens."
      code={`<DateRangePicker disablePast={false} maxYearsPast={1}
  format="DD MMM YYYY" separator=" to " ... />`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker
        value={range}
        onChange={setRange}
        disablePast={false}
        maxYearsPast={1}
        format="DD MMM YYYY"
        separator=" to "
        placeholder="Past enabled, custom format"
      />
    </Example>
  );
}

function ExactBounds() {
  const [range, setRange] = useState(EMPTY);
  const { minDate, maxDate } = useMemo(() => {
    const now = new Date();
    return {
      minDate: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      maxDate: new Date(now.getFullYear(), now.getMonth() + 3, 0),
    };
  }, []);
  return (
    <Example
      title="Exact bounds"
      description="minDate and maxDate pin the selectable window to precise dates — here, the next two calendar months."
      code={`<DateRangePicker minDate={firstOfNextMonth} maxDate={endOfMonthAfter} ... />`}
      value={`window: ${toISODate(minDate)} → ${toISODate(maxDate)} · value: ${showRange(range)}`}
    >
      <DateRangePicker
        value={range}
        onChange={setRange}
        minDate={minDate}
        maxDate={maxDate}
        placeholder="Next two months only"
      />
    </Example>
  );
}

function CompactRange() {
  const [range, setRange] = useState(EMPTY);
  return (
    <Example
      title="One month, closes on completion"
      description="months={1} renders a compact single-month popover; autoClose closes it the moment the range completes. Mobile keeps the fullscreen scrollable calendar."
      code={`<DateRangePicker months={1} autoClose ... />`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker value={range} onChange={setRange} months={1} autoClose placeholder="Compact range" />
    </Example>
  );
}

function Positioning() {
  const [range, setRange] = useState(EMPTY);
  return (
    <Example
      title="Popover position"
      description={`align sets the horizontal anchor (left, center, right); drop="auto" opens upward when the viewport has more room above.`}
      code={`<DateRangePicker align="right" drop="auto" ... />`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker
        value={range}
        onChange={setRange}
        align="right"
        drop="auto"
        placeholder="Right-aligned, auto direction"
      />
    </Example>
  );
}

// DatePicker examples ---------------------------------------------------------

function DefaultDate() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="Default"
      description="One calendar, Date | null value. Picking a date commits it and closes the popover."
      code={`<DatePicker value={date} onChange={setDate} placeholder="Pick a date" />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
    </Example>
  );
}

function ConfirmDate() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="Confirm mode"
      description="Each pick replaces the selection; the value commits only on “Select date”."
      code={`<DatePicker commitMode="confirm" ... />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} commitMode="confirm" placeholder="Pick + confirm" />
    </Example>
  );
}

function BoundedDate() {
  const [date, setDate] = useState<Date | null>(null);
  const maxDate = useMemo(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
  }, []);
  return (
    <Example
      title="Bounded, two months"
      description="DatePicker takes the shared props too — here months={2} with a 30-day selection window."
      code={`<DatePicker months={2} maxDate={in30Days} ... />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker value={date} onChange={setDate} months={2} maxDate={maxDate} placeholder="Next 30 days" />
    </Example>
  );
}

// Forms & API -----------------------------------------------------------------

type BookingForm = { stay: DateRange };

function WithReactHookForm() {
  const [submitted, setSubmitted] = useState<string>();
  const { control, handleSubmit, reset } = useForm<BookingForm>({
    defaultValues: { stay: EMPTY },
  });
  return (
    <Example
      title="react-hook-form"
      description="A plain controlled input, so it drops into Controller. Submitting with no range shows the field error and openOnError reopens the picker."
      code={`<Controller name="stay" control={control}
  rules={{ validate: (v) => (v.start && v.end ? true : "Please select a date range") }}
  render={({ field, fieldState }) => (
    <DateRangePicker value={field.value} onChange={field.onChange}
      onBlur={field.onBlur} error={fieldState.error?.message} openOnError />
  )} />`}
      value={submitted ? `submitted: ${submitted}` : undefined}
    >
      <form
        className="form-row"
        onSubmit={handleSubmit((values) => setSubmitted(showRange(values.stay)))}
        noValidate
      >
        <Controller
          name="stay"
          control={control}
          rules={{
            validate: (v) => (v.start && v.end ? true : "Please select a date range"),
          }}
          render={({ field, fieldState }) => (
            <DateRangePicker
              value={field.value}
              onChange={field.onChange}
              onBlur={field.onBlur}
              error={fieldState.error?.message}
              openOnError
              placeholder="Booking dates"
            />
          )}
        />
        <button type="submit" className="demo-btn">
          Submit
        </button>
        <button
          type="button"
          className="demo-btn"
          onClick={() => {
            reset();
            setSubmitted(undefined);
          }}
        >
          Reset form
        </button>
      </form>
    </Example>
  );
}

function ImperativeApi() {
  const [range, setRange] = useState(EMPTY);
  const picker = useRef<DateRangePickerRef>(null);
  return (
    <Example
      title="Imperative ref"
      description="open(), close(), clear(), focus(), and getValue() via a typed ref — clear() commits an empty range through onChange, so form state stays in sync."
      code={`const picker = useRef<DateRangePickerRef>(null);
<DateRangePicker ref={picker} ... />
picker.current?.open();  picker.current?.clear();`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker ref={picker} value={range} onChange={setRange} placeholder="Controlled via ref" />
      <button type="button" className="demo-btn" onClick={() => picker.current?.open()}>
        Open
      </button>
      <button type="button" className="demo-btn" onClick={() => picker.current?.clear()}>
        Clear
      </button>
    </Example>
  );
}

// Localization & theming ------------------------------------------------------

function Localized() {
  const [range, setRange] = useState(EMPTY);
  return (
    <Example
      title="Ukrainian locale"
      description="locale localizes month and weekday names via Intl; the strings prop translates the UI text."
      code={`<DateRangePicker locale="uk" showNights
  strings={{ selectDates: "Оберіть дати", endDate: "Дата виїзду", night: "ніч", nights: "ночей", ... }} />`}
      value={`value: ${showRange(range)}`}
    >
      <DateRangePicker
        value={range}
        onChange={setRange}
        locale="uk"
        showNights
        placeholder="Оберіть дати"
        strings={{
          selectDates: "Оберіть дати",
          endDate: "Дата виїзду",
          close: "Закрити",
          night: "ніч",
          nights: "ночей",
          errorIncomplete: "Будь ласка, оберіть діапазон дат.",
        }}
      />
    </Example>
  );
}

function Themed() {
  const [date, setDate] = useState<Date | null>(null);
  return (
    <Example
      title="Themed with CSS variables"
      description="Override any --wf-dp-* variable — globally on :root, or scoped with a class. The popover renders in a portal, so a scoped theme class goes on both the field (className) and the popover (classNames.popover)."
      code={`.themed { --wf-dp-primary: #0f766e; --wf-dp-radius-input: 0px; --wf-dp-radius-popover: 0px; }

<DatePicker className="themed" classNames={{ popover: "themed" }} ... />`}
      value={`value: ${showDate(date)}`}
    >
      <DatePicker
        value={date}
        onChange={setDate}
        className="themed"
        classNames={{ popover: "themed" }}
        placeholder="Teal, square corners"
      />
    </Example>
  );
}

// Page ------------------------------------------------------------------------

export default function Page() {
  return (
    <main>
      <header className="hero">
        <h1>WebFolks Date Range Picker for React</h1>
        <p className="lead">
          Two components on one engine: a date-range picker and a classic single-date picker.
          Zero dependencies, keyboard accessible, locale-aware, themeable with CSS variables.
        </p>
        <div className="hero-links">
          <a href="https://github.com/mikhailvol/webfolks-date-range-picker-react">GitHub</a>
          <a href="https://github.com/mikhailvol/webfolks-date-range-picker-react#props">Props reference</a>
        </div>
        <code className="install">npm install github:mikhailvol/webfolks-date-range-picker-react</code>
        <p className="hint">
          Resize the window under 768px to see the fullscreen mobile experience with scrollable
          months.
        </p>
      </header>

      <section className="group">
        <h2>Range picker</h2>
        <DefaultRange />
        <ConfirmRange />
        <NightRules />
        <PastAndFormat />
        <ExactBounds />
        <CompactRange />
        <Positioning />
      </section>

      <section className="group">
        <h2>Date picker</h2>
        <DefaultDate />
        <ConfirmDate />
        <BoundedDate />
      </section>

      <section className="group">
        <h2>Forms &amp; API</h2>
        <WithReactHookForm />
        <ImperativeApi />
      </section>

      <section className="group">
        <h2>Localization &amp; theming</h2>
        <Localized />
        <Themed />
      </section>

      <footer>
        Built by <a href="https://www.webfolks.io/">WebFolks.io</a> · MIT licensed · React port of
        the <a href="https://github.com/mikhailvol/webfolks-date-range-picker">vanilla-JS picker</a>{" "}
        for Webflow
      </footer>
    </main>
  );
}
