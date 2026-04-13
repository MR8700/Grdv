import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Animated } from 'react-native';
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

export function NotificationsScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { fetchUnread } = useNotifContext();

  const [items, setItems] = useState<Notification[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);

  const fadeAnim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  useEffect(() => {
    Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [fadeAnim]);

  const fetchNotifications = useCallback(async (targetPage = 1) => {
    try {
      setLoading(true);
      setError(null);

      const response = await notificationsApi.getMine({ page: targetPage, limit: PAGE_SIZE });
      const payload = response.data as PaginatedResponse<Notification>;

      setItems(payload.data);
      setPage(payload.meta.page);
      setTotalPages(payload.meta.totalPages || 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Impossible de charger les notifications.';
      setError(msg);
      Toast.error('Erreur', msg);
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await notificationsApi.markAsRead(id);
        await Promise.all([fetchNotifications(pageRef.current), fetchUnread()]);
        Toast.success('Notification lue', 'La notification a été marquée comme lue.', 2000);
      } catch (err: any) {
        const msg = err?.response?.data?.message ?? 'Mise à jour impossible.';
        setError(msg);
        Toast.error('Erreur notification', msg);
      }
    },
    [fetchNotifications, fetchUnread]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      await Promise.all([fetchNotifications(1), fetchUnread()]);
      Toast.success('Notifications lues', 'Toutes les notifications ont été marquées comme lues.', 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? 'Mise a jour impossible.';
      setError(msg);
      Toast.error('Erreur notification', msg);
    }
  }, [fetchNotifications, fetchUnread]);

  useEffect(() => {
    fetchNotifications(1);
  }, [fetchNotifications]);

  useAutoRefresh(() => fetchNotifications(pageRef.current), REFRESH_INTERVALS.NOTIFICATIONS);

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
    <ScreenWrapper scroll onRefresh={() => fetchNotifications(pageRef.current)} refreshing={loading}>
      <AppHeader
        title="Notifications"
        subtitle="Synchronisées avec votre compte"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PdfExportButton title="Export notifications" rows={items} filters={{ Page: page }} columns={pdfColumns} />
            <AppButton label="Tout lire" size="sm" variant="ghost" onPress={markAllAsRead} />
          </View>
        }
      />

      {error && (
        <Animated.Text style={{ color: colors.danger, marginBottom: 12, opacity: fadeAnim }}>
          {error}
        </Animated.Text>
      )}

      {items.length > 0 ? (
        <Animated.View style={{ opacity: fadeAnim }}>
          <NotificationsList
            notifications={items}
            onPressItem={(notification) => {
              if (!notification.lu) markAsRead(notification.id_notif);
            }}
          />

          <View style={{ marginTop: 16 }}>
            <AppPagination
              page={page}
              totalPages={totalPages}
              onPrev={() => page > 1 && fetchNotifications(page - 1)}
              onNext={() => page < totalPages && fetchNotifications(page + 1)}
            />
          </View>
        </Animated.View>
      ) : (
        !loading && (
          <View style={{ alignItems: 'center', marginTop: 60 }}>
            <Text style={{ fontSize: 40, marginBottom: 16 }}>Bell</Text>
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '700' }}>Aucune notification</Text>
            <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 6 }}>
              Vous êtes a jour, toutes vos notifications sont lues.
            </Text>
          </View>
        )
      )}
    </ScreenWrapper>
  );
}
