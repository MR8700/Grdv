import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../store/ThemeContext';

interface AppPaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

function AppPaginationComponent({ page, totalPages, onPrev, onNext }: AppPaginationProps) {
  const { colors } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginVertical: 16,
        paddingHorizontal: 4,
        gap: 16,
      }}
    >
      <AppButton label="Precedent" variant="outline" size="sm" onPress={onPrev} disabled={page <= 1} />

      <Text
        style={{
          color: colors.textMuted,
          fontSize: 14,
          fontWeight: '600',
          minWidth: 80,
          textAlign: 'center',
        }}
      >
        Page {page} / {Math.max(totalPages, 1)}
      </Text>

      <AppButton label="Suivant" variant="outline" size="sm" onPress={onNext} disabled={page >= totalPages} />
    </View>
  );
}

export const AppPagination = React.memo(AppPaginationComponent);
