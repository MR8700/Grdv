import React from 'react';
import { ViewStyle } from 'react-native';
import { AppTabs, TabItem } from '../ui/AppTabs';

interface AppBottomTabProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export function AppBottomTab(props: AppBottomTabProps) {
  return <AppTabs {...props} compact />;
}
