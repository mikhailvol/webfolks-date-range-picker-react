"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  DateRangePicker,
  toISODate,
  type DateRange,
  type DateRangePickerRef,
} from "webfolks-date-range-picker-react";

const show = (r: DateRange) =>
  `{ start: ${r.start ? toISODate(r.start) : "null"}, end: ${r.end ? toISODate(r.end) : "null"} }`;

function Basic() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const picker = useRef<DateRangePickerRef>(null);
  return (
    <section>
      <h2>Default</h2>
      <p>Instant commit, min 1 night, past disabled, 2 years ahead.</p>
      <div className="row">
        <DateRangePicker
          ref={picker}
          value={range}
          onChange={setRange}
          placeholder="Select date range"
        />
        <button type="button" className="demo-btn" onClick={() => picker.current?.clear()}>
          Reset dates
        </button>
        <button type="button" className="demo-btn" onClick={() => picker.current?.open()}>
          Open via API
        </button>
      </div>
      <div className="value">value: {show(range)}</div>
    </section>
  );
}

function ConfirmMode() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <section>
      <h2>Confirm mode + nights counter</h2>
      <p>
        commitMode=&quot;confirm&quot; showNights minNights=2 — the input updates only on
        &quot;Select dates&quot;.
      </p>
      <DateRangePicker
        value={range}
        onChange={setRange}
        commitMode="confirm"
        showNights
        minNights={2}
        placeholder="Min 2 nights, confirm to apply"
      />
      <div className="value">value: {show(range)}</div>
    </section>
  );
}

function SameDay() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <section>
      <h2>Same-day selection</h2>
      <p>minNights=0 — tapping the same date twice selects a 0-night range.</p>
      <DateRangePicker value={range} onChange={setRange} minNights={0} placeholder="Same-day allowed" />
      <div className="value">value: {show(range)}</div>
    </section>
  );
}

function PastAndFormat() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <section>
      <h2>Past dates, custom format, right-aligned, drop auto</h2>
      <p>disablePast=false maxYearsPast=1 format=&quot;DD MMM YYYY&quot; align=&quot;right&quot; drop=&quot;auto&quot;.</p>
      <DateRangePicker
        value={range}
        onChange={setRange}
        disablePast={false}
        maxYearsPast={1}
        format="DD MMM YYYY"
        separator=" to "
        align="right"
        drop="auto"
        placeholder="Past enabled"
      />
      <div className="value">value: {show(range)}</div>
    </section>
  );
}

function Localized() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  return (
    <section>
      <h2>Localized (uk) + themed</h2>
      <p>locale=&quot;uk&quot; with overridden strings and a custom --wf-dp-primary.</p>
      <div className="themed">
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
      </div>
      <div className="value">value: {show(range)}</div>
    </section>
  );
}

function SingleDate() {
  const [date, setDate] = useState<Date | null>(null);
  const [confirmed, setConfirmed] = useState<Date | null>(null);
  return (
    <section>
      <h2>Single date (classic datepicker)</h2>
      <p>
        mode=&quot;single&quot; months={"{1}"} — one calendar, instant pick, closes on selection;
        the second one uses confirm mode.
      </p>
      <div className="row">
        <DateRangePicker
          mode="single"
          months={1}
          value={date}
          onChange={setDate}
          placeholder="Pick a date"
        />
        <DateRangePicker
          mode="single"
          commitMode="confirm"
          value={confirmed}
          onChange={setConfirmed}
          placeholder="Pick + confirm"
        />
      </div>
      <div className="value">
        instant: {date ? toISODate(date) : "null"} · confirm:{" "}
        {confirmed ? toISODate(confirmed) : "null"}
      </div>
    </section>
  );
}

function OneMonth() {
  const [range, setRange] = useState<DateRange>({ start: null, end: null });
  const [auto, setAuto] = useState<DateRange>({ start: null, end: null });
  return (
    <section>
      <h2>One month on desktop</h2>
      <p>
        months={"{1}"} — compact single-month popover; the second adds autoClose, so a
        completed range closes it instantly. Mobile keeps the scrollable stack.
      </p>
      <div className="row">
        <DateRangePicker value={range} onChange={setRange} months={1} placeholder="Single-month popover" />
        <DateRangePicker
          value={auto}
          onChange={setAuto}
          months={1}
          autoClose
          placeholder="Range, closes on completion"
        />
      </div>
      <div className="value">
        value: {show(range)} · autoClose: {show(auto)}
      </div>
    </section>
  );
}

type BookingForm = { stay: DateRange };

function WithReactHookForm() {
  const [submitted, setSubmitted] = useState<string>();
  const { control, handleSubmit, reset } = useForm<BookingForm>({
    defaultValues: { stay: { start: null, end: null } },
  });
  return (
    <section>
      <h2>react-hook-form</h2>
      <p>Controller + validation + reset; openOnError reopens the picker on failed submit.</p>
      <form
        onSubmit={handleSubmit((values) => {
          setSubmitted(show(values.stay));
        })}
        noValidate
      >
        <div className="row">
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
            Form reset
          </button>
        </div>
      </form>
      {submitted && <div className="value">submitted: {submitted}</div>}
    </section>
  );
}

export default function Page() {
  return (
    <main>
      <h1>WebFolks Date Range Picker — React</h1>
      <p className="lead">
        Native React port of the WebFolks vanilla-JS picker. Resize under 768px for the
        fullscreen mobile experience.
      </p>
      <Basic />
      <SingleDate />
      <OneMonth />
      <ConfirmMode />
      <SameDay />
      <PastAndFormat />
      <Localized />
      <WithReactHookForm />
    </main>
  );
}
