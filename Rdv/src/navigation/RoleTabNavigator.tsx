import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View } from 'react-native';
import { useTheme } from '../store/ThemeContext';
import { TabBarIcon } from '../components/layout/TabBarIcon';

export interface RoleTabItem {
  key: string;
  title: string;
  icon: string;
  component: React.ComponentType<any>;
  badge?: number;
  visible?: boolean;
  hidden?: boolean;
}

const Tab = createBottomTabNavigator();

export function RoleTabNavigator({ items }: { items: RoleTabItem[] }) {
  const { colors } = useTheme();
  const visiblePrimaryItems = items.filter((item) => item.visible !== false && !item.hidden).slice(0, 4);
  const hiddenItems = items.filter((item) => item.hidden);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.background },
        tabBarStyle: {
          position: 'absolute',
          left: 14,
          right: 14,
          bottom: 12,
          height: 78,
          borderTopWidth: 0,
          borderRadius: 26,
          backgroundColor: colors.tabBg,
          paddingBottom: 10,
          paddingTop: 9,
          paddingHorizontal: 8,
          elevation: 0,
          shadowColor: colors.shadow,
          shadowOpacity: 0.18,
          shadowRadius: 20,
          shadowOffset: { width: 0, height: 10 },
        },
        tabBarActiveTintColor: colors.tabActive,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginTop: 2 },
        tabBarItemStyle: { flex: 1, minWidth: 0, borderRadius: 18, paddingHorizontal: 2 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarBackground: () => (
          <View
            style={{
              flex: 1,
              borderRadius: 26,
              backgroundColor: colors.tabBg,
              borderWidth: 1,
              borderColor: `${colors.border}CC`,
            }}
          />
        ),
      }}
    >
      {visiblePrimaryItems.map((item) => (
        <Tab.Screen
          key={item.key}
          name={item.key}
          component={item.component}
          options={{
            title: item.title,
            tabBarIcon: ({ focused }) => <TabBarIcon focused={focused} icon={item.icon} badge={item.badge} />,
            tabBarLabel: ({ focused, color }) => (
              <Text numberOfLines={1} style={{ color, fontSize: 11, fontWeight: focused ? '800' : '700', textAlign: 'center', letterSpacing: 0.1 }}>
                {item.title}
              </Text>
            ),
          }}
        />
      ))}

      {hiddenItems.map((item) => (
        <Tab.Screen
          key={item.key}
          name={item.key}
          component={item.component}
          options={{ tabBarButton: () => null }}
        />
      ))}
    </Tab.Navigator>
  );
}
