import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, TextInputProps, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { AppInput } from '../ui/AppInput';

export interface PasswordFieldAnimatedProps extends TextInputProps {
  label?: string;
  value: string;
  onChangeText: (text: string) => void;
  showChecklist?: boolean;
}

const calculateStrength = (password: string) => {
  let score = 0;
  if (!password) return { score: 0, label: '', color: '#CBD5E1' };

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { score, label: 'Faible', color: '#EF4444' };
  if (score === 3) return { score, label: 'Moyen', color: '#F59E0B' };
  return { score, label: 'Fort', color: '#10B981' };
};

export const PasswordFieldAnimated: React.FC<PasswordFieldAnimatedProps> = ({
  value,
  onChangeText,
  label,
  showChecklist = true,
  ...props
}) => {
  const { colors } = useTheme();
  const [showPassword, setShowPassword] = useState(false);
  const widthAnim = useSharedValue(0);
  const strength = useMemo(() => calculateStrength(value), [value]);

  useEffect(() => {
    widthAnim.value = withTiming((strength.score / 5) * 100, { duration: 220 });
  }, [strength.score, widthAnim]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${widthAnim.value}%`,
  }));

  const rules = [
    { label: '8 caracteres minimum', valid: value.length >= 8 },
    { label: 'Une majuscule', valid: /[A-Z]/.test(value) },
    { label: 'Une minuscule', valid: /[a-z]/.test(value) },
    { label: 'Un chiffre', valid: /[0-9]/.test(value) },
    { label: 'Un caractere special', valid: /[^A-Za-z0-9]/.test(value) },
  ];

  return (
    <View>
      <AppInput
        label={label ?? 'Mot de passe'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={!showPassword}
        autoCapitalize="none"
        textContentType="password"
        autoComplete="password"
        rightIcon={
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.primary}
          />
        }
        onRightPress={() => setShowPassword((current) => !current)}
        {...props}
      />

      {showChecklist && value.length > 0 && (
        <View style={styles.strengthContainer}>
          <View style={[styles.strengthBarBg, { backgroundColor: colors.border }]}>
            <Animated.View style={[styles.strengthBar, animatedStyle, { backgroundColor: strength.color }]} />
          </View>
          <Text style={[styles.strengthLabel, { color: strength.color }]}>
            Securite: {strength.label}
          </Text>
        </View>
      )}

      {showChecklist && value.length > 0 && (
        <View style={{ marginTop: 6 }}>
          {rules.map((rule) => (
            <View key={rule.label} style={styles.ruleRow}>
              <Ionicons
                name={rule.valid ? 'checkmark-circle' : 'ellipse-outline'}
                size={14}
                color={rule.valid ? colors.success : colors.textLight}
              />
              <Text style={{ fontSize: 12, color: rule.valid ? colors.success : colors.textMuted }}>
                {rule.label}
              </Text>
            </View>
          ))}
        </View>
      )}

      {!showChecklist && (
        <TouchableOpacity onPress={() => setShowPassword((current) => !current)} style={styles.visibilityHint}>
          <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>
            {showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
          </Text>
        </TouchableOpacity>
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
    fontWeight: '700',
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 3,
  },
  visibilityHint: {
    alignSelf: 'flex-start',
    marginTop: 6,
  },
});
