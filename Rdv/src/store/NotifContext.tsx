import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  ReactNode,
} from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { notificationsApi } from '../api/notifications.api';
import { Toast } from '../components/ui/AppAlert';
import { useAuth } from './AuthContext';

interface NotifContextValue {
  unreadCount: number;
  fetchUnread: () => Promise<void>;
  expoPushToken: string | null;
  registerPush: () => Promise<void>;
  isActiveSession: boolean;
}

const NotifContext = createContext<NotifContextValue | undefined>(undefined);

export function NotifProvider({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);

  const previousUnreadRef = useRef(0);
  const hydratedRef = useRef(false);
  const inFlightRef = useRef(false);

  const isActiveSession = isLoggedIn && Boolean(user?.id_user) && appState === 'active';

  const fetchUnread = useCallback(async () => {
    if (!isLoggedIn || !user?.id_user || appState !== 'active' || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    try {
      const res = await notificationsApi.getMine({ lu: false, limit: 1 });
      const nextUnread = res.data.meta?.total ?? 0;

      if (hydratedRef.current && nextUnread > previousUnreadRef.current) {
        const delta = nextUnread - previousUnreadRef.current;
        Toast.info('Nouvelle notification', `${delta} nouveau(x) message(s) recu(s).`, 4500);
      }

      hydratedRef.current = true;
      previousUnreadRef.current = nextUnread;
      setUnreadCount(nextUnread);
    } catch (error) {
      console.warn('Failed to fetch unread notifications', error);
    } finally {
      inFlightRef.current = false;
    }
  }, [appState, isLoggedIn, user?.id_user]);

  const registerPush = useCallback(async () => {
    try {
      setExpoPushToken(null);
    } catch (error) {
      console.warn('Failed to register push token', error);
    }
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
    });

    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !user?.id_user) {
      hydratedRef.current = false;
      previousUnreadRef.current = 0;
      setUnreadCount(0);
      return;
    }

    registerPush();
  }, [isLoggedIn, registerPush, user?.id_user]);

  useEffect(() => {
    if (!isActiveSession) return;

    fetchUnread();
    const interval = setInterval(fetchUnread, 120_000);
    return () => clearInterval(interval);
  }, [fetchUnread, isActiveSession]);

  const value = {
    unreadCount,
    fetchUnread,
    expoPushToken,
    registerPush,
    isActiveSession,
  };

  return <NotifContext.Provider value={value}>{children}</NotifContext.Provider>;
}

export const useNotifContext = () => {
  const ctx = useContext(NotifContext);
  if (!ctx) throw new Error('useNotifContext must be used within NotifProvider');
  return ctx;
};
