import React from 'react';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { useTheme } from '../store/ThemeContext';
import { DrawerContent, DrawerMenuItem } from '../components/layout/DrawerContent';

const Drawer = createDrawerNavigator();

interface ActorDrawerNavigatorProps {
  items: DrawerMenuItem[];
  screens?: Record<string, React.ComponentType<any>>;
  rootRouteName?: string;
  rootComponent?: React.ComponentType<any>;
}

export function ActorDrawerNavigator({
  items,
  screens,
  rootRouteName,
  rootComponent,
}: ActorDrawerNavigatorProps) {
  const { colors } = useTheme();
  const initialRoute = rootRouteName || items.find((item) => item.visible !== false)?.key;

  return (
    <Drawer.Navigator
      initialRouteName={initialRoute}
      screenOptions={{
        headerShown: false,
        drawerStyle: { backgroundColor: colors.surface, width: 300 },
        overlayColor: 'rgba(0,0,0,0.35)',
      }}
      drawerContent={(props) => (
        <DrawerContent {...props} items={items} rootRouteName={rootRouteName} />
      )}
    >
      {rootRouteName && rootComponent ? (
        <Drawer.Screen name={rootRouteName} component={rootComponent} />
      ) : (
        items
          .filter((item) => screens?.[item.key])
          .map((item) => (
            <Drawer.Screen key={item.key} name={item.key} component={screens?.[item.key] as React.ComponentType<any>} />
          ))
      )}
    </Drawer.Navigator>
  );
}
