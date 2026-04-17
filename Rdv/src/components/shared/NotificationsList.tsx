import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Notification as AppNotification } from '../../types/models.types';
import { formatRelativeTime } from '../../utils/formatters';
import { AppCard } from '../ui/AppCard';
import { AppEmpty } from '../ui/AppEmpty';
import { useTheme } from '../../store/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface Props {
  notifications: AppNotification[];
  onPressItem?: (n: AppNotification) => void;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}

function NotificationItem({ notification, onPressItem, onMarkRead, onDelete }: any) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => onPressItem?.(notification)}
      onPressIn={() => (scale.value = 0.97)}
      onPressOut={() => (scale.value = 1)}
    >
      <Animated.View style={animStyle}>
        <AppCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text }}>
                {notification.type_notification}
              </Text>

              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {notification.message}
              </Text>

              <Text style={{ color: colors.textLight, marginTop: 8, fontSize: 12 }}>
                {formatRelativeTime(notification.date_envoi)}
              </Text>
            </View>

            {!notification.lu && (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.primary,
                }}
              />
            )}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
            {!notification.lu && (
              <TouchableOpacity onPress={() => onMarkRead?.(notification.id_notif)}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Marquer lu
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity onPress={() => onDelete?.(notification.id_notif)}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function NotificationsList({ notifications, onPressItem, onMarkRead, onDelete }: Props) {
  if (!notifications.length) {
    return <AppEmpty title="Aucune notification" subtitle="Rien à afficher." />;
  }

  return (
    <View style={{ gap: 12 }}>
      {notifications.map((n) => (
        <NotificationItem
          key={n.id_notif}
          notification={n}
          onPressItem={onPressItem}
          onMarkRead={onMarkRead}
          onDelete={onDelete}
        />
      ))}
    </View>
  );
}