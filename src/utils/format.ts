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
