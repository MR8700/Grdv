import { Share } from 'react-native';
import RNHTMLtoPDFModule from 'react-native-html-to-pdf';

export interface PdfColumn<T> {
  key: string;
  label: string;
  value: (row: T) => string | number | boolean | null | undefined;
}

interface PdfExportOptions<T> {
  title: string;
  rows: T[];
  columns: PdfColumn<T>[];
  filters?: Record<string, string | number | boolean | null | undefined>;
  fileName?: string;
}

export class PdfExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PdfExportError';
  }
}

const escapeHtml = (input: unknown) =>
  String(input ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

const buildFiltersHtml = (filters?: PdfExportOptions<unknown>['filters']) => {
  if (!filters) return '';
  const items = Object.entries(filters)
    .filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== '')
    .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(value)}</li>`);
  if (items.length === 0) return '';
  return `<h3>Filtres appliques</h3><ul>${items.join('')}</ul>`;
};

const buildRowsHtml = <T>(rows: T[], columns: PdfColumn<T>[]) =>
  rows
    .map(
      (row) =>
        `<tr>${columns
          .map((column) => `<td>${escapeHtml(column.value(row))}</td>`)
          .join('')}</tr>`
    )
    .join('');

const buildHtml = <T>({ title, rows, columns, filters }: PdfExportOptions<T>) => {
  const generatedAt = new Date().toLocaleString('fr-FR');
  const tableHead = columns.map((column) => `<th>${escapeHtml(column.label)}</th>`).join('');
  const tableBody = buildRowsHtml(rows, columns);
  const filtersHtml = buildFiltersHtml(filters as PdfExportOptions<unknown>['filters']);

  return `<!DOCTYPE html>
<html lang="fr">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(title)}</title>
    <style>
      body { font-family: Arial, sans-serif; padding: 20px; color: #0f172a; }
      h1 { margin: 0 0 8px 0; font-size: 22px; }
      .meta { color: #475569; font-size: 12px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; font-size: 12px; }
      th, td { border: 1px solid #cbd5e1; padding: 8px; text-align: left; vertical-align: top; }
      th { background: #f1f5f9; font-weight: 700; }
      tr:nth-child(even) td { background: #f8fafc; }
      h3 { margin: 16px 0 6px 0; font-size: 14px; }
      ul { margin: 4px 0 14px 16px; padding: 0; }
      li { margin: 2px 0; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(title)}</h1>
    <div class="meta">Genere le ${escapeHtml(generatedAt)} - ${rows.length} ligne(s)</div>
    ${filtersHtml}
    <table>
      <thead><tr>${tableHead}</tr></thead>
      <tbody>${tableBody}</tbody>
    </table>
  </body>
</html>`;
};

export async function exportToPdfAndShare<T>(options: PdfExportOptions<T>) {
  if (!options.columns?.length) {
    throw new PdfExportError('Aucune colonne d export n a ete fournie.');
  }

  if (!options.rows?.length) {
    throw new PdfExportError('Aucune donnee a exporter pour le moment.');
  }

  const html = buildHtml(options);
  const fileName =
    options.fileName ||
    options.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

  const RNHTMLtoPDF = (RNHTMLtoPDFModule as any)?.default ?? RNHTMLtoPDFModule;

  if (typeof RNHTMLtoPDF?.convert !== 'function') {
    throw new PdfExportError('Le module PDF n est pas disponible sur cet appareil.');
  }

  let result;
  try {
    result = await RNHTMLtoPDF.convert({
      html,
      fileName: `${fileName}-${Date.now()}`,
      directory: 'Documents',
    });
  } catch (error: any) {
    throw new PdfExportError(error?.message ?? 'La generation du PDF a echoue.');
  }

  if (!result.filePath) {
    throw new PdfExportError('Le fichier PDF n a pas pu etre cree.');
  }

  const fileUrl = result.filePath.startsWith('file://') ? result.filePath : `file://${result.filePath}`;
  try {
    await Share.share({ url: fileUrl, title: options.title });
  } catch (error: any) {
    throw new PdfExportError(error?.message ?? 'Le partage du PDF a echoue.');
  }
}

export function getPdfExportErrorMessage(error: unknown) {
  if (error instanceof PdfExportError) {
    return error.message;
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'La generation ou le partage du PDF a echoue.';
}
