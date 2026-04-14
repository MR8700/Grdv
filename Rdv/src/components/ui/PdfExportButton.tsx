import React from 'react';
import { AppButton } from './AppButton';
import { Toast } from './AppAlert';
import { exportToPdfAndShare, getPdfExportErrorMessage, PdfColumn } from '../../utils/pdfExport';
import { useAppSettings } from '../../store/AppSettingsContext';

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
  const { currentRole, rolePreferences } = useAppSettings();
  const exportAllowed = rolePreferences[currentRole]?.exportEnabled !== false;

  const handlePress = React.useCallback(async () => {
    if (disabled || !exportAllowed) return;

    if (!rows || rows.length === 0) {
      Toast.info('Export PDF', 'Aucune donnee a exporter pour le moment.', 1800);
      return;
    }

    try {
      await exportToPdfAndShare({ title, rows, columns, filters, fileName });
      Toast.success('PDF pret', `${rows.length} ligne(s) exportee(s).`);
    } catch (error) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(error));
    }
  }, [columns, disabled, exportAllowed, fileName, filters, rows, title]);

  if (!exportAllowed) return null;

  return (
    <AppButton
      label={label}
      size={size}
      variant={variant}
      onPress={handlePress}
      disabled={disabled || !exportAllowed}
    />
  );
}
