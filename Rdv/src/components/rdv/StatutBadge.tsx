import React from 'react';
import { View, Text, ViewStyle } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

interface StatutBadgeProps {
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'REFUSE' | 'ANNULE' | 'ARCHIVE' | 'TERMINE';
  size?: 'sm' | 'md';
  style?: ViewStyle;
}

export function StatutBadge({ statut, size = 'md', style }: StatutBadgeProps) {
  const { colors } = useTheme();

  const colorsMap: Record<StatutBadgeProps['statut'], string> = {
    EN_ATTENTE: colors.warning,
    CONFIRME: colors.success,
    REFUSE: colors.danger,
    ANNULE: colors.danger,
    ARCHIVE: colors.textMuted,
    TERMINE: colors.primary,
  };

  const textMap: Record<StatutBadgeProps['statut'], string> = {
    EN_ATTENTE: 'En attente',
    CONFIRME: 'Confirme',
    REFUSE: 'Refuse',
    ANNULE: 'Annule',
    ARCHIVE: 'Archive',
    TERMINE: 'Termine',
  };

  const badgeSize = size === 'sm'
    ? { paddingVertical: 2, paddingHorizontal: 6, borderRadius: 8, fontSize: 10 }
    : { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, fontSize: 12 };

  return (
    <View
      style={[
        {
          backgroundColor: colorsMap[statut],
          alignSelf: 'flex-start',
          borderRadius: badgeSize.borderRadius,
          paddingVertical: badgeSize.paddingVertical,
          paddingHorizontal: badgeSize.paddingHorizontal,
        },
        style,
      ]}
    >
      <Text style={{ color: '#FFF', fontSize: badgeSize.fontSize, fontWeight: '600' }}>
        {textMap[statut]}
      </Text>
    </View>
  );
}
