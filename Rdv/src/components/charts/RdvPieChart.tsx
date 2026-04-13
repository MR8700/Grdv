import React from 'react';
import { Dimensions, Text, View, StyleSheet } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';
import { AppCard } from '../ui/AppCard';

export interface RdvPieChartItem {
  name: string;
  value: number;
  color: string;
}

interface RdvPieChartProps {
  title?: string;
  data: RdvPieChartItem[];
}
 
export function RdvPieChart({ title = 'Répartition des rendez-vous', data }: RdvPieChartProps) {
  const { colors } = useTheme();
  const width = Dimensions.get('window').width - 64;
  const safeData = data.length > 0 ? data : [{ name: 'Aucun', value: 1, color: colors.border }];

  return (
    <AppCard title={title} style={styles.card}>
      <PieChart
        data={safeData.map((item) => ({
          name: item.name,
          population: item.value,
          color: item.color,
          legendFontColor: colors.textMuted,
          legendFontSize: 12,
        }))}
        width={width}
        height={220}
        chartConfig={{
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          color: () => colors.primary,
          labelColor: () => colors.text,
        }}
        accessor="population"
        backgroundColor="transparent"
        paddingLeft="16"
        absolute
      />

      <View style={styles.legendContainer}>
        {safeData.map((item) => (
          <View key={item.name} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: item.color }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>
              {item.name}: {item.value}
            </Text>
          </View>
        ))}
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  legendContainer: {
    marginTop: 16,
    flexDirection: 'column',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 13,
    fontWeight: '500',
  },
});