import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated, Alert } from 'react-native';
import { notificationsApi } from '../../api/notifications.api';
import { AppPagination } from '../../components/shared/AppPagination';
import { NotificationsList } from '../../components/shared/NotificationsList';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppHeader } from '../../components/ui/AppHeader';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useNotifContext } from '../../store/NotifContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Notification } from '../../types/models.types';
import { REFRESH_INTERVALS } from '../../utils/constants';

const PAGE_SIZE = 10;

export function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { fetchUnread } = useNotifContext();

  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  const fetchNotifications = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);

      const response = await notificationsApi.getMine({
        page: targetPage,
        limit: PAGE_SIZE,
      });

      const payload = response.data as PaginatedResponse<Notification>;

      setItems(payload.data);
      setPage(payload.meta.page);
      setTotalPages(payload.meta.totalPages || 1);
    } catch {
      Toast.error('Erreur', 'Impossible de charger les notifications.');
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsApi.markAsRead(id);
      await Promise.all([fetchNotifications(page), fetchUnread()]);
      Toast.success('Notification', 'Marquée comme lue');
    } catch {
      Toast.error('Erreur', 'Impossible de marquer comme lue');
    }
  }, [fetchNotifications, page, fetchUnread]);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsApi.deleteOne(id);
      setItems((prev) => prev.filter((n) => n.id_notif !== id));
      Toast.success('Supprimée', 'Notification supprimée');
    } catch {
      Toast.error('Erreur', 'Suppression impossible');
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      await Promise.all([fetchNotifications(1), fetchUnread()]);
      Toast.success('Succès', 'Toutes les notifications sont lues');
    } catch {
      Toast.error('Erreur', 'Action impossible');
    }
  }, [fetchNotifications, fetchUnread]);

  useEffect(() => {
    fetchNotifications(1);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  useAutoRefresh(() => fetchNotifications(page), REFRESH_INTERVALS.NOTIFICATIONS);

  const pdfColumns = useMemo(
    () => [
      { key: 'id', label: 'ID', value: (n: Notification) => n.id_notif },
      { key: 'date', label: 'Date', value: (n: Notification) => n.date_envoi },
      { key: 'type', label: 'Type', value: (n: Notification) => n.type_notification },
      { key: 'lu', label: 'Lu', value: (n: Notification) => (n.lu ? 'Oui' : 'Non') },
      { key: 'message', label: 'Message', value: (n: Notification) => n.message },
    ],
    []
  );

  return (
    <ScreenWrapper scroll refreshing={loading} onRefresh={() => fetchNotifications(page)}>
      <AppHeader
        title="Notifications"
        subtitle="Synchronisées avec votre compte"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <PdfExportButton title="Export" rows={items} columns={pdfColumns} />
            <AppButton label="Tout lire" size="sm" onPress={markAllAsRead} />
          </View>
        }
      />

      <Animated.View style={{ opacity: fadeAnim }}>
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 40 }}>🔔</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>
              Aucune notification
            </Text>
            <Text style={{ color: colors.textMuted, marginTop: 6 }}>
              Vous êtes à jour
            </Text>
          </View>
        ) : (
          <>
            <NotificationsList
              notifications={items}
              onPressItem={(n) => {
                if (!n.lu) markAsRead(n.id_notif);
              }}
              onMarkRead={markAsRead}
              onDelete={deleteNotification}
            />

            <View style={{ marginTop: 16 }}>
              <AppPagination
                page={page}
                totalPages={totalPages}
                onPrev={() => fetchNotifications(page - 1)}
                onNext={() => fetchNotifications(page + 1)}
              />
            </View>
          </>
        )}
      </Animated.View>
    </ScreenWrapper>
  );
}