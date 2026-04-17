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

export function NotificationsScreen({ navigation }: any) {
  const { colors } = useTheme();
  const { fetchUnread, isActiveSession } = useNotifContext();
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
      Toast.success('Notification', 'Marquée comme lue.');
    } catch {
      Toast.error('Erreur', 'Impossible de marquer la notification comme lue.');
    }
  }, [fetchNotifications, fetchUnread, page]);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsApi.deleteOne(id);
      const nextLength = items.length - 1;
      const nextPage = nextLength === 0 && page > 1 ? page - 1 : page;
      await Promise.all([fetchNotifications(nextPage), fetchUnread()]);
      Toast.success('Notification', 'Notification archivée.');
    } catch {
      Toast.error('Erreur', 'Archivage impossible.');
    }
  }, [fetchNotifications, fetchUnread, items.length, page]);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
      await Promise.all([fetchNotifications(1), fetchUnread()]);
      Toast.success('Succès', 'Toutes les notifications sont marquées comme lues.');
    } catch {
      Toast.error('Erreur', 'Action impossible.');
    }
  }, [fetchNotifications, fetchUnread]);

  useEffect(() => {
    if (!isActiveSession) return;

    fetchNotifications(1);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim, fetchNotifications, isActiveSession]);

  useAutoRefresh(() => fetchNotifications(page), REFRESH_INTERVALS.NOTIFICATIONS, isActiveSession);

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

  const header = useMemo(
    () => (
      <>
        <AppHeader
          title="Notifications"
          subtitle={isActiveSession ? 'Synchronisées avec votre compte actif' : 'En attente de reprise de session'}
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
          rightActions={
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <PdfExportButton title="Export" rows={items} columns={pdfColumns} />
              <AppButton label="Tout lire" size="sm" onPress={markAllAsRead} />
            </View>
          }
        />

        {!isActiveSession ? (
          <View
            style={{
              marginBottom: 16,
              borderRadius: 16,
              padding: 14,
              backgroundColor: `${colors.warning}12`,
              borderWidth: 1,
              borderColor: `${colors.warning}35`,
            }}
          >
            <Text style={{ color: colors.text, fontWeight: '700' }}>Notifications en pause</Text>
            <Text style={{ color: colors.textMuted, marginTop: 6 }}>
              Les notifications ne se rechargent que lorsque l’utilisateur concerné est connecté et actif.
            </Text>
          </View>
        ) : null}
      </>
    ),
    [colors.text, colors.textMuted, colors.warning, isActiveSession, items, markAllAsRead, navigation, pdfColumns]
  );

  const footer = useMemo(
    () =>
      items.length > 0 ? (
        <View style={{ marginTop: 4 }}>
          <AppPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => fetchNotifications(page - 1)}
            onNext={() => fetchNotifications(page + 1)}
          />
        </View>
      ) : null,
    [fetchNotifications, items.length, page, totalPages]
  );

  return (
    <ScreenWrapper scroll={false}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <NotificationsList
          notifications={items}
          loading={loading}
          onRefresh={() => fetchNotifications(page)}
          ListHeaderComponent={header}
          ListFooterComponent={footer}
          onPressItem={(n) => {
            if (!n.lu) markAsRead(n.id_notif);
          }}
          onMarkRead={markAsRead}
          onDelete={deleteNotification}
        />
      </Animated.View>
    </ScreenWrapper>
  );
}
