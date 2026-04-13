import { useEffect, useCallback } from 'react';
import { useNotifContext } from '../store/NotifContext';
import { useAutoRefresh } from './useAutoRefresh';
import { REFRESH_INTERVALS } from '../utils/constants';

export function useNotifications() {
  const { fetchUnread, registerPush, unreadCount } = useNotifContext();

  // 🔹 Initialisation : inscription aux push et fetch initial
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      if (mounted) {
        try {
          await registerPush();
          await fetchUnread();
        } catch (err) {
          console.warn('Erreur lors de l\'initialisation des notifications', err);
        }
      }
    };
    init();
    return () => {
      mounted = false;
    };
  }, [fetchUnread, registerPush]);

  // 🔹 Auto-refresh périodique
  useAutoRefresh(fetchUnread, REFRESH_INTERVALS.NOTIFICATIONS);

  // 🔹 Fonction pour notifications locales (placeholder)
  const scheduleLocal = useCallback(
    async (title: string, body: string, seconds = 1, id?: string) => {
      // À remplacer par l'implémentation push / local notification
      console.log(`[LocalNotification] ${title}: ${body} (dans ${seconds}s)`);
      return Promise.resolve(id ?? `${Date.now()}`);
    },
    []
  );

  // 🔹 Fonction pour forcer la récupération des notifications non lues
  const refresh = useCallback(() => fetchUnread(), [fetchUnread]);

  return { unreadCount, scheduleLocal, refresh };
}