import React from 'react';
import { TouchableOpacity, Text, ViewStyle, ActivityIndicator } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type Size = 'sm' | 'md' | 'lg';

interface AppButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AppButton({
  label,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  style,
  icon,
  fullWidth = false,
}: AppButtonProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const handlePress = () => {
    try {
      const result = (onPress as (() => unknown))();
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        (result as Promise<unknown>).catch((error) => {
          console.warn('Unhandled button action error', error);
        });
      }
    } catch (error) {
      console.warn('Unhandled button action error', error);
    }
  };

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const onPressIn = () => { scale.value = withSpring(0.97); };
  const onPressOut = () => { scale.value = withSpring(1); };

  const bg: Record<Variant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    outline: colors.surface,
    ghost: colors.surfaceAlt,
    danger: colors.danger,
    success: colors.success,
  };

  const textColor: Record<Variant, string> = {
    primary: '#FFFFFF',
    secondary: '#FFFFFF',
    outline: colors.primary,
    ghost: colors.text,
    danger: '#FFFFFF',
    success: '#FFFFFF',
  };

  const borderColor: Record<Variant, string> = {
    primary: 'transparent',
    secondary: 'transparent',
    outline: `${colors.primary}4A`,
    ghost: colors.border,
    danger: 'transparent',
    success: 'transparent',
  };

  const paddings: Record<Size, { h: number; v: number; font: number; radius: number; minHeight: number }> = {
    sm: { h: 14, v: 9, font: 13, radius: 12, minHeight: 40 },
    md: { h: 18, v: 13, font: 15, radius: 15, minHeight: 48 },
    lg: { h: 22, v: 16, font: 17, radius: 18, minHeight: 56 },
  };
  const p = paddings[size];
  const flat = variant === 'outline' || variant === 'ghost';

  return (
    <AnimatedTouchable
      onPress={handlePress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={disabled || loading}
      activeOpacity={0.92}
      style={[
        animStyle,
        {
          backgroundColor: bg[variant],
          paddingHorizontal: p.h,
          paddingVertical: p.v,
          borderRadius: p.radius,
          borderWidth: 1,
          borderColor: borderColor[variant],
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          opacity: disabled ? 0.55 : 1,
          alignSelf: fullWidth ? 'stretch' : 'auto',
          minHeight: p.minHeight,
          shadowColor: colors.shadow,
          shadowOpacity: flat ? 0 : 0.18,
          shadowRadius: flat ? 0 : 14,
          shadowOffset: { width: 0, height: 8 },
          elevation: flat ? 0 : 3,
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={textColor[variant]} />
      ) : (
        <>
          {icon}
          <Text style={{ color: textColor[variant], fontSize: p.font, fontWeight: '800', letterSpacing: 0.2 }}>
            {label}
          </Text>
        </>
      )}
    </AnimatedTouchable>
  );
}
