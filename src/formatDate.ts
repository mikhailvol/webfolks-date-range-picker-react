type LocaleFormatters = {
  wShort: Intl.DateTimeFormat;
  wLong: Intl.DateTimeFormat;
  mShort: Intl.DateTimeFormat;
  mLong: Intl.DateTimeFormat;
  monthYear: Intl.DateTimeFormat;
  fullDate: Intl.DateTimeFormat;
};

const cache = new Map<string, LocaleFormatters>();

/** Validate a BCP-47 tag against Intl, falling back to English. */
export function resolveLocale(locale?: string): string {
  const requested = locale || "en";
  try {
    return Intl.DateTimeFormat.supportedLocalesOf([requested])[0] ?? "en";
  } catch {
    return "en";
  }
}

function formatters(locale: string): LocaleFormatters {
  let f = cache.get(locale);
  if (!f) {
    f = {
      wShort: new Intl.DateTimeFormat(locale, { weekday: "short" }),
      wLong: new Intl.DateTimeFormat(locale, { weekday: "long" }),
      mShort: new Intl.DateTimeFormat(locale, { month: "short" }),
      mLong: new Intl.DateTimeFormat(locale, { month: "long" }),
      monthYear: new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
      fullDate: new Intl.DateTimeFormat(locale, {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
    cache.set(locale, f);
  }
  return f;
}

const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);

// Longest alternatives first so e.g. MMMM wins over MM; single-character
// tokens are word-bounded so literal text in patterns survives.
const TOKEN_RE = /YYYY|yyyy|MMMM|MMM|MM|DD|dd|EEEE|EEE|YY|yy|\bM\b|\bD\b|\bd\b/g;

/**
 * Format with the WebFolks token pattern:
 * `YYYY`/`yyyy`, `YY`/`yy`, `MMMM`, `MMM`, `MM`, `M`, `DD`/`dd`, `D`/`d`, `EEEE`, `EEE`.
 *
 * Tokens are resolved in a single pass over the pattern, so localized month or
 * weekday names never get re-scanned as tokens (the original library's
 * sequential replaces mangled names like "Mär" via the bare-`M` rule).
 */
export function formatWithPattern(date: Date, pattern: string, locale: string): string {
  const f = formatters(locale);
  const y = date.getFullYear();
  const M = date.getMonth() + 1;
  const d = date.getDate();

  return pattern.replace(TOKEN_RE, (token) => {
    switch (token) {
      case "YYYY":
      case "yyyy":
        return String(y);
      case "YY":
      case "yy":
        return String(y).slice(-2);
      case "MMMM":
        return f.mLong.format(date);
      case "MMM":
        return f.mShort.format(date);
      case "MM":
        return pad2(M);
      case "M":
        return String(M);
      case "DD":
      case "dd":
        return pad2(d);
      case "D":
      case "d":
        return String(d);
      case "EEEE":
        return f.wLong.format(date);
      case "EEE":
        return f.wShort.format(date);
      default:
        return token;
    }
  });
}

/** Short weekday labels, Monday-first. */
export function getWeekdayLabels(locale: string): string[] {
  const f = formatters(locale);
  const base = new Date(2024, 0, 1); // a Monday
  return Array.from({ length: 7 }, (_, i) =>
    f.wShort.format(new Date(base.getFullYear(), base.getMonth(), base.getDate() + i))
  );
}

/** e.g. "March 2026", localized. */
export function formatMonthYear(date: Date, locale: string): string {
  return formatters(locale).monthYear.format(date);
}

/** Full localized date for screen readers, e.g. "Saturday, March 7, 2026". */
export function formatFullDate(date: Date, locale: string): string {
  return formatters(locale).fullDate.format(date);
}
