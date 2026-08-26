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

// Playground ------------------------------------------------------------------

type PlaygroundConfig = {
  component: "range" | "single";
  commitMode: "instant" | "confirm";
  months: 1 | 2;
  minNights: number;
  showNights: boolean;
  disablePast: boolean;
  maxYearsFuture: number;
  maxYearsPast: number;
  format: string;
  separator: string;
  locale: string;
  align: "left" | "center" | "right";
  drop: "down" | "up" | "auto";
  autoClose: boolean;
  required: boolean;
  placeholder: string;
};

const pgDefaults: PlaygroundConfig = {
  component: "range",
  commitMode: "instant",
  months: 2,
  minNights: 1,
  showNights: false,
  disablePast: true,
  maxYearsFuture: 2,
  maxYearsPast: 2,
  format: "EEE, MMM d",
  separator: " — ",
  locale: "en",
  align: "center",
  drop: "down",
  autoClose: false,
  required: false,
  placeholder: "Select date range",
};

function generateCode(c: PlaygroundConfig): string {
  const isRange = c.component === "range";
  const props: string[] = [isRange ? "value={range} onChange={setRange}" : "value={date} onChange={setDate}"];
  const add = (cond: boolean, p: string) => cond && props.push(p);

  add(c.commitMode !== "instant", `commitMode="${c.commitMode}"`);
  add(c.months !== (isRange ? 2 : 1), `months={${c.months}}`);
  if (isRange) {
    add(c.minNights !== 1, `minNights={${c.minNights}}`);
    add(c.showNights, "showNights");
    add(c.separator !== " — ", `separator="${c.separator}"`);
    add(c.autoClose, "autoClose");
  }
  add(!c.disablePast, "disablePast={false}");
  add(!c.disablePast && c.maxYearsPast !== 2, `maxYearsPast={${c.maxYearsPast}}`);
  add(c.maxYearsFuture !== 2, `maxYearsFuture={${c.maxYearsFuture}}`);
  add(c.format !== "EEE, MMM d", `format="${c.format}"`);
  add(c.locale !== "en", `locale="${c.locale}"`);
  add(c.align !== "center", `align="${c.align}"`);
  add(c.drop !== "down", `drop="${c.drop}"`);
  add(c.required, "required");
  const defaultPlaceholder = isRange ? "Select date range" : "Select date";
  add(c.placeholder !== defaultPlaceholder && c.placeholder.trim() !== "", `placeholder="${c.placeholder}"`);

  const tag = isRange ? "DateRangePicker" : "DatePicker";
  return props.length === 1
    ? `<${tag} ${props[0]} />`
    : `<${tag}\n  ${props.join("\n  ")}\n/>`;
}

function Field({
  label,
  off,
  check,
  children,
}: {
  label: string;
  off?: boolean;
  check?: boolean;
  children: ReactNode;
}) {
  return (
    <label className={["pg-field", check && "pg-check", off && "off"].filter(Boolean).join(" ")}>
      {check ? children : <span>{label}</span>}
      {check ? label : children}
    </label>
  );
}

