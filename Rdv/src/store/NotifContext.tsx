import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { notificationsApi } from '../api/notifications.api';
import { Toast } from '../components/ui/AppAlert';

interface NotifContextValue {
  unreadCount: number;
  fetchUnread: () => Promise<void>;
  expoPushToken: string | null;
  registerPush: () => Promise<void>;
}

const NotifContext = createContext<NotifContextValue | undefined>(undefined);

export function NotifProvider({ children }: { children: ReactNode }) {
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);

  // Ref to track previous unread count for delta notifications
  const previousUnreadRef = useRef(0);
  const hydratedRef = useRef(false);

  // Fetch unread notifications
  const fetchUnread = useCallback(async () => {
    try {
      const res = await notificationsApi.getMine({ lu: false, limit: 1 });
      const nextUnread = res.data.meta?.total ?? 0;

      if (hydratedRef.current && nextUnread > previousUnreadRef.current) {
        const delta = nextUnread - previousUnreadRef.current;
        Toast.info('Nouvelle notification', `${delta} nouveau(x) message(s) reçu(s).`, 4500);
      }

      hydratedRef.current = true;
      previousUnreadRef.current = nextUnread;
      setUnreadCount(nextUnread);
    } catch (error) {
      console.warn('Failed to fetch unread notifications', error);
    }
  }, []);

  // Register push notifications (stub for bare workflow)
  const registerPush = useCallback(async () => {
    try {
      // Implement actual push registration if needed
      setExpoPushToken(null);
    } catch (error) {
      console.warn('Failed to register push token', error);
    }
  }, []);

  // Initial fetch and registration
  useEffect(() => {
    registerPush();
    fetchUnread();

    // Optional: auto-refresh every 2 minutes
    const interval = setInterval(fetchUnread, 120_000);
    return () => clearInterval(interval);
  }, [fetchUnread, registerPush]);

  const value = {
    unreadCount,
    fetchUnread,
    expoPushToken,
    registerPush,
  };

  return <NotifContext.Provider value={value}>{children}</NotifContext.Provider>;
}

export const useNotifContext = () => {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifContext must be used within NotifProvider');
  return ctx;
};