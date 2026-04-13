import React from 'react';
import { View, RefreshControl, ViewStyle, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../store/ThemeContext';
import { AppStatusBar } from '../ui/AppStatusBar';

interface ScreenWrapperProps {
  children: React.ReactNode;
  scroll?: boolean;
  refreshing?: boolean;
  onRefresh?: () => void;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  safeEdges?: Array<'top' | 'bottom' | 'left' | 'right'>;
}

export function ScreenWrapper({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  safeEdges = ['top', 'bottom'],
}: ScreenWrapperProps) {
  const { colors } = useTheme();
  const scrollY = React.useRef(new Animated.Value(0)).current;

  const animatedContentStyle = {
    paddingTop: scrollY.interpolate({
      inputRange: [0, 60],
      outputRange: [18, 24],
      extrapolate: 'clamp',
    }),
    paddingBottom: 126,
  };

  return (
    <SafeAreaView
      style={[
        { flex: 1, backgroundColor: colors.background },
        style,
      ]}
      edges={safeEdges}
    >
      <AppStatusBar />

      {scroll ? (
        <Animated.ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            { flexGrow: 1, gap: 14, paddingHorizontal: 16 },
            animatedContentStyle,
            contentStyle,
          ]}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
          scrollEventThrottle={16}
          refreshControl={
            onRefresh ? (
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={colors.primary}
                colors={[colors.primary]}
                progressBackgroundColor={colors.surface}
              />
            ) : undefined
          }
        >
          <View
            style={{
              ...StyleSheet.absoluteFillObject,
              backgroundColor: colors.primary,
              opacity: 0.025,
              top: -160,
              height: 320,
              borderBottomLeftRadius: 160,
              borderBottomRightRadius: 160,
            }}
          />
          {children}
        </Animated.ScrollView>
      ) : (
        <View style={[{ flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 126, gap: 14 }, contentStyle]}>
          {children}
        </View>
      )}
    </SafeAreaView>
  );
}

const StyleSheet = {
  absoluteFillObject: {
    position: 'absolute' as const,
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
};
