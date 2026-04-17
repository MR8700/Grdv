import React from 'react';
import { FlatList, ListRenderItem, Text, TouchableOpacity, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { Notification as AppNotification } from '../../types/models.types';
import { formatRelativeTime } from '../../utils/formatters';
import { AppCard } from '../ui/AppCard';
import { AppEmpty } from '../ui/AppEmpty';
import { useTheme } from '../../store/ThemeContext';

interface Props {
  notifications: AppNotification[];
  onPressItem?: (n: AppNotification) => void;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
  ListHeaderComponent?: React.ReactElement | null;
  ListFooterComponent?: React.ReactElement | null;
  loading?: boolean;
  onRefresh?: () => void;
}

function NotificationItem({
  notification,
  onPressItem,
  onMarkRead,
  onDelete,
}: {
  notification: AppNotification;
  onPressItem?: (n: AppNotification) => void;
  onMarkRead?: (id: number) => void;
  onDelete?: (id: number) => void;
}) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={() => onPressItem?.(notification)}
      onPressIn={() => {
        scale.value = 0.98;
      }}
      onPressOut={() => {
        scale.value = 1;
      }}
    >
      <Animated.View style={animStyle}>
        <AppCard style={{ marginBottom: 12 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: '700', color: colors.text, textTransform: 'capitalize' }}>
                {notification.type_notification}
              </Text>

              <Text style={{ color: colors.textMuted, marginTop: 4 }}>
                {notification.message}
              </Text>

              <Text style={{ color: colors.textLight, marginTop: 8, fontSize: 12 }}>
                {formatRelativeTime(notification.date_envoi)}
              </Text>
            </View>

            {!notification.lu ? (
              <View
                style={{
                  width: 10,
                  height: 10,
                  borderRadius: 5,
                  backgroundColor: colors.primary,
                  marginTop: 6,
                }}
              />
            ) : null}
          </View>

          <View style={{ flexDirection: 'row', marginTop: 10, gap: 16 }}>
            {!notification.lu ? (
              <TouchableOpacity onPress={() => onMarkRead?.(notification.id_notif)}>
                <Text style={{ color: colors.primary, fontWeight: '700' }}>
                  Marquer comme lu
                </Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity onPress={() => onDelete?.(notification.id_notif)}>
              <Text style={{ color: colors.danger, fontWeight: '700' }}>
                Archiver
              </Text>
            </TouchableOpacity>
          </View>
        </AppCard>
      </Animated.View>
    </TouchableOpacity>
  );
}

export function NotificationsList({
  notifications,
  onPressItem,
  onMarkRead,
  onDelete,
  ListHeaderComponent,
  ListFooterComponent,
  loading = false,
  onRefresh,
}: Props) {
  const renderItem = React.useCallback<ListRenderItem<AppNotification>>(
    ({ item }) => (
      <NotificationItem
        notification={item}
        onPressItem={onPressItem}
        onMarkRead={onMarkRead}
        onDelete={onDelete}
      />
    ),
    [onDelete, onMarkRead, onPressItem]
  );

  return (
    <FlatList
      data={notifications}
      keyExtractor={(item) => String(item.id_notif)}
      renderItem={renderItem}
      refreshing={loading}
      onRefresh={onRefresh}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={<AppEmpty title="Aucune notification" subtitle="Rien à afficher." />}
      contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 126 }}
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews
      initialNumToRender={8}
      maxToRenderPerBatch={10}
      windowSize={7}
    />
  );
}
