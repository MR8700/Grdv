import React from 'react';
import { TouchableOpacity, View, Text, ViewStyle, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
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

function AppCardComponent({ children, onPress, style, title, subtitle, rightAction, noPadding }: AppCardProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const contentStyle = React.useMemo<ViewStyle>(
    () => ({
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
    }),
    [colors.border, colors.shadow, colors.surface, noPadding]
  );

  const overlayStyle = React.useMemo<ViewStyle>(
    () => ({
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.primary,
      opacity: 0.035,
      transform: [{ scale: 1.08 }],
      borderRadius: 22,
    }),
    [colors.primary]
  );

  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={() => {
        scale.value = withSpring(0.985, { stiffness: 220 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { stiffness: 220 });
      }}
      activeOpacity={0.96}
      style={[animStyle, style]}
    >
      <View style={contentStyle}>
        <View style={overlayStyle} />

        {(title || rightAction) && (
          <View style={styles.headerRow}>
            <View style={{ flex: 1, paddingRight: rightAction ? 10 : 0 }}>
              {title ? <Text style={{ fontSize: 17, fontWeight: '800', color: colors.text }}>{title}</Text> : null}
              {subtitle ? (
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4, lineHeight: 18 }}>{subtitle}</Text>
              ) : null}
            </View>
            {rightAction}
          </View>
        )}
        {children}
      </View>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
});

export const AppCard = React.memo(AppCardComponent);
