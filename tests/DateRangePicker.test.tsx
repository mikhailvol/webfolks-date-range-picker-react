import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { DateRangePicker } from "../src/DateRangePicker";
import { DatePicker } from "../src/DatePicker";
import type { DateRange } from "../src/types";

// Fixed "today": Sunday, March 15, 2026. Only Date is faked so real timers
// (focus restoration timeouts, etc.) keep working.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date(2026, 2, 15, 12, 0, 0));
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const getInput = () => screen.getByRole("textbox") as HTMLInputElement;

const openPicker = () => {
  fireEvent.click(getInput());
};

const cell = (iso: string) => {
  const el = document.querySelector<HTMLElement>(`[data-date="${iso}"]`);
  if (!el) throw new Error(`No cell for ${iso}`);
  return el;
};

/** Simulates the pointer tap gesture the picker listens for. */
const tap = (el: HTMLElement) => {
  fireEvent.pointerDown(el, { button: 0, clientX: 10, clientY: 10 });
  fireEvent.pointerUp(el, { button: 0, clientX: 10, clientY: 10 });
};

describe("DateRangePicker", () => {
  it("renders a closed, empty input", () => {
    render(<DateRangePicker placeholder="Select date range" />);
    const input = getInput();
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("aria-expanded", "false");
    expect(document.querySelector(".wf-dp-popover")).toBeNull();
  });

  it("opens on click and shows two months on desktop", () => {
    render(<DateRangePicker />);
    openPicker();
    expect(getInput()).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
    expect(screen.getByRole("grid", { name: "April 2026" })).toBeInTheDocument();
  });

  it("selects a range and commits instantly by default", () => {
    const onChange = vi.fn();
    const onPartialChange = vi.fn();
    render(<DateRangePicker onChange={onChange} onPartialChange={onPartialChange} />);
    openPicker();

    tap(cell("2026-03-20"));
    expect(onPartialChange).toHaveBeenCalledTimes(1);
    expect(getInput()).toHaveValue("Fri, Mar 20 — End Date");

    tap(cell("2026-03-25"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0]![0] as DateRange;
    expect(range.start?.getDate()).toBe(20);
    expect(range.end?.getDate()).toBe(25);
    expect(getInput()).toHaveValue("Fri, Mar 20 — Wed, Mar 25");
  });

  it("restarts the range on the next click after completion", () => {
    render(<DateRangePicker />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-25"));
    tap(cell("2026-03-28"));
    expect(getInput()).toHaveValue("Sat, Mar 28 — End Date");
  });

  it("an earlier click restarts from that date", () => {
    render(<DateRangePicker />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-17"));
    expect(getInput()).toHaveValue("Tue, Mar 17 — End Date");
  });

  it("enforces minNights", () => {
    const onChange = vi.fn();
    render(<DateRangePicker minNights={3} onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    const tooClose = cell("2026-03-22");
    expect(tooClose).toHaveAttribute("aria-disabled", "true");
    tap(tooClose);
    expect(onChange).not.toHaveBeenCalled();
    tap(cell("2026-03-23"));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("allows same-day selection when minNights is 0", () => {
    const onChange = vi.fn();
    render(<DateRangePicker minNights={0} showNights onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-20"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const range = onChange.mock.calls[0]![0] as DateRange;
    expect(range.start?.getDate()).toBe(20);
    expect(range.end?.getDate()).toBe(20);
  });

  it("disables past dates by default", () => {
    const onChange = vi.fn();
    render(<DateRangePicker onChange={onChange} />);
    openPicker();
    const yesterday = cell("2026-03-14");
    expect(yesterday).toHaveAttribute("aria-disabled", "true");
    tap(yesterday);
    expect(getInput()).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("confirm mode commits only via the CTA", () => {
    const onChange = vi.fn();
    render(<DateRangePicker commitMode="confirm" onChange={onChange} />);
    openPicker();

    const cta = screen.getByRole("button", { name: "Select dates" });
    expect(cta).toBeDisabled();

    tap(cell("2026-03-20"));
    expect(getInput()).toHaveValue(""); // input untouched until confirmed
    tap(cell("2026-03-25"));
    expect(onChange).not.toHaveBeenCalled();
    expect(cta).toBeEnabled();

    fireEvent.click(cta);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getInput()).toHaveValue("Fri, Mar 20 — Wed, Mar 25");
    expect(document.querySelector(".wf-dp-popover")).toBeNull(); // CTA closes
  });

  it("Escape closes and flags a dangling partial selection", () => {
    render(<DateRangePicker />);
    openPicker();
    tap(cell("2026-03-20"));
    fireEvent.keyDown(document, { key: "Escape" });
    expect(document.querySelector(".wf-dp-popover")).toBeNull();
    expect(screen.getByRole("alert")).toHaveTextContent("Please select a date range.");
    // Completing the range later clears the error.
    openPicker();
    tap(cell("2026-03-25"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("closes on outside pointerdown", () => {
    render(
      <div>
        <DateRangePicker />
        <button type="button">outside</button>
      </div>
    );
    openPicker();
    fireEvent.pointerDown(screen.getByRole("button", { name: "outside" }));
    expect(document.querySelector(".wf-dp-popover")).toBeNull();
  });

  it("supports keyboard navigation and selection", () => {
    const onChange = vi.fn();
    render(<DateRangePicker onChange={onChange} />);
    openPicker();

    // Focus starts on today.
    expect(document.activeElement).toBe(cell("2026-03-15"));

    const popover = document.querySelector(".wf-dp-popover")!;
    fireEvent.keyDown(popover, { key: "ArrowRight" });
    expect(document.activeElement).toBe(cell("2026-03-16"));
    fireEvent.keyDown(popover, { key: "ArrowDown" });
    expect(document.activeElement).toBe(cell("2026-03-23"));
    fireEvent.keyDown(popover, { key: "Enter" });
    expect(getInput()).toHaveValue("Mon, Mar 23 — End Date");
    fireEvent.keyDown(popover, { key: "ArrowRight" });
    fireEvent.keyDown(popover, { key: "Enter" });
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("skips disabled dates when arrowing backwards", () => {
    render(<DateRangePicker />);
    openPicker();
    // Today is the minimum selectable date; ArrowLeft cannot go below it.
    fireEvent.keyDown(document.querySelector(".wf-dp-popover")!, { key: "ArrowLeft" });
    expect(document.activeElement).toBe(cell("2026-03-15"));
  });

  it("PageDown moves focus a month ahead", () => {
    render(<DateRangePicker />);
    openPicker();
    fireEvent.keyDown(document.querySelector(".wf-dp-popover")!, { key: "PageDown" });
    expect(document.activeElement).toBe(cell("2026-04-15"));
  });

  it("works as a controlled component and resets from outside", () => {
    function Harness() {
      const [range, setRange] = useState<DateRange>({ start: null, end: null });
      return (
        <div>
          <DateRangePicker value={range} onChange={setRange} />
          <button type="button" onClick={() => setRange({ start: null, end: null })}>
            reset
          </button>
        </div>
      );
    }
    render(<Harness />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-25"));
    expect(getInput()).toHaveValue("Fri, Mar 20 — Wed, Mar 25");
    fireEvent.keyDown(document, { key: "Escape" });
    fireEvent.click(screen.getByRole("button", { name: "reset" }));
    expect(getInput()).toHaveValue("");
  });

  it("respects locale for months, weekdays and formatting", () => {
    render(<DateRangePicker locale="de" format="EEE, D MMMM" />);
    openPicker();
    expect(screen.getByRole("grid", { name: "März 2026" })).toBeInTheDocument();
    tap(cell("2026-03-20"));
    expect(getInput().value.startsWith("Fr")).toBe(true);
  });

  it("renders hidden ISO inputs when name is provided", () => {
    render(<DateRangePicker name="stay" />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-25"));
    const start = document.querySelector<HTMLInputElement>('input[name="stay_start"]');
    const end = document.querySelector<HTMLInputElement>('input[name="stay_end"]');
    expect(start?.value).toBe("2026-03-20");
    expect(end?.value).toBe("2026-03-25");
  });

  it("showFooterDates={false} hides dates in the footer but keeps the nights count", () => {
    render(<DateRangePicker showFooterDates={false} showNights />);
    openPicker();
    const footer = document.querySelector(".wf-dp-footer-left")!;
    expect(footer).toHaveTextContent("Select dates");
    tap(cell("2026-03-20"));
    // Partial selection: no dates leak into the footer, prompt stays.
    expect(footer).toHaveTextContent("Select dates");
    tap(cell("2026-03-23"));
    expect(footer.textContent).toBe("3 nights");
    // The input still shows the formatted range.
    expect(getInput()).toHaveValue("Fri, Mar 20 — Mon, Mar 23");
  });

  it("showFooterDates={false} without showNights leaves the footer empty when complete", () => {
    render(<DateRangePicker showFooterDates={false} />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-23"));
    expect(document.querySelector(".wf-dp-footer-left")!.textContent).toBe("");
  });

  it("footerFormat formats footer dates independently of the input", () => {
    render(<DateRangePicker footerFormat="D MMM" />);
    openPicker();
    const footer = document.querySelector(".wf-dp-footer-left")!;
    tap(cell("2026-03-20"));
    expect(footer.textContent).toBe("20 Mar — End Date");
    tap(cell("2026-03-23"));
    expect(footer.textContent).toBe("20 Mar — 23 Mar");
    // Input keeps the default format.
    expect(getInput()).toHaveValue("Fri, Mar 20 — Mon, Mar 23");
  });

  it("shows an external error message", () => {
    render(<DateRangePicker error="Dates are required" />);
    expect(screen.getByRole("alert")).toHaveTextContent("Dates are required");
    expect(getInput()).toHaveAttribute("aria-invalid", "true");
  });
});

describe("DatePicker", () => {
  it("shows one month by default, commits a Date on pick, and closes the popover", () => {
    const onChange = vi.fn();
    render(<DatePicker onChange={onChange} />);
    openPicker();
    expect(document.querySelectorAll(".wf-dp-month").length).toBe(1);
    expect(screen.getByRole("button", { name: "Select date" })).toBeInTheDocument();
    tap(cell("2026-03-20"));
    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = onChange.mock.calls[0]![0] as Date;
    expect(picked.getDate()).toBe(20);
    expect(getInput()).toHaveValue("Fri, Mar 20");
    expect(document.querySelector(".wf-dp-popover")).toBeNull(); // closes on pick
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("supports months={2}", () => {
    render(<DatePicker months={2} />);
    openPicker();
    expect(document.querySelectorAll(".wf-dp-month").length).toBe(2);
  });

  it("replaces the selection on every pick and commits via CTA in confirm mode", () => {
    const onChange = vi.fn();
    render(<DatePicker commitMode="confirm" onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    tap(cell("2026-03-25"));
    expect(getInput()).toHaveValue("");
    expect(onChange).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Select date" }));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect((onChange.mock.calls[0]![0] as Date).getDate()).toBe(25);
    expect(getInput()).toHaveValue("Wed, Mar 25");
  });

  it("accepts a controlled Date value and renders a single hidden input", () => {
    render(<DatePicker name="checkin" value={new Date(2026, 2, 21)} />);
    expect(getInput()).toHaveValue("Sat, Mar 21");
    const hidden = document.querySelector<HTMLInputElement>('input[name="checkin"]');
    expect(hidden?.value).toBe("2026-03-21");
    expect(document.querySelector('input[name="checkin_start"]')).toBeNull();
  });

  it("clear() via ref commits null and getValue reads the Date", () => {
    const onChange = vi.fn();
    const ref = { current: null as import("../src/types").DatePickerRef | null };
    render(<DatePicker ref={ref} onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    expect(ref.current?.getValue()?.getDate()).toBe(20);
    act(() => ref.current?.clear());
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(ref.current?.getValue()).toBeNull();
  });
});

describe("months={1}", () => {
  it("shows a single month and navigates by one", () => {
    render(<DateRangePicker months={1} />);
    openPicker();
    expect(screen.getByRole("grid", { name: "March 2026" })).toBeInTheDocument();
    expect(screen.queryByRole("grid", { name: "April 2026" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    expect(screen.getByRole("grid", { name: "April 2026" })).toBeInTheDocument();
    expect(screen.queryByRole("grid", { name: "March 2026" })).toBeNull();
  });

  it("autoClose closes a range picker on every completion", () => {
    const onChange = vi.fn();
    render(<DateRangePicker months={1} autoClose onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    expect(document.querySelector(".wf-dp-popover")).not.toBeNull(); // partial stays open
    tap(cell("2026-03-25"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(document.querySelector(".wf-dp-popover")).toBeNull();
    // Unlike autoCloseFirst, it also closes on later opens.
    openPicker();
    tap(cell("2026-03-27"));
    tap(cell("2026-03-30"));
    expect(onChange).toHaveBeenCalledTimes(2);
    expect(document.querySelector(".wf-dp-popover")).toBeNull();
  });

  it("still selects a range spanning navigation", () => {
    const onChange = vi.fn();
    render(<DateRangePicker months={1} onChange={onChange} />);
    openPicker();
    tap(cell("2026-03-20"));
    fireEvent.click(screen.getByRole("button", { name: "Next month" }));
    tap(cell("2026-04-02"));
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(getInput()).toHaveValue("Fri, Mar 20 — Thu, Apr 2");
  });
});
