import React from 'react';
import { ScrollView, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

export interface TabItem {
  key: string;
  label: string;
  badge?: number;
}

interface AppTabsProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
  compact?: boolean;
}
 
export function AppTabs({ tabs, activeKey, onChange, style, compact = false }: AppTabsProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          backgroundColor: colors.surfaceAlt,
          borderRadius: 16,
          padding: 4,
          shadowColor: '#000',
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 4,
        },
        style,
      ]}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 4 }}>
        {tabs.map((tab) => {
          const active = tab.key === activeKey;

          return (
            <View key={tab.key} style={{ marginRight: 6 }}>
              <TouchableOpacity
                onPress={() => onChange(tab.key)}
                activeOpacity={0.82}
                style={{
                  paddingVertical: compact ? 8 : 10,
                  paddingHorizontal: compact ? 14 : 18,
                  borderRadius: 12,
                  backgroundColor: active ? colors.surface : 'transparent',
                  borderWidth: active ? 1 : 0,
                  borderColor: active ? colors.primary : 'transparent',
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  shadowColor: active ? colors.primary : 'transparent',
                  shadowOffset: { width: 0, height: 2 },
                  shadowRadius: 6,
                  elevation: active ? 3 : 0,
                }}
              >
                <Text
                  style={{
                    color: active ? colors.primary : colors.textMuted,
                    fontWeight: active ? '700' : '600',
                    fontSize: compact ? 13 : 14,
                  }}
                >
                  {tab.label}
                </Text>
                {typeof tab.badge === 'number' && tab.badge > 0 && (
                  <View
                    style={{
                      minWidth: 20,
                      height: 20,
                      borderRadius: 10,
                      backgroundColor: colors.primary,
                      alignItems: 'center',
                      justifyContent: 'center',
                      paddingHorizontal: 6,
                      shadowColor: '#000',
                      shadowOpacity: 0.15,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <Text style={{ color: '#FFF', fontSize: 11, fontWeight: '700' }}>{tab.badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

