import { type Locale, localeTags, t } from '../i18n/ui';

/** "2025-07" → first day of that month (UTC). */
function toDate(yearMonth: string): Date {
  const [year, month] = yearMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function formatMonth(yearMonth: string, locale: Locale): string {
  return new Intl.DateTimeFormat(localeTags[locale], {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(toDate(yearMonth));
}

export function formatPeriod(
  start: string,
  end: string | null,
  locale: Locale,
  style: 'month' | 'year' = 'month',
): string {
  const format = (value: string) =>
    style === 'year' ? value.slice(0, 4) : formatMonth(value, locale);
  const from = format(start);
  const to = end ? format(end) : t(locale, 'date.present');
  return from === to ? from : `${from} — ${to}`;
}

/** Inclusive month count, the same way LinkedIn counts it (Jul 2025 → Sep 2026 = 15). */
export function monthsBetween(start: string, end: string | null, now = new Date()): number {
  const from = toDate(start);
  const to = end ? toDate(end) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  return (
    (to.getUTCFullYear() - from.getUTCFullYear()) * 12 + (to.getUTCMonth() - from.getUTCMonth()) + 1
  );
}

export function formatDuration(months: number, locale: Locale): string {
  const unit = (value: number, name: 'year' | 'month') =>
    new Intl.NumberFormat(localeTags[locale], {
      style: 'unit',
      unit: name,
      unitDisplay: 'long',
    }).format(value);
  const years = Math.floor(months / 12);
  const rest = months % 12;
  return [years > 0 && unit(years, 'year'), rest > 0 && unit(rest, 'month')]
    .filter(Boolean)
    .join(' ');
}
