import React, { useCallback, useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
}

const COLORS: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46', icon: 'OK' },
  error: { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', icon: '!' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', icon: '!' },
  info: { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', icon: 'i' },
};

function AlertToastComponent({ item, onDismiss }: { item: AlertItem; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const dismissedRef = useRef(false);

  const duration = item.duration ?? 10000;

  const dismiss = useCallback(() => {
    if (dismissedRef.current) return;
    dismissedRef.current = true;

    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 180, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 180, useNativeDriver: true }),
    ]).start(onDismiss);
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();

    const timer = setTimeout(() => dismiss(), duration);
    return () => clearTimeout(timer);
  }, [dismiss, duration, opacity, progress, scale, translateY]);

  const colorSet = COLORS[item.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: colorSet.bg,
          borderLeftColor: colorSet.border,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colorSet.border }]}>
        <Text style={styles.iconText}>{colorSet.icon}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: colorSet.text }]}>{item.title}</Text>
        {item.message ? <Text style={[styles.message, { color: colorSet.text }]}>{item.message}</Text> : null}
      </View>

      <TouchableOpacity onPress={dismiss}>
        <Text style={[styles.close, { color: colorSet.text }]}>x</Text>
      </TouchableOpacity>

      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: colorSet.border,
            width: progress.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </Animated.View>
  );
}

const AlertToast = React.memo(AlertToastComponent);

let addToast: ((type: AlertType, title: string, message?: string, duration?: number) => void) | null = null;
let toastCounter = 0;

export const Toast = {
  success: (title: string, message?: string, duration?: number) => addToast?.('success', title, message, duration),
  error: (title: string, message?: string, duration?: number) => addToast?.('error', title, message, duration),
  warning: (title: string, message?: string, duration?: number) => addToast?.('warning', title, message, duration),
  info: (title: string, message?: string, duration?: number) => addToast?.('info', title, message, duration),
};

export function showAlert(type: AlertType, title: string, message?: string, duration?: number) {
  Toast[type](title, message, duration);
}

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<AlertItem[]>([]);

  useEffect(() => {
    addToast = (type, title, message, duration) => {
      toastCounter += 1;
      const id = `${Date.now()}-${toastCounter}`;
      setToasts((prev) => [{ id, type, title, message, duration }, ...prev].slice(0, 4));
    };

    return () => {
      addToast = null;
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  return (
    <View style={styles.container} pointerEvents="box-none">
      {toasts.map((toast) => (
        <AlertToast key={toast.id} item={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toast: {
    borderLeftWidth: 4,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 6,
  },
  icon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },
  close: {
    fontSize: 16,
    paddingLeft: 8,
  },
  progress: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    height: 3,
    borderBottomLeftRadius: 14,
    borderBottomRightRadius: 14,
  },
});
