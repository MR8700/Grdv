import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { DrawerContentComponentProps } from '@react-navigation/drawer';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { AppAvatar } from '../ui/AppAvatar';
import { AppIcon } from '../ui/AppIcon';
import { AppSwitch } from '../ui/AppSwitch';
import { TYPE_USER_LABELS } from '../../utils/constants';

export interface DrawerMenuItem {
  key: string;
  label: string;
  icon?: string;
  badge?: number;
  visible?: boolean;
}

interface Props extends DrawerContentComponentProps {
  items?: DrawerMenuItem[];
  rootRouteName?: string;
}

function resolveActiveRouteName(state: any): string | undefined {
  if (!state?.routes?.length) return undefined;
  const route = state.routes[state.index ?? 0];
  if (route?.state) return resolveActiveRouteName(route.state);
  return route?.name;
}

export function DrawerContent({ state, navigation, items = [], rootRouteName }: Props) {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const activeRoute = resolveActiveRouteName(state);

  const visibleItems = items.filter((item) => item.visible !== false);

  return (
    <View style={{ flex: 1, backgroundColor: colors.surface }}>
      <View
        style={{
          paddingHorizontal: 18,
          paddingTop: insets.top + 16,
          paddingBottom: 18,
          backgroundColor: colors.surface,
        }}
      >
        <View
          style={{
            borderRadius: 28,
            paddingHorizontal: 20,
            paddingVertical: 18,
            backgroundColor: colors.primary,
            shadowColor: colors.primary,
            shadowOpacity: 0.22,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 12 },
            elevation: 8,
          }}
        >
        {user && (
          <>
            <AppAvatar
              nom={user.nom}
              prenom={user.prenom}
              photoPath={user.photo_path}
              size={62}
              style={{ marginBottom: 10 }}
            />
            <Text style={{ color: '#FFFFFF', fontSize: 18, fontWeight: '800' }}>
              {user.prenom} {user.nom}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: 2 }}>
              {TYPE_USER_LABELS[user.type_user as keyof typeof TYPE_USER_LABELS] ?? user.type_user}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.72)', fontSize: 12, marginTop: 8 }}>
              Navigation recentrée autour des actions métier principales.
            </Text>
          </>
        )}
        </View>
      </View>

      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingVertical: 14 }}>
        {visibleItems.map((item) => {
          const active = activeRoute === item.key;

          return (
            <TouchableOpacity
              key={item.key}
              onPress={() => {
                if (rootRouteName) {
                  (navigation as any).navigate(rootRouteName, { screen: item.key });
                } else {
                  (navigation as any).navigate(item.key);
                }
                navigation.closeDrawer();
              }}
              style={{
                marginHorizontal: 12,
                marginVertical: 4,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: active ? `${colors.primary}55` : 'transparent',
                backgroundColor: active ? `${colors.primary}12` : 'transparent',
                paddingHorizontal: 14,
                paddingVertical: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <View
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? `${colors.primary}18` : colors.surfaceAlt,
                  }}
                >
                  <AppIcon name={(item.icon as string) || 'ellipse-outline'} size={18} color={active ? colors.primary : colors.textMuted} />
                </View>
                <Text
                  style={{
                    color: active ? colors.primary : colors.text,
                    fontWeight: active ? '800' : '600',
                    fontSize: 14,
                  }}
                >
                  {item.label}
                </Text>
              </View>

              {typeof item.badge === 'number' && item.badge > 0 && (
                <View
                  style={{
                    minWidth: 22,
                    height: 22,
                    borderRadius: 11,
                    paddingHorizontal: 6,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: colors.danger,
                  }}
                >
                  <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>
                    {item.badge > 99 ? '99+' : item.badge}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View
        style={{
          borderTopWidth: 1,
          borderTopColor: colors.border,
          paddingHorizontal: 18,
          paddingTop: 14,
          paddingBottom: insets.bottom + 14,
          gap: 14,
        }}
      >
        <AppSwitch value={isDark} onToggle={toggleTheme} label="Mode sombre" />
        <TouchableOpacity
          onPress={logout}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <AppIcon name="log-out-outline" size={18} color={colors.danger} />
          <Text style={{ color: colors.danger, fontSize: 14, fontWeight: '700' }}>
            Déconnexion
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
