import React, { useEffect, useRef } from 'react';
import { Modal, View, Text, TouchableOpacity, Animated, ScrollView, Dimensions } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  height?: number | 'auto' | 'full';
  actions?: React.ReactNode;
}

const { height: SCREEN_H } = Dimensions.get('window');

function AppModalComponent({ visible, onClose, title, children, height = 'auto', actions }: AppModalProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const translateY = useRef(new Animated.Value(SCREEN_H)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          speed: 18,
          bounciness: 6,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_H,
          duration: 220,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 0.98,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [backdropOpacity, scale, translateY, visible]);

  const sheetHeight = height === 'full' ? SCREEN_H * 0.94 : height === 'auto' ? undefined : height;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <Animated.View
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          opacity: backdropOpacity,
        }}
      >
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: colors.surface,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          paddingBottom: insets.bottom + 16,
          maxHeight: SCREEN_H * 0.94,
          height: sheetHeight,
          transform: [{ translateY }, { scale }],
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -6 },
          shadowOpacity: 0.2,
          shadowRadius: 20,
          elevation: 25,
        }}
      >
        <View style={{ alignItems: 'center', paddingTop: 10 }}>
          <View
            style={{
              width: 46,
              height: 5,
              borderRadius: 10,
              backgroundColor: colors.border,
              opacity: 0.6,
            }}
          />
        </View>

        {title ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 14,
            }}
          >
            <Text
              style={{
                fontSize: 20,
                fontWeight: '700',
                color: colors.text,
              }}
            >
              {title}
            </Text>

            <TouchableOpacity
              onPress={onClose}
              style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: colors.surfaceAlt,
              }}
            >
              <Text style={{ fontSize: 16, color: colors.textMuted }}>x</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 20,
          }}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
        >
          {children}
        </ScrollView>

        {actions ? (
          <View
            style={{
              paddingHorizontal: 20,
              paddingTop: 10,
              paddingBottom: 4,
              borderTopWidth: 0.5,
              borderColor: colors.border,
              backgroundColor: colors.surface,
            }}
          >
            {actions}
          </View>
        ) : null}
      </Animated.View>
    </Modal>
  );
}

export const AppModal = React.memo(AppModalComponent);
