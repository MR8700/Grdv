import { Share } from 'react-native';

export interface ExportColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

interface ExportOptions<T> {
  title: string;
  rows: T[];
  columns: ExportColumn<T>[];
  filters?: Record<string, string | number | boolean | null | undefined>;
}

const escapeCsvCell = (value: unknown) => {
  const raw = String(value ?? '');
  if (raw.includes('"') || raw.includes(',') || raw.includes('\n')) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

export const buildCsv = <T>(rows: T[], columns: ExportColumn<T>[]) => {
  const header = columns.map((c) => escapeCsvCell(c.label)).join(',');
  const body = rows
    .map((row) => columns.map((c) => escapeCsvCell(c.value(row))).join(','))
    .join('\n');
  return `${header}\n${body}`;
};

const buildFiltersBlock = (filters?: ExportOptions<unknown>['filters']) => {
  if (!filters) return '';
  const lines = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `- ${key}: ${value}`);
  return lines.length ? `Filtres appliques\n${lines.join('\n')}\n\n` : '';
};

export const shareExport = async <T>({ title, rows, columns, filters }: ExportOptions<T>) => {
  const csv = buildCsv(rows, columns);
  const stamp = new Date().toLocaleString('fr-FR');
  const filtersBlock = buildFiltersBlock(filters as ExportOptions<unknown>['filters']);
  const message = `${title}\nGenere le ${stamp}\nLignes: ${rows.length}\n\n${filtersBlock}${csv}`;
  await Share.share({ message });
};

