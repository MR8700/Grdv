// components/charts/RdvBarChart.tsx
import React from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';

interface RdvBarChartProps {
  data: { label: string; value: number }[];
  title?: string;
}

export function RdvBarChart({ data, title }: RdvBarChartProps) {
  const { colors } = useTheme();
  const { width: windowWidth } = useWindowDimensions();
  const width = Math.min(Math.max(windowWidth - 48, 240), 600); // responsive + max width

  const chartData = {
    labels: data.map((d) => d.label),
    datasets: [
      {
        data: data.map((d) => d.value),
        colors: data.map(() => () => `rgba(${hexToRgb(colors.primary)}, 0.85)`), // gradient dynamique
      },
    ],
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}

      <BarChart
        data={chartData}
        width={width}
        height={250}
        fromZero
        showBarTops
        withInnerLines={true}
        withHorizontalLabels={true}
        yAxisLabel=""
        yAxisSuffix=""
        flatColor={true} // empêche les gradients par défaut
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => `rgba(${hexToRgb(colors.primary)}, ${opacity})`,
          labelColor: (opacity = 1) => `rgba(${hexToRgb(colors.textMuted)}, ${opacity})`,
          style: { borderRadius: 16 },
          propsForBackgroundLines: { stroke: colors.border, strokeDasharray: '0' },
        }}
        style={{
          borderRadius: 16,
          backgroundColor: colors.surface,
          paddingVertical: 8,
          elevation: 3,
        }}
        withCustomBarColorFromData={true}
      />
    </View>
  );
}

// Converti hex en rgb pour rgba dynamique
function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 16,
    padding: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
});
