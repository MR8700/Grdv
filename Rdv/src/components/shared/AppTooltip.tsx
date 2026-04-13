import React, { useState, useEffect } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

interface AppTooltipProps {
  label: string;
  content: string;
}

export function AppTooltip({ label, content }: AppTooltipProps) {
  const { colors } = useTheme();
  const [visible, setVisible] = useState(false);

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(-4);

  useEffect(() => {
    opacity.value = withTiming(visible ? 1 : 0, { duration: 250, easing: Easing.out(Easing.cubic) });
    translateY.value = withTiming(visible ? 0 : -4, { duration: 250, easing: Easing.out(Easing.cubic) });
  }, [opacity, translateY, visible]);
 
  const animStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ alignItems: 'center' }}>
      <TouchableOpacity
        onPress={() => setVisible((prev) => !prev)}
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.surface,
        }}
      >
        <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{label}</Text>
      </TouchableOpacity>

      {visible && (
        <Animated.View
          style={[
            {
              marginTop: 8,
              maxWidth: 220,
              backgroundColor: colors.surface,
              borderRadius: 12,
              padding: 10,
              borderWidth: 1,
              borderColor: colors.border,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            },
            animStyle,
          ]}
        >
          <Text style={{ color: colors.textMuted, fontSize: 12, lineHeight: 18 }}>{content}</Text>
        </Animated.View>
      )}
    </View>
  );
}
