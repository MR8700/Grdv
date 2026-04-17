import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, StyleSheet } from 'react-native';
import { DrawerActions, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightActions?: React.ReactNode;
  transparent?: boolean;
}

function AppHeaderComponent({
  title,
  subtitle,
  onBack,
  onMenu,
  rightActions,
  transparent = false,
}: AppHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const scale = useRef(new Animated.Value(1)).current;

  const drawerNavigation = React.useMemo(() => {
    let current = navigation;
    while (current) {
      const state = current.getState?.();
      if (state?.type === 'drawer') return current;
      current = current.getParent?.();
    }
    return null;
  }, [navigation]);

  const showMenu = !onBack && (Boolean(onMenu) || Boolean(drawerNavigation));

  const onPressIn = React.useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const onPressOut = React.useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  }, [scale]);

  const handleLeftAction = React.useCallback(() => {
    if (onBack) {
      try {
        onBack();
      } catch (error) {
        if (navigation.canGoBack?.()) navigation.goBack();
        else if (drawerNavigation) drawerNavigation.dispatch(DrawerActions.toggleDrawer());
        else console.warn('goBack fallback failed', error);
      }
      return;
    }

    if (onMenu) {
      onMenu();
      return;
    }

    if (drawerNavigation) {
      drawerNavigation.dispatch(DrawerActions.toggleDrawer());
      return;
    }

    if (navigation.canGoBack?.()) navigation.goBack();
  }, [drawerNavigation, navigation, onBack, onMenu]);

  const titleColor = transparent ? '#FFFFFF' : colors.headerText;
  const subtitleColor = transparent ? 'rgba(255,255,255,0.82)' : colors.headerMuted;

  const outerStyle = React.useMemo(
    () => [
      styles.outer,
      {
        paddingTop: insets.top + 8,
        paddingHorizontal: 0,
        backgroundColor: transparent ? 'transparent' : colors.headerBg,
      },
    ],
    [colors.headerBg, insets.top, transparent]
  );

  const innerStyle = React.useMemo(
    () => [
      styles.inner,
      {
        backgroundColor: transparent ? 'transparent' : colors.headerCard,
        borderColor: transparent ? 'transparent' : colors.border,
        shadowColor: colors.shadow,
      },
    ],
    [colors.border, colors.headerCard, colors.shadow, transparent]
  );

  const leftButtonStyle = React.useMemo(
    () => [
      styles.leftBtn,
      {
        backgroundColor: transparent ? 'rgba(255,255,255,0.18)' : colors.surfaceAlt,
        borderColor: transparent ? 'rgba(255,255,255,0.22)' : colors.border,
      },
    ],
    [colors.border, colors.surfaceAlt, transparent]
  );

  return (
    <View style={outerStyle}>
      <View style={innerStyle}>
        {(onBack || showMenu) && (
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              onPress={handleLeftAction}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              activeOpacity={0.9}
              style={leftButtonStyle}
            >
              <Ionicons name={onBack ? 'arrow-back' : 'menu'} size={20} color={titleColor} />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ flex: 1, marginLeft: onBack || showMenu ? 10 : 0 }}>
          <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
            {title}
          </Text>

          {subtitle ? (
            <Text numberOfLines={2} style={[styles.subtitle, { color: subtitleColor }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightActions ? <View style={styles.actions}>{rightActions}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  inner: {
    minHeight: 72,
    borderRadius: 0,
    borderWidth: 0,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowOpacity: 0.12,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  leftBtn: {
    width: 40,
    height: 40,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
});

export const AppHeader = React.memo(AppHeaderComponent);
