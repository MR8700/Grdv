import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { Notification as AppNotification } from '../../types/models.types';
import { formatRelativeTime } from '../../utils/formatters';
import { AppCard } from '../ui/AppCard';
import { AppEmpty } from '../ui/AppEmpty';
import { useTheme } from '../../store/ThemeContext';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

interface NotificationsListProps {
  notifications: AppNotification[];
  onPressItem?: (notification: AppNotification) => void;
}

function NotificationItem({
  notification,
  onPressItem,
}: {
  notification: AppNotification;
  onPressItem?: (notification: AppNotification) => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      onPress={() => onPressItem?.(notification)}
      activeOpacity={0.9}
      onPressIn={() => {
        scale.value = 0.97;
      }}
      onPressOut={() => {
        scale.value = 1;
      }}
    >
      <Animated.View style={animStyle}>
        <AppCard
          style={{
            padding: 14,
            borderRadius: 14,
            shadowColor: '#000',
            shadowOpacity: 0.05,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
            backgroundColor: colors.surface,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  color: colors.text,
                  fontSize: 14,
                  fontWeight: '700',
                  marginBottom: 4,
                }}
              >
                {notification.type_notification.toUpperCase()}
              </Text>
              <Text
                style={{
                  color: colors.textMuted,
                  fontSize: 13,
                  lineHeight: 20,
                }}
                numberOfLines={3}
              >
                {notification.message}
              </Text>
            </View>
            {!notification.lu && (
              <View
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 6,
                  backgroundColor: colors.primary,
                  alignSelf: 'flex-start',
                }}
              />
            )}
          </View>
          <Text
            style={{
              color: colors.textLight,
              fontSize: 12,
              marginTop: 10,
              textAlign: 'right',
            }}
          >
            {formatRelativeTime(notification.date_envoi)}
          </Text>
        </AppCard>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function NotificationsList({ notifications, onPressItem }: NotificationsListProps) {
  if (notifications.length === 0) {
    return <AppEmpty title="Aucune notification" subtitle="Les nouvelles alertes apparaitront ici." />;
  }
 
  return (
    <View style={{ gap: 12 }}>
      {notifications.map((notification) => (
        <NotificationItem
          key={notification.id_notif}
          notification={notification}
          onPressItem={onPressItem}
        />
      ))}
    </View>
  );
}
