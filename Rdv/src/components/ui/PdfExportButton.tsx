import React from 'react';
import { PdfColumn } from '../../utils/pdfExport';

interface PdfExportButtonProps<T> {
  title: string;
  rows: T[];
  columns: PdfColumn<T>[];
  filters?: Record<string, string | number | boolean | null | undefined>;
  fileName?: string;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  disabled?: boolean;
}

export function PdfExportButton<T>({
  title,
  rows,
  columns,
  filters,
  fileName,
  label = 'Exporter PDF',
  size = 'sm',
  variant = 'outline',
  disabled = false,
}: PdfExportButtonProps<T>) {
  void title;
  void rows;
  void columns;
  void filters;
  void fileName;
  void label;
  void size;
  void variant;
  void disabled;
  return null;
}
