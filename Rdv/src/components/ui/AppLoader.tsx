// src/components/ui/AppLoader.tsx
import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';

interface AppLoaderProps {
  message?: string;
  fullscreen?: boolean;
}
 
export function AppLoader({ message, fullscreen = false }: AppLoaderProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        fullscreen && { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.overlay, zIndex: 9999 },
      ]}
    >
      <ActivityIndicator size="large" color={colors.primary} />
      {message && (
        <Text style={[styles.message, { color: colors.textMuted }]}>
          {message}
        </Text>
      )}
    </View>
  );
}

const { width: SCREEN_W } = Dimensions.get('window');

interface SkeletonLineProps {
  width?: number | string;
  height?: number;
  style?: any;
}

export function SkeletonLine({ width = '100%', height = 16, style }: SkeletonLineProps) {
  const { colors } = useTheme();
  const anim = useSharedValue(0);

  useEffect(() => {
    anim.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, [anim]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(anim.value, [0, 1], [0.4, 1]),
    transform: [
      {
        translateX: interpolate(anim.value, [0, 1], [-SCREEN_W * 0.3, SCREEN_W * 0.3]),
      },
    ],
  }));

  return (
    <View
      style={[
        {
          backgroundColor: colors.border,
          borderRadius: height! / 2,
          overflow: 'hidden',
          height,
          width,
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          {
            width: '30%',
            height: '100%',
            backgroundColor: colors.primary + '33', // léger dégradé
            borderRadius: height! / 2,
          },
          animatedStyle,
        ]}
      />
    </View>
  );
}

export function CardSkeleton() {
  const { colors } = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 16,
        marginBottom: 12,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
        <View
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: colors.border,
            marginRight: 12,
          }}
        />
        <View style={{ flex: 1 }}>
          <SkeletonLine width="60%" height={14} style={{ marginBottom: 6 }} />
          <SkeletonLine width="40%" height={12} />
        </View>
      </View>
      <SkeletonLine height={14} style={{ marginBottom: 8 }} />
      <SkeletonLine width="80%" height={14} />
    </View>
  );
}

export function PageLoader({ message = 'Chargement en cours…' }: { message?: string }) {
  return (
    <AppLoader fullscreen message={message} />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  message: {
    fontSize: 15,
    marginTop: 12,
    fontWeight: '500',
  },
});
