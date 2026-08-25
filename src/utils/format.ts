import NepaliDate from 'nepali-date-converter';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(amount);
}
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}

// AD (Gregorian) month names — kept for any generic use
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function monthName(m: number) { return MONTHS[m - 1]; }

// Bikram Sambat (BS) month names
export const BS_MONTHS = [
  'Baishakh', 'Jestha', 'Ashadh', 'Shrawan',
  'Bhadra', 'Ashwin', 'Kartik', 'Mangsir',
  'Poush', 'Magh', 'Falgun', 'Chaitra',
];

export function bsMonthName(month: number): string {
  return BS_MONTHS[month - 1] ?? '';
}

/** Returns the current date in Bikram Sambat. */
export function currentBsDate(): { year: number; month: number; day: number } {
  const nd = new NepaliDate(new Date());
  return { year: nd.getYear(), month: nd.getMonth() + 1, day: nd.getDate() };
}

/** Return today's date as a YYYY-MM-DD string for use with <input type="date">. */
export function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

/** A Bikram Sambat period as people say it: "Bhadra 2082". */
export function bsPeriod(month: number, year: number): string {
  return `${bsMonthName(month)} ${year}`;
}

/** "MonthlyDeposit" -> "Monthly Deposit". */
export function spaceCamelCase(value: string): string {
  return value.replace(/([A-Z])/g, ' $1').trim();
}

/**
 * How a deposit reads. A monthly deposit is identified by the month it covers, which is
 * recorded in Bikram Sambat and is not the date it happened to be paid; the other kinds
 * are one-offs with no period to name.
 */
export function depositLabel(type: string, month?: number | null, year?: number | null): string {
  const label = spaceCamelCase(type);
  return type === 'MonthlyDeposit' && month && year ? `${label} · ${bsPeriod(month, year)}` : label;
}
