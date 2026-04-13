import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
} from 'react-native';
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

export function AppHeader({
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

  const onPressIn = () => {
    Animated.spring(scale, {
      toValue: 0.94,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const handleLeftAction = () => {
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

    if (navigation.canGoBack?.()) {
      navigation.goBack();
    }
  };

  const titleColor = transparent ? '#FFFFFF' : colors.headerText;
  const subtitleColor = transparent ? 'rgba(255,255,255,0.82)' : colors.headerMuted;

  return (
    <View
      style={[
        styles.outer,
        {
          paddingTop: insets.top + 8,
          backgroundColor: transparent ? 'transparent' : colors.headerBg,
        },
      ]}
    >
      <View
        style={[
          styles.inner,
          {
            backgroundColor: transparent ? 'transparent' : colors.headerCard,
            borderColor: transparent ? 'transparent' : colors.border,
            shadowColor: colors.shadow,
          },
        ]}
      >
        {(onBack || showMenu) && (
          <Animated.View style={{ transform: [{ scale }] }}>
            <TouchableOpacity
              onPress={handleLeftAction}
              onPressIn={onPressIn}
              onPressOut={onPressOut}
              activeOpacity={0.9}
              style={[
                styles.leftBtn,
                {
                  backgroundColor: transparent ? 'rgba(255,255,255,0.18)' : colors.surfaceAlt,
                  borderColor: transparent ? 'rgba(255,255,255,0.22)' : colors.border,
                },
              ]}
            >
              <Ionicons
                name={onBack ? 'arrow-back' : 'menu'}
                size={20}
                color={titleColor}
              />
            </TouchableOpacity>
          </Animated.View>
        )}

        <View style={{ flex: 1, marginLeft: onBack || showMenu ? 10 : 0 }}>
          <Text numberOfLines={1} style={[styles.title, { color: titleColor }]}>
            {title}
          </Text>

          {subtitle && (
            <Text numberOfLines={2} style={[styles.subtitle, { color: subtitleColor }]}>
              {subtitle}
            </Text>
          )}
        </View>

        {rightActions && <View style={styles.actions}>{rightActions}</View>}
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
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
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
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 3,
    lineHeight: 18,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 10,
  },
});