function Playground() {
  const [c, setC] = useState<PlaygroundConfig>(pgDefaults);
  const [range, setRange] = useState(EMPTY);
  const [date, setDate] = useState<Date | null>(null);
  const set = <K extends keyof PlaygroundConfig>(key: K, value: PlaygroundConfig[K]) =>
    setC((prev) => ({ ...prev, [key]: value }));
  const isRange = c.component === "range";

  const shared = {
    commitMode: c.commitMode,
    months: c.months,
    disablePast: c.disablePast,
    maxYearsFuture: c.maxYearsFuture,
    maxYearsPast: c.maxYearsPast,
    format: c.format,
    locale: c.locale,
    align: c.align,
    drop: c.drop,
    required: c.required,
    placeholder: c.placeholder,
  } as const;

  return (
    <div className="card">
      <h3>Configure it live</h3>
      <p className="desc">
        Every control maps to a prop. The picker below and the generated code update as you
        change them.
      </p>

      <div className="pg-controls">
        <Field label="Component">
          <select
            value={c.component}
            onChange={(e) => {
              const component = e.target.value as "range" | "single";
              setC((prev) => ({
                ...prev,
                component,
                months: component === "single" ? 1 : 2,
                placeholder: component === "single" ? "Select date" : "Select date range",
              }));
              setRange(EMPTY);
              setDate(null);
            }}
          >
            <option value="range">DateRangePicker</option>
            <option value="single">DatePicker</option>
          </select>
        </Field>
        <Field label="commitMode">
          <select
            value={c.commitMode}
            onChange={(e) => set("commitMode", e.target.value as "instant" | "confirm")}
          >
            <option value="instant">instant</option>
            <option value="confirm">confirm</option>
          </select>
        </Field>
        <Field label="months">
          <select value={c.months} onChange={(e) => set("months", Number(e.target.value) as 1 | 2)}>
            <option value={1}>1</option>
            <option value={2}>2</option>
          </select>
        </Field>
        <Field label="minNights" off={!isRange}>
          <input
            type="number"
            min={0}
            max={30}
            value={c.minNights}
            onChange={(e) => set("minNights", Math.max(0, Math.min(30, Number(e.target.value) || 0)))}
          />
        </Field>
        <Field label="format">
          <input type="text" value={c.format} onChange={(e) => set("format", e.target.value)} />
        </Field>
        <Field label="separator" off={!isRange}>
          <input type="text" value={c.separator} onChange={(e) => set("separator", e.target.value)} />
        </Field>
        <Field label="locale">
          <select value={c.locale} onChange={(e) => set("locale", e.target.value)}>
            <option value="en">en</option>
            <option value="uk">uk</option>
            <option value="de">de</option>
            <option value="pl">pl</option>
            <option value="fr">fr</option>
            <option value="es">es</option>
            <option value="ja">ja</option>
          </select>
        </Field>
        <Field label="align">
          <select value={c.align} onChange={(e) => set("align", e.target.value as PlaygroundConfig["align"])}>
            <option value="left">left</option>
            <option value="center">center</option>
            <option value="right">right</option>
          </select>
        </Field>
        <Field label="drop">
          <select value={c.drop} onChange={(e) => set("drop", e.target.value as PlaygroundConfig["drop"])}>
            <option value="down">down</option>
            <option value="up">up</option>
            <option value="auto">auto</option>
          </select>
        </Field>
        <Field label="maxYearsFuture">
          <input
            type="number"
            min={0}
            max={10}
            value={c.maxYearsFuture}
            onChange={(e) => set("maxYearsFuture", Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
          />
        </Field>
        <Field label="maxYearsPast" off={c.disablePast}>
          <input
            type="number"
            min={0}
            max={10}
            value={c.maxYearsPast}
            onChange={(e) => set("maxYearsPast", Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
          />
        </Field>
        <Field label="placeholder">
          <input type="text" value={c.placeholder} onChange={(e) => set("placeholder", e.target.value)} />
        </Field>
        <Field label="disablePast" check>
          <input
            type="checkbox"
            checked={c.disablePast}
            onChange={(e) => set("disablePast", e.target.checked)}
          />
        </Field>
        <Field label="showNights" check off={!isRange}>
          <input
            type="checkbox"
            checked={c.showNights}
            onChange={(e) => set("showNights", e.target.checked)}
          />
        </Field>
        <Field label="autoClose" check off={!isRange}>
          <input
            type="checkbox"
            checked={c.autoClose}
            onChange={(e) => set("autoClose", e.target.checked)}
          />
        </Field>
        <Field label="required" check>
          <input
            type="checkbox"
            checked={c.required}
            onChange={(e) => set("required", e.target.checked)}
          />
        </Field>
      </div>

      <div className="pg-live">
        {isRange ? (
          <DateRangePicker
            key="range"
            value={range}
            onChange={setRange}
            minNights={c.minNights}
            showNights={c.showNights}
            separator={c.separator}
            autoClose={c.autoClose}
            {...shared}
          />
        ) : (
          <DatePicker key="single" value={date} onChange={setDate} {...shared} />
        )}
        <button
          type="button"
          className="demo-btn"
          onClick={() => {
            setRange(EMPTY);
            setDate(null);
          }}
        >
          Clear value
        </button>
      </div>

      <pre>
        <code>{generateCode(c)}</code>
      </pre>
      <span className="value">
        {isRange ? `value: ${showRange(range)}` : `value: ${showDate(date)}`}
      </span>
    </div>
  );
}

// Props reference --------------------------------------------------------------

type PropRow = {
  prop: string;
  type: string;
  def?: string;
  desc: string;
  rangeOnly?: boolean;
};

const PROP_ROWS: PropRow[] = [
  { prop: "value", type: "DateRange · Date | null", desc: "Controlled value — DateRange on the range picker, Date | null on DatePicker." },
  { prop: "defaultValue", type: "same as value", desc: "Initial value when uncontrolled." },
  { prop: "onChange", type: "(value) => void", desc: "Fires on commit: completed selection in instant mode, CTA press in confirm mode, clear()." },
  { prop: "onPartialChange", type: "(range) => void", desc: "A start date was picked but the range isn't complete yet.", rangeOnly: true },
  { prop: "onOpenChange", type: "(open) => void", desc: "Popover or mobile sheet opened / closed." },
  { prop: "minNights", type: "number", def: "1", desc: "Minimum range length in nights; 0 allows same-day selection.", rangeOnly: true },
  { prop: "disablePast", type: "boolean", def: "true", desc: "Disable dates before today." },
  { prop: "maxYearsFuture", type: "number", def: "2", desc: "Selectable window into the future, through the end of that month." },
  { prop: "maxYearsPast", type: "number", def: "2", desc: "Selectable window into the past (only with disablePast false)." },
  { prop: "minDate / maxDate", type: "Date", desc: "Exact bounds; override the year-based window." },
  { prop: "format", type: "string", def: '"EEE, MMM d"', desc: "Display pattern — YYYY, MMMM, MMM, MM, M, DD, D, EEEE, EEE tokens." },
  { prop: "separator", type: "string", def: '" — "', desc: "Text between start and end dates.", rangeOnly: true },
  { prop: "locale", type: "string", def: '"en"', desc: "BCP-47 tag for month and weekday names (Intl)." },
  { prop: "showNights", type: "boolean", def: "false", desc: "Append “(n nights)” to the footer summary.", rangeOnly: true },
  { prop: "commitMode", type: '"instant" | "confirm"', def: '"instant"', desc: "Update on every click, or only on the CTA." },
  { prop: "months", type: "1 | 2", def: "2 · 1", desc: "Months shown side by side on desktop (DatePicker defaults to 1)." },
  { prop: "align", type: '"left" | "center" | "right"', def: '"center"', desc: "Horizontal popover alignment relative to the input." },
  { prop: "drop", type: '"down" | "up" | "auto"', def: '"down"', desc: "Popover direction; auto flips up when space below runs out." },
  { prop: "autoCloseFirst", type: "boolean", def: "false", desc: "Desktop: close after the first completed selection (first open only).", rangeOnly: true },
  { prop: "autoClose", type: "boolean", def: "false", desc: "Desktop, instant mode: close on every completed selection. DatePicker always does this.", rangeOnly: true },
  { prop: "required", type: "boolean", def: "false", desc: "Closing without a complete selection shows the error." },
  { prop: "openOnError", type: "boolean", def: "false", desc: "Reopen the picker when the error prop turns truthy (e.g. failed submit)." },
  { prop: "error", type: "string | boolean", desc: "External error from your form library; a string becomes the message." },
  { prop: "strings", type: "Partial<Strings>", def: "English", desc: "Override any UI text — CTA, header, end-date hint, nights, error messages." },
  { prop: "classNames", type: "{ root, input, error, popover, cta }", desc: "Class overrides appended to the library's own classes." },
  { prop: "name", type: "string", desc: "Hidden yyyy-mm-dd inputs for plain HTML forms ({name}_start/{name}_end, or {name} on DatePicker)." },
  { prop: "disabled · placeholder · id · className · style · onBlur", type: "standard", desc: "Usual input concerns, passed through." },
];

function PropsReference() {
  return (
    <div className="card" id="props">
      <h3>All props</h3>
      <p className="desc">
        Shared by both components unless marked <span className="badge">range only</span>. Full
        JSDoc ships with the TypeScript types, so your editor shows all of this inline.
      </p>
      <div className="props-wrap">
        <table className="props">
          <thead>
            <tr>
              <th>Prop</th>
              <th>Type</th>
              <th>Default</th>
              <th>What it does</th>
            </tr>
          </thead>
          <tbody>
            {PROP_ROWS.map((r) => (
              <tr key={r.prop}>
                <td>
                  <code>{r.prop}</code>
                  {r.rangeOnly && <span className="badge">range only</span>}
                </td>
                <td>
                  <code>{r.type}</code>
                </td>
                <td>{r.def ? <code>{r.def}</code> : "—"}</td>
                <td>{r.desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="desc" style={{ marginTop: 16, marginBottom: 0 }}>
        Imperative <code>ref</code> on both components: <code>open()</code>, <code>close()</code>,{" "}
        <code>clear()</code>, <code>focus()</code>, <code>getValue()</code>. Theming: override the{" "}
        <code>--wf-dp-*</code> CSS variables (see the themed example above).
      </p>
    </div>
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
          <a href="#playground">Playground</a>
          <a href="#props">All props</a>
        </div>
        <code className="install">npm install github:mikhailvol/webfolks-date-range-picker-react</code>
        <p className="hint">
          Resize the window under 768px to see the fullscreen mobile experience with scrollable
          months.
        </p>
      </header>

      <section className="group" id="playground">
        <h2>Playground</h2>
        <Playground />
      </section>

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

      <section className="group">
        <h2>Reference</h2>
        <PropsReference />
      </section>

      <footer>
        Built by <a href="https://www.webfolks.io/">WebFolks.io</a> · MIT licensed · React port of
        the <a href="https://github.com/mikhailvol/webfolks-date-range-picker">vanilla-JS picker</a>{" "}
        for Webflow
      </footer>
    </main>
  );
}
