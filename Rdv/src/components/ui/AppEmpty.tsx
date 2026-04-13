import React, { useEffect } from 'react';
import { View, Text, Animated, Dimensions } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { AppButton } from './AppButton';

interface AppEmptyProps {
  title?: string;
  subtitle?: string;
  onRetry?: () => void;
}

const { width: SCREEN_W } = Dimensions.get('window');

export function AppEmpty({ title = 'Aucun résultat', subtitle, onRetry }: AppEmptyProps) {
  const { colors } = useTheme();
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const translateY = React.useRef(new Animated.Value(20)).current;
 
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 450, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, bounciness: 6 }),
    ]).start();
  }, [fadeAnim, translateY]);

  return (
    <Animated.View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 32,
        gap: 16,
        opacity: fadeAnim,
        transform: [{ translateY }],
      }}
    >
      {/* Icône moderne */}
      <View style={{
        width: SCREEN_W * 0.28,
        height: SCREEN_W * 0.28,
        borderRadius: SCREEN_W * 0.14,
        backgroundColor: colors.surfaceAlt,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      }}>
        <Text style={{ fontSize: SCREEN_W * 0.14 }}>🗂</Text>
      </View>

      {/* Texte */}
      <Text
        style={{
          fontSize: 20,
          fontWeight: '700',
          color: colors.text,
          textAlign: 'center',
          marginTop: 12,
        }}
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          style={{
            fontSize: 15,
            color: colors.textMuted,
            textAlign: 'center',
            marginTop: 4,
            lineHeight: 22,
          }}
        >
          {subtitle}
        </Text>
      )}

      {/* Bouton retry */}
      {onRetry && (
        <AppButton
          label="Réessayer"
          onPress={onRetry}
          variant="outline"
          size="md"
          style={{
            marginTop: 16,
            borderWidth: 1.2,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.12,
            shadowRadius: 6,
            elevation: 3,
          }}
        />
      )}
    </Animated.View>
  );
}
