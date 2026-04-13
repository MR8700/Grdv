import React from 'react';
import { StatusBar } from 'react-native';
import { useTheme } from '../../store/ThemeContext';

export function AppStatusBar() {
  const { isDark } = useTheme();
  return <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />;
}
