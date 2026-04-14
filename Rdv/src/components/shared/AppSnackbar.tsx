import React, { useEffect, useMemo } from 'react';
import { Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

interface AppSnackbarProps {
  visible: boolean;
  message: string;
  variant?: 'info' | 'success' | 'warning' | 'danger';
}

function AppSnackbarComponent({ visible, message, variant = 'info' }: AppSnackbarProps) {
  const { colors } = useTheme();
  const translateY = useSharedValue(visible ? 0 : 60);
  const opacity = useSharedValue(visible ? 1 : 0);

  useEffect(() => {
    translateY.value = withTiming(visible ? 0 : 60, { duration: 220, easing: Easing.out(Easing.cubic) });
    opacity.value = withTiming(visible ? 1 : 0, { duration: 220, easing: Easing.out(Easing.cubic) });
  }, [opacity, translateY, visible]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const backgroundMap = useMemo(
    () => ({
      info: colors.info,
      success: colors.success,
      warning: colors.warning,
      danger: colors.danger,
    }),
    [colors.danger, colors.info, colors.success, colors.warning]
  );

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.snackbar,
        animStyle,
        {
          backgroundColor: backgroundMap[variant],
          shadowColor: '#000',
          shadowOpacity: 0.12,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 2 },
          elevation: 5,
        },
      ]}
    >
      <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 14 }}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  snackbar: {
    marginHorizontal: 16,
    marginTop: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export const AppSnackbar = React.memo(AppSnackbarComponent);
