import { transactionsApi } from '../../api/finance';
import type { Transaction } from '../../api/types';
import { formatCurrency, formatDate } from '../../utils/format';
import { TYPE_LABELS } from './transactionLabels';

type Filters = Omit<NonNullable<Parameters<typeof transactionsApi.getAll>[0]>, 'page' | 'pageSize'>;

/** The API's largest page. */
const PAGE_SIZE = 1000;

/** Every transaction matching the filters, not just the page on screen. */
export async function fetchAllTransactions(filters: Filters): Promise<Transaction[]> {
  const rows: Transaction[] = [];
  for (let page = 1; ; page++) {
    const result = await transactionsApi.getAll({ ...filters, page, pageSize: PAGE_SIZE });
    rows.push(...result.items);
    if (!result.items.length || rows.length >= result.total) return rows;
  }
}

function download(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
}

const csvCell = (value: string | number) => {
  const s = String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function exportCsv(rows: Transaction[], fileName: string, range: { from: string; to: string }) {
  const header = ['Date', 'Name', 'Type', 'Description', 'Credit', 'Debit'];
  // Plain dates and numbers, so a spreadsheet can sort and sum them.
  const lines = rows.map(t => [
    t.occurredAt.slice(0, 10),
    t.memberName ?? '',
    TYPE_LABELS[t.type],
    t.description,
    t.side === 'Credit' ? t.amount : '',
    t.side === 'Debit' ? t.amount : '',
  ].map(csvCell).join(','));
  // The byte order mark tells Excel the file is UTF-8.
  // The period goes above the table, with a blank line so the table still starts cleanly.
  const preamble = [`Date range,${range.from} to ${range.to}`, ''];
  download(new Blob(['\uFEFF' + [...preamble, header.join(','), ...lines].join('\r\n')], { type: 'text/csv;charset=utf-8' }), `${fileName}.csv`);
}

const TEAL_700: [number, number, number] = [15, 118, 110];
const RED_600: [number, number, number] = [220, 38, 38];

/** Laid out like the table on the page: date, name, description with type, side, amount. */
export async function exportPdf(rows: Transaction[], fileName: string, title: string, subtitle: string) {
  // Loaded on demand: the PDF libraries are large and only needed here.
  const [{ jsPDF }, { default: autoTable }] = await Promise.all([import('jspdf'), import('jspdf-autotable')]);
  const doc = new jsPDF();

  doc.setFontSize(16);
  doc.text(title, 14, 16);
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(subtitle, 14, 22);

  autoTable(doc, {
    startY: 27,
    head: [['Date', 'Name', 'Description', 'Type', 'Amount']],
    body: rows.map(t => [
      formatDate(t.occurredAt),
      t.memberName ?? '—',
      `${t.description}\n${TYPE_LABELS[t.type]}`,
      t.side,
      formatCurrency(t.amount),
    ]),
    styles: { fontSize: 9, cellPadding: 2.5 },
    headStyles: { fillColor: [249, 250, 251], textColor: [107, 114, 128], fontStyle: 'bold' },
    // White rows, as on screen, rather than the library's striping.
    alternateRowStyles: { fillColor: [255, 255, 255] },
    columnStyles: { 0: { cellWidth: 26 }, 1: { cellWidth: 36 }, 3: { cellWidth: 18 }, 4: { halign: 'right', cellWidth: 30 } },
    didParseCell: ({ section, column, row, cell }) => {
      if (section === 'head' && column.index === 4) cell.styles.halign = 'right';
      if (section !== 'body' || (column.index !== 3 && column.index !== 4)) return;
      cell.styles.textColor = rows[row.index].side === 'Credit' ? TEAL_700 : RED_600;
      if (column.index === 4) cell.styles.fontStyle = 'bold';
    },
  });

  doc.save(`${fileName}.pdf`);
}
