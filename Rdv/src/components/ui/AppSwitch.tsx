import React, { useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolateColor } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

interface AppSwitchProps {
  value: boolean;
  onToggle: (v: boolean) => void;
  label?: string;
  disabled?: boolean;
}

function AppSwitchComponent({ value, onToggle, label, disabled }: AppSwitchProps) {
  const { colors } = useTheme();
  const translateX = useSharedValue(value ? 22 : 2);
  const trackAnim = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    translateX.value = withSpring(value ? 22 : 2);
    trackAnim.value = withTiming(value ? 1 : 0, { duration: 220 });
  }, [trackAnim, translateX, value]);

  const toggle = React.useCallback(() => {
    if (disabled) return;
    onToggle(!value);
  }, [disabled, onToggle, value]);

  const knobStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    shadowOpacity: trackAnim.value * 0.3 + 0.2,
    shadowRadius: 3 + trackAnim.value * 2,
  }));

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(trackAnim.value, [0, 1], [colors.border, colors.primary]),
  }));

  return (
    <TouchableWithoutFeedback onPress={toggle} disabled={disabled}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, opacity: disabled ? 0.5 : 1 }}>
        <Animated.View
          style={[
            {
              width: 46,
              height: 28,
              borderRadius: 14,
              justifyContent: 'center',
              padding: 2,
              backgroundColor: colors.border,
            },
            trackStyle,
          ]}
        >
          <Animated.View
            style={[
              {
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#FFF',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                elevation: 4,
              },
              knobStyle,
            ]}
          />
        </Animated.View>

        {label ? <Text style={{ color: colors.text, fontSize: 14, fontWeight: '500' }}>{label}</Text> : null}
      </View>
    </TouchableWithoutFeedback>
  );
}

export const AppSwitch = React.memo(AppSwitchComponent);
