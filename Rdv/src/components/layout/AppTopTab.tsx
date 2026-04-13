import React from 'react';
import { ViewStyle } from 'react-native';
import { AppTabs, TabItem } from '../ui/AppTabs';

interface AppTopTabProps {
  tabs: TabItem[];
  activeKey: string;
  onChange: (key: string) => void;
  style?: ViewStyle;
}

export function AppTopTab(props: AppTopTabProps) {
  return <AppTabs {...props} />;
}
