import React, { useEffect } from 'react';
import { View, Text, ViewStyle, StyleProp, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay } from 'react-native-reanimated';
import { StatutRdv, TypeNotification } from '../../types/models.types';
import { RDV_STATUT_COLORS, STATUT_RDV_LABELS, NOTIF_COLORS } from '../../utils/constants';

interface AppBadgeProps {
  label    : string;
  color    : string;
  textColor: string;
  style?   : StyleProp<ViewStyle>;
  size?    : 'sm' | 'md';
}

export function AppBadge({ label, color, textColor, style, size = 'md' }: AppBadgeProps) {
  const scale = useSharedValue(0);
 
  useEffect(() => {
    scale.value = withDelay(50, withTiming(1, { duration: 400 }));
  }, [scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: scale.value,
  }));

  return (
    <Animated.View
      style={[
        {
          paddingHorizontal: size === 'sm' ? 8 : 12,
          paddingVertical: size === 'sm' ? 3 : 5,
          borderRadius: 20,
          alignSelf: 'flex-start',
          overflow: 'hidden',
          backgroundColor: color,
          justifyContent: 'center',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.15,
          shadowRadius: 6,
          elevation: 4,
        },
        animStyle,
        style,
      ]}
    >
      {/* Double background / glow */}
      <View style={{
        ...StyleSheet.absoluteFill, // <- correction ici
        borderRadius: 20,
        backgroundColor: color,
        opacity: 0.2,
        transform: [{ scale: 1.2 }],
      }} />
      <Text style={{ color: textColor, fontSize: size === 'sm' ? 12 : 14, fontWeight: '700' }}>
        {label}
      </Text>
    </Animated.View>
  );
}

// Badges spécifiques
export function RdvStatutBadge({ statut, size }: { statut: StatutRdv; size?: 'sm' | 'md' }) {
  const c = RDV_STATUT_COLORS[statut];
  return <AppBadge label={STATUT_RDV_LABELS[statut]} color={c.bg} textColor={c.text} size={size} />;
}

export function NotifTypeBadge({ type, size }: { type: TypeNotification; size?: 'sm' | 'md' }) {
  const c = NOTIF_COLORS[type];
  const labels = { rappel: 'Rappel', urgence: 'Urgence', information: 'Info' };
  return <AppBadge label={labels[type]} color={c.bg} textColor={c.text} size={size} />;
}
