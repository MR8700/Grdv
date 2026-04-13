import React, { ReactNode, useEffect, useRef } from 'react';
import { ThemeProvider } from './ThemeContext';
import { AuthProvider } from './AuthContext';
import { NotifProvider } from './NotifContext';
import { AppSettingsProvider } from './AppSettingsContext';
import { ToastContainer, Toast } from '../components/ui/AppAlert';
import { flushPendingMutations } from '../utils/offlineSync';
import { MediaOutbox } from '../utils/mediaOutbox';

interface AppProviderProps {
  children: ReactNode;
  syncIntervalMs?: number; // intervalle de sync en ms (défaut 2min)
}

export function AppProvider({ children, syncIntervalMs = 120000 }: AppProviderProps) {
  const isMounted = useRef(true);
  const syncing = useRef(false);

  useEffect(() => {
    isMounted.current = true;

    const sync = async () => {
      if (syncing.current) return;
      syncing.current = true;

      try {
        // Synchronisation JSON
        const synced = await flushPendingMutations();
        if (isMounted.current && synced > 0) {
          Toast.success('Synchronisation', `${synced} action(s) hors ligne envoyée(s) au backend.`);
        }

        // Synchronisation media
        const mediaResult = await MediaOutbox.flush();
        if (isMounted.current) {
          if (mediaResult.synced > 0) {
            Toast.success('Photos synchronisées', `${mediaResult.synced} media(s) envoyé(s) au backend.`);
          }
          if (mediaResult.failed > 0) {
            Toast.error('Échec synchronisation media', `${mediaResult.failed} media(s) en échec.`);
          }
        }
      } catch (err) {
        console.warn('Erreur lors de la synchronisation automatique', err);
      } finally {
        syncing.current = false;
      }
    };

    // Sync initial au démarrage
    sync();

    // Sync périodique
    const interval = setInterval(sync, syncIntervalMs);

    return () => {
      isMounted.current = false;
      clearInterval(interval);
    };
  }, [syncIntervalMs]);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AppSettingsProvider>
          <NotifProvider>
            {children}
            <ToastContainer />
          </NotifProvider>
        </AppSettingsProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
