import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';
import { AppIcon } from '../ui/AppIcon';

interface TabBarIconProps {
  icon: string;
  focused: boolean;
  badge?: number;
}

const ICON_VARIANTS: Record<string, { active: string; inactive: string }> = {
  home: { active: 'home', inactive: 'home-outline' },
  calendar: { active: 'calendar', inactive: 'calendar-outline' },
  clipboard: { active: 'clipboard', inactive: 'clipboard-outline' },
  notifications: { active: 'notifications', inactive: 'notifications-outline' },
  folder: { active: 'folder', inactive: 'folder-outline' },
  person: { active: 'person', inactive: 'person-outline' },
  time: { active: 'time', inactive: 'time-outline' },
  people: { active: 'people', inactive: 'people-outline' },
  'bar-chart': { active: 'bar-chart', inactive: 'bar-chart-outline' },
  grid: { active: 'grid', inactive: 'grid-outline' },
  medkit: { active: 'medkit', inactive: 'medkit-outline' },
  construct: { active: 'construct', inactive: 'construct-outline' },
  shield: { active: 'shield', inactive: 'shield-outline' },
  business: { active: 'business', inactive: 'business-outline' },
};

export function TabBarIcon({ icon, focused, badge }: TabBarIconProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.08 : 1, { damping: 12, stiffness: 180 });
    translateY.value = withTiming(focused ? -3 : 0, { duration: 220, easing: Easing.out(Easing.exp) });
  }, [focused, scale, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const iconNames = ICON_VARIANTS[icon] || { active: icon, inactive: `${icon}-outline` };
  const iconName = focused ? iconNames.active : iconNames.inactive;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animStyle}>
        <AppIcon name={iconName} size={22} color={focused ? colors.tabActive : colors.tabInactive} />
      </Animated.View>

      {badge != null && badge > 0 && (
        <View
          style={{
            position: 'absolute',
            top: -5,
            right: -10,
            borderRadius: 11,
            minWidth: 22,
            height: 22,
            backgroundColor: colors.danger,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 5,
            borderWidth: 2,
            borderColor: colors.tabBg,
          }}
        >
          <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '700' }}>
            {badge > 99 ? '99+' : badge}
          </Text>
        </View>
      )}
    </View>
  );
}
