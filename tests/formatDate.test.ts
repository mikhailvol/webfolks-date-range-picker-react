import { describe, expect, it } from "vitest";
import { formatWithPattern, getWeekdayLabels, resolveLocale } from "../src/formatDate";

const date = new Date(2026, 2, 7); // Saturday, March 7, 2026

describe("formatWithPattern", () => {
  it("formats the default pattern", () => {
    expect(formatWithPattern(date, "EEE, MMM d", "en")).toBe("Sat, Mar 7");
  });

  it("formats ISO-style patterns", () => {
    expect(formatWithPattern(date, "YYYY-MM-DD", "en")).toBe("2026-03-07");
  });

  it("formats long patterns with short years", () => {
    expect(formatWithPattern(date, "EEEE, D MMMM YY", "en")).toBe("Saturday, 7 March 26");
  });

  it("localizes month and weekday names", () => {
    expect(formatWithPattern(date, "MMMM YYYY", "de")).toBe("März 2026");
    expect(formatWithPattern(date, "EEE", "de")).toMatch(/^Sa/);
    // Non-ASCII names must survive the bare-M/D/d tokens.
    expect(formatWithPattern(date, "D MMMM", "de")).toBe("7 März");
  });
});

describe("getWeekdayLabels", () => {
  it("is Monday-first", () => {
    const labels = getWeekdayLabels("en");
    expect(labels).toHaveLength(7);
    expect(labels[0]).toBe("Mon");
    expect(labels[6]).toBe("Sun");
  });
});

describe("resolveLocale", () => {
  it("keeps supported locales and falls back to en", () => {
    expect(resolveLocale("uk")).toBe("uk");
    expect(resolveLocale(undefined)).toBe("en");
    expect(resolveLocale("no-such-locale-!!")).toBe("en");
  });
});
