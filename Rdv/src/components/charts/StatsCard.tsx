import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, Easing } from 'react-native-reanimated';
import { AppCard } from '../ui/AppCard';
import { useTheme } from '../../store/ThemeContext';

interface StatsCardProps {
  label    : string;
  value    : number | string;
  icon     : string;
  color   ?: string;
  subtitle?: string;
  trend   ?: { value: number; label: string };
  onPress ?: () => void;
}

export function StatsCard({ label, value, icon, color, subtitle, trend, onPress }: StatsCardProps) {
  const { colors } = useTheme();
  const c = color ?? colors.primary;
 
  // Animations
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(0);
  const progress = useSharedValue(0); // pour la barre animée

  useEffect(() => {
    scale.value = withSpring(1, { damping: 14, stiffness: 120 });
    opacity.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.ease) });
    progress.value = withTiming(60, { duration: 800, easing: Easing.out(Easing.cubic) }); // 60% par défaut
  }, [opacity, progress, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const trendColor = !trend ? colors.textMuted : trend.value > 0 ? colors.success : colors.danger;
  const trendIcon = !trend ? '' : trend.value > 0 ? '↑' : '↓';

  return (
    <Animated.View style={animStyle}>
      <AppCard onPress={onPress} style={styles.card}>
        <View style={styles.topRow}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
            <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8} style={[styles.value, { color: colors.text }]}>{value}</Text>
            {subtitle && <Text numberOfLines={2} style={[styles.subtitle, { color: colors.textMuted }]}>{subtitle}</Text>}
            {trend && (
              <Text numberOfLines={2} style={[styles.trend, { color: trendColor }]}>
                {trendIcon} {Math.abs(trend.value)}% {trend.label}
              </Text>
            )}
          </View>
          <View style={[styles.iconContainer, { backgroundColor: `${c}20` }]}>
            <Text style={[styles.icon, { color: c }]}>{icon}</Text>
          </View>
        </View>

        <View style={[styles.progressBg, { backgroundColor: `${colors.border}40` }]}>
          <Animated.View style={[styles.progressBar, { backgroundColor: c }, progressStyle]} />
        </View>
      </AppCard>
    </Animated.View>
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
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 10,
  },
  label: { fontSize: 12, fontWeight: '500', marginBottom: 4 },
  value: { fontSize: 24, fontWeight: '800', lineHeight: 28 },
  subtitle: { fontSize: 12, marginTop: 4 },
  trend: { fontSize: 12, marginTop: 4, fontWeight: '600', flexShrink: 1 },
  iconContainer: {
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  icon: { fontSize: 28 },
  progressBg: {
    height: 4,
    borderRadius: 2,
    marginTop: 16,
    overflow: 'hidden',
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
});
