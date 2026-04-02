export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR', maximumFractionDigits: 0 }).format(amount);
}
export function formatDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-NP', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(dateStr));
}
export const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export function monthName(m: number) { return MONTHS[m - 1]; }
