// components/forms/PasswordField.tsx
import React, { useState, useEffect } from 'react';
import { View, Text, TextInputProps, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';
import { AppInput } from '../ui/AppInput';

export interface PasswordFieldProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  showStrength?: boolean;
}

const calculateStrength = (password: string) => {
  let score = 0;
  if (!password) return { score: 0, label: '', color: '#ccc' };

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible', color: '#ef4444' };
  if (score === 3) return { score, label: 'Moyen', color: '#f59e0b' };
  if (score >= 4) return { score, label: 'Fort', color: '#10b981' };

  return { score: 0, label: '', color: '#ccc' };
};

export const PasswordField: React.FC<PasswordFieldProps> = ({ value, onChangeText, label, showStrength = true, ...props }) => {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const widthAnim = useSharedValue(0);

  const strength = calculateStrength(value);

  // Animation de la barre
  useEffect(() => {
    widthAnim.value = withTiming((strength.score / 5) * 100, { duration: 300 });
  }, [strength.score, widthAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`,
  }));

  return (
    <View>
      <AppInput
        label={label ?? 'Mot de passe'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        rightIcon={
          <Pressable onPress={() => setShowPassword((v) => !v)}>
            <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>
              {showPassword ? 'Masquer' : 'Voir'}
            </Text>
          </Pressable>
        }
        {...props}
      />

      {showStrength && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthBarBg, { backgroundColor: colors.border }]}>
            <Animated.View style={[styles.strengthBar, animatedStyle, { backgroundColor: strength.color }]} />
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
        </View>
      )}

      {showStrength && value.length > 0 && (
        <View style={{ marginTop: 6 }}>
          {[
            { label: '8 caractères', valid: value.length >= 8 },
            { label: 'Majuscule', valid: /[A-Z]/.test(value) },
            { label: 'Minuscule', valid: /[a-z]/.test(value) },
            { label: 'Chiffre', valid: /[0-9]/.test(value) },
            { label: 'Caractère spécial', valid: /[^A-Za-z0-9]/.test(value) },
          ].map((rule, i) => (
            <Text
              key={i}
              style={{ fontSize: 12, color: rule.valid ? '#10b981' : '#9ca3af' }}
            >
              {rule.valid ? '✓' : '•'} {rule.label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  strengthContainer: {
    marginTop: 8,
  },
  strengthBarBg: {
    height: 6,
    borderRadius: 10,
    overflow: 'hidden',
  },
  strengthBar: {
    height: 6,
    borderRadius: 10,
  },
  strengthLabel: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '600',
  },
});