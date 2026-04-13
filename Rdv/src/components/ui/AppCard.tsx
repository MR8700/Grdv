import React, { useEffect } from 'react';
import { TouchableOpacity, View, Text, ViewStyle, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

interface AppCardProps {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  title?: string;
  subtitle?: string;
  rightAction?: React.ReactNode;
  noPadding?: boolean;
}

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export function AppCard({ children, onPress, style, title, subtitle, rightAction, noPadding }: AppCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(60, withTiming(1, { duration: 280 }));
  }, [opacity]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const contentStyle: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 22,
    padding: noPadding ? 0 : 18,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.shadow,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 4,
    overflow: 'hidden',
  };

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => { scale.value = withSpring(0.985, { stiffness: 220 }); }}
      onPressOut={() => { scale.value = withSpring(1, { stiffness: 220 }); }}
      activeOpacity={0.96}
      style={[animStyle, style]}
    >
      <View style={contentStyle}>
        <View
          style={{
            ...StyleSheet.absoluteFillObject,
            backgroundColor: colors.primary,
            opacity: 0.035,
            transform: [{ scale: 1.08 }],
            borderRadius: 22,
          }}
        />

        {(title || rightAction) && (
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: children ? 14 : 0 }}>
            <View style={{ flex: 1, paddingRight: rightAction ? 10 : 0 }}>
              {title && <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>{title}</Text>}
              {subtitle && <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 }}>{subtitle}</Text>}
            </View>
            {rightAction}
          </View>
        )}
        {children}
      </View>
    </AnimatedTouchable>
  );
}
