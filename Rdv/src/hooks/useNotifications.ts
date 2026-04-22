import { useEffect, useCallback } from 'react';
import { useNotifContext } from '../store/NotifContext';
import { useAutoRefresh } from './useAutoRefresh';
import { REFRESH_INTERVALS } from '../utils/constants';
import { Toast } from '../components/ui/AppAlert';

export function useNotifications() {
  const { fetchUnread, registerPush, unreadCount } = useNotifContext();

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      if (!mounted) return;

      try {
        await registerPush();
        await fetchUnread();
      } catch (err) {
        console.warn("Erreur lors de l'initialisation des notifications", err);
      }
    };

    init();
    return () => {
      mounted = false;
    };
  }, [fetchUnread, registerPush]);

  useAutoRefresh(fetchUnread, REFRESH_INTERVALS.NOTIFICATIONS);

  const scheduleLocal = useCallback(async (title: string, body: string, seconds = 1, id?: string) => {
    Toast.info(title, `${body} (prevue dans ${seconds}s)`);
    return Promise.resolve(id ?? `${Date.now()}`);
  }, []);

  const refresh = useCallback(() => fetchUnread(), [fetchUnread]);

  return { unreadCount, scheduleLocal, refresh };
}
