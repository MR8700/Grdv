import React, { useCallback, useEffect, useRef } from 'react';
import {
  Text,
  View,
  Animated,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertItem {
  id: string;
  type: AlertType;
  title: string;
  message?: string;
  duration?: number;
}
 
const COLORS: Record<AlertType, { bg: string; border: string; text: string; icon: string }> = {
  success: { bg: '#ECFDF5', border: '#10B981', text: '#065F46', icon: '✓' },
  error:   { bg: '#FEF2F2', border: '#EF4444', text: '#991B1B', icon: '✕' },
  warning: { bg: '#FFFBEB', border: '#F59E0B', text: '#92400E', icon: '!' },
  info:    { bg: '#EFF6FF', border: '#3B82F6', text: '#1E40AF', icon: 'i' },
};

//////////////////////////////////////////////////////////////
// 🎯 TOAST ITEM
//////////////////////////////////////////////////////////////

function AlertToast({ item, onDismiss }: { item: AlertItem; onDismiss: () => void }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-30)).current;
  const scale = useRef(new Animated.Value(0.95)).current;
  const progress = useRef(new Animated.Value(0)).current;

  const duration = item.duration ?? 10000; // 🔥 10s par défaut

  const dismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: -20, duration: 200, useNativeDriver: true }),
    ]).start(onDismiss);
  }, [onDismiss, opacity, translateY]);

  useEffect(() => {
    // Animation entrée
    Animated.parallel([
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
    ]).start();

    // Barre de progression
    Animated.timing(progress, {
      toValue: 1,
      duration,
      useNativeDriver: false,
    }).start();

    // Auto dismiss
    const t = setTimeout(() => dismiss(), duration);

    return () => clearTimeout(t);
  }, [dismiss, duration, opacity, progress, scale, translateY]);

  const c = COLORS[item.type];

  return (
    <Animated.View
      style={[
        styles.toast,
        {
          backgroundColor: c.bg,
          borderLeftColor: c.border,
          opacity,
          transform: [{ translateY }, { scale }],
        },
      ]}
    >
      {/* Icon */}
      <View style={[styles.icon, { backgroundColor: c.border }]}>
        <Text style={styles.iconText}>{c.icon}</Text>
      </View>

      {/* Content */}
      <View style={{ flex: 1 }}>
        <Text style={[styles.title, { color: c.text }]}>{item.title}</Text>
        {item.message && (
          <Text style={[styles.message, { color: c.text }]}>{item.message}</Text>
        )}
      </View>

      {/* Close */}
      <TouchableOpacity onPress={dismiss}>
        <Text style={[styles.close, { color: c.text }]}>✕</Text>
      </TouchableOpacity>

      {/* Progress bar */}
      <Animated.View
        style={[
          styles.progress,
          {
            backgroundColor: c.border,
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

//////////////////////////////////////////////////////////////
// 🧠 TOAST MANAGER
//////////////////////////////////////////////////////////////

let addToast: ((type: AlertType, title: string, message?: string, duration?: number) => void) | null = null;

export const Toast = {
  success: (title: string, message?: string, duration?: number) =>
    addToast?.('success', title, message, duration),
  error: (title: string, message?: string, duration?: number) =>
    addToast?.('error', title, message, duration),
  warning: (title: string, message?: string, duration?: number) =>
    addToast?.('warning', title, message, duration),
  info: (title: string, message?: string, duration?: number) =>
    addToast?.('info', title, message, duration),
};

export function showAlert(type: AlertType, title: string, message?: string, duration?: number) {
  Toast[type](title, message, duration);
}

//////////////////////////////////////////////////////////////
// 📦 CONTAINER
//////////////////////////////////////////////////////////////

export function ToastContainer() {
  const [toasts, setToasts] = React.useState<AlertItem[]>([]);

  useEffect(() => {
    addToast = (type, title, message, duration) => {
      const id = Date.now().toString();

      setToasts(prev => [
        { id, type, title, message, duration },
        ...prev, // 🔥 NEW ON TOP
      ]);
    };

    return () => {
      addToast = null;
    };
  }, []);

  const dismiss = (id: string) =>
    setToasts(prev => prev.filter(t => t.id !== id));

  return (
    <View style={styles.container}>
      {toasts.map(t => (
        <AlertToast key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
      ))}
    </View>
  );
}

//////////////////////////////////////////////////////////////
// 🎨 STYLES
//////////////////////////////////////////////////////////////

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

    // 🔥 Glass + soft shadow
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
    fontSize: 12,
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
