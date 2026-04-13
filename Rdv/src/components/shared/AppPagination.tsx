import React from 'react';
import { Text, View } from 'react-native';
import { AppButton } from '../ui/AppButton';
import { useTheme } from '../../store/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface AppPaginationProps {
  page: number;
  totalPages: number;
  onPrev: () => void;
  onNext: () => void;
}

export function AppPagination({ page, totalPages, onPrev, onNext }: AppPaginationProps) {
  const { colors } = useTheme();

  // Animation pour effet de rebond
  const scalePrev = useSharedValue(1);
  const scaleNext = useSharedValue(1);

  const animStylePrev = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scalePrev.value, { damping: 12, stiffness: 120 }) }],
  }));
 
  const animStyleNext = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scaleNext.value, { damping: 12, stiffness: 120 }) }],
  }));

  const buttonWrapperStyle = {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden' as const,
  };

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
      {/* Bouton Précédent */}
      <Animated.View
        style={[animStylePrev, buttonWrapperStyle]}
      >
        <AppButton
          label="Précédent"
          variant="outline"
          size="sm"
          onPress={onPrev}
          disabled={page <= 1}
        />
      </Animated.View>

      {/* Texte de pagination */}
      <Text style={{
        color: colors.textMuted,
        fontSize: 14,
        fontWeight: '600',
        minWidth: 80,
        textAlign: 'center',
      }}>
        Page {page} / {Math.max(totalPages, 1)}
      </Text>

      {/* Bouton Suivant */}
      <Animated.View
        style={[animStyleNext, buttonWrapperStyle]}
      >
        <AppButton
          label="Suivant"
          variant="outline"
          size="sm"
          onPress={onNext}
          disabled={page >= totalPages}
        />
      </Animated.View>
    </View>
  );
}