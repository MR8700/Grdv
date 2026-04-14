import { useEffect, useRef, useCallback } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

export function useAutoRefresh(
  callback: () => Promise<void> | void,
  intervalMs: number,
  enabled = true
) {
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const inFlightRef = useRef(false);
  const isFocused = useIsFocused();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  const run = useCallback(async () => {
    if (inFlightRef.current) return;

    inFlightRef.current = true;
    try {
      await callbackRef.current();
    } catch (error) {
      console.warn('AutoRefresh error:', error);
    } finally {
      inFlightRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled || !isFocused) return;

    const start = () => {
      if (timerRef.current) return;
      timerRef.current = setInterval(run, intervalMs);
    };

    const stop = () => {
      if (!timerRef.current) return;
      clearInterval(timerRef.current);
      timerRef.current = null;
    };

    start();

    const sub = AppState.addEventListener('change', (next) => {
      if (appStateRef.current !== 'active' && next === 'active') {
        run();
        start();
      }

      if (next !== 'active') {
        stop();
      }

      appStateRef.current = next;
    });

    return () => {
      stop();
      sub.remove();
    };
  }, [enabled, intervalMs, isFocused, run]);
}
