// components/stats/StatsLineChart.tsx
import React from 'react';
import { Dimensions, StyleSheet, Text } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../store/ThemeContext';
import { AppCard } from '../ui/AppCard';

export interface StatsLinePoint {
  label: string;
  value: number;
}

interface StatsLineChartProps {
  title?: string;
  data: StatsLinePoint[];
}

export function StatsLineChart({ title = 'Évolution', data }: StatsLineChartProps) {
  const { colors } = useTheme();
  const screenWidth = Dimensions.get('window').width;
  const chartWidth = Math.min(screenWidth - 32, 480); // padding et max width

  const chartData = {
    labels: data.map((item) => item.label),
    datasets: [
      {
        data: data.map((item) => item.value),
        color: (opacity = 1) => `rgba(${hexToRgb(colors.primary)}, ${opacity})`, // ligne dynamique
        strokeWidth: 3,
      },
    ],
  };

  const chartConfig = {
    backgroundGradientFrom: colors.surface,
    backgroundGradientTo: colors.surface,
    backgroundColor: colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(${hexToRgb(colors.primary)}, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(${hexToRgb(colors.textMuted)}, ${opacity})`,
    propsForDots: {
      r: '5',
      strokeWidth: '2',
      stroke: colors.primary,
      fill: colors.surface,
    },
    propsForBackgroundLines: {
      strokeDasharray: '', // lignes pleines
      stroke: `${colors.border}40`,
    },
    style: {
      borderRadius: 12,
    },
  };

  return (
    <AppCard style={styles.card}>
      {title && <Text style={[styles.title, { color: colors.text }]}>{title}</Text>}

      <LineChart
        data={chartData}
        width={chartWidth}
        height={220}
        bezier
        withShadow={true}
        withInnerLines={true}
        withVerticalLines={true}
        fromZero
        style={styles.chart}
        chartConfig={chartConfig}
      />
    </AppCard>
  );
}

// Convertir un hex en rgb
function hexToRgb(hex: string) {
  const sanitized = hex.replace('#', '');
  const bigint = parseInt(sanitized, 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return `${r}, ${g}, ${b}`;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
    marginVertical: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 12,
  },
});
