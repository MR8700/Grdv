import React from 'react';
import { RefreshControl, ScrollView, View, ViewStyle } from 'react-native';
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

function ScreenWrapperComponent({
  children,
  scroll = true,
  refreshing = false,
  onRefresh,
  style,
  contentStyle,
  safeEdges = ['top', 'bottom'],
}: ScreenWrapperProps) {
  const { colors } = useTheme();

  const baseBackground = React.useMemo<ViewStyle>(
    () => ({ flex: 1, backgroundColor: colors.background }),
    [colors.background]
  );

  const backgroundDecor = React.useMemo<ViewStyle>(
    () => ({
      ...StyleSheet.absoluteFillObject,
      backgroundColor: colors.primary,
      opacity: 0.025,
      top: -160,
      height: 320,
      borderBottomLeftRadius: 160,
      borderBottomRightRadius: 160,
    }),
    [colors.primary]
  );

  const scrollContentStyle = React.useMemo(
    () => [{ flexGrow: 1, gap: 14, paddingHorizontal: 16, paddingTop: 18, paddingBottom: 126 }, contentStyle],
    [contentStyle]
  );

  const staticContentStyle = React.useMemo(
    () => [{ flex: 1, paddingHorizontal: 16, paddingTop: 16, paddingBottom: 126, gap: 14 }, contentStyle],
    [contentStyle]
  );

  const refreshControl = React.useMemo(
    () =>
      onRefresh ? (
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
          colors={[colors.primary]}
          progressBackgroundColor={colors.surface}
        />
      ) : undefined,
    [colors.primary, colors.surface, onRefresh, refreshing]
  );

  return (
    <SafeAreaView style={[baseBackground, style]} edges={safeEdges}>
      <AppStatusBar />

      {scroll ? (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={scrollContentStyle}
          refreshControl={refreshControl}
        >
          <View style={backgroundDecor} />
          {children}
        </ScrollView>
      ) : (
        <View style={staticContentStyle}>{children}</View>
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

export const ScreenWrapper = React.memo(ScreenWrapperComponent);
