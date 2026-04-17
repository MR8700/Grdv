import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { AppCard } from '../ui/AppCard';

export interface AgendaWeekItem {
  key: string;
  dayLabel: string;
  dateLabel: string;
  totalRdv: number;
  totalLibre: number;
}

interface AgendaWeekProps {
  title?: string;
  days: AgendaWeekItem[];
  activeKey: string;
  onSelectDay: (key: string) => void;
}
 
export function AgendaWeek({ title = 'Semaine', days, activeKey, onSelectDay }: AgendaWeekProps) {
  const { colors } = useTheme();

  return (
    <AppCard title={title} style={{ marginBottom: 16 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {days.map((day) => {
          const active = day.key === activeKey;

          return (
            <View key={day.key} style={{ width: '31%' }}>
              <TouchableOpacity
                onPress={() => onSelectDay(day.key)}
                style={{
                  backgroundColor: active ? colors.primary : colors.surface,
                  borderColor: active ? colors.primary : colors.border,
                  borderWidth: 1,
                  borderRadius: 18,
                  paddingVertical: 14,
                  paddingHorizontal: 8,
                  shadowOpacity: 0,
                  elevation: 0,
                }}
                activeOpacity={0.92}
              >
                <Text style={{ color: active ? '#FFFFFF' : colors.text, fontWeight: '700', textAlign: 'center' }}>
                  {day.dayLabel}
                </Text>
                <Text
                  style={{
                    color: active ? '#FFFFFFCC' : colors.textMuted,
                    fontSize: 12,
                    textAlign: 'center',
                    marginTop: 4,
                  }}
                >
                  {day.dateLabel}
                </Text>
                <Text
                  style={{
                    color: active ? '#FFFFFF' : colors.text,
                    textAlign: 'center',
                    marginTop: 8,
                    fontWeight: '600',
                  }}
                >
                  {day.totalRdv} RDV
                </Text>
                <Text
                  style={{
                    color: active ? '#FFFFFFCC' : colors.textMuted,
                    textAlign: 'center',
                    marginTop: 2,
                    fontSize: 12,
                  }}
                >
                  {day.totalLibre} libres
                </Text>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}
