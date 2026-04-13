import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { AppCard } from '../ui/AppCard';
import { AppDropdown } from '../shared/AppDropdown';

export interface MedecinFormValues {
  specialite: string;
  code_rpps: string;
  service: string;
  disponibilite: string;
}
 
interface MedecinFormProps {
  title?: string;
  onSubmit?: (values: MedecinFormValues) => void;
}

export function MedecinForm({ title = 'Informations medecin', onSubmit }: MedecinFormProps) {
  const [values, setValues] = useState<MedecinFormValues>({
    specialite: '',
    code_rpps: '',
    service: 'general',
    disponibilite: '',
  });

  const update = <K extends keyof MedecinFormValues>(key: K, value: MedecinFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 10, stiffness: 120 }) }],
  }));

  return (
    <AppCard title={title} style={styles.card}>
      <View style={styles.form}>
        <AppInput
          label="Specialite"
          value={values.specialite}
          placeholder="Ex: Cardiologie"
          onChangeText={(value) => update('specialite', value)}
          style={styles.input}
        />
        <AppInput
          label="Code RPPS"
          value={values.code_rpps}
          placeholder="Ex: 10001234567"
          onChangeText={(value) => update('code_rpps', value)}
          style={styles.input}
        />
        <AppDropdown
          label="Service"
          value={values.service}
          onValueChange={(value) => update('service', value)}
          options={[
            { label: 'Médecine générale', value: 'general' },
            { label: 'Pédiatrie', value: 'pediatrie' },
            { label: 'Cardiologie', value: 'cardiologie' },
          ]}
          containerStyle={styles.dropdown}
        />
        <AppInput
          label="Disponibilité"
          value={values.disponibilite}
          placeholder="Ex: Lun-Ven 08:00-16:00"
          onChangeText={(value) => update('disponibilite', value)}
          style={styles.input}
        />

        <Pressable onPressIn={() => (scale.value = 0.95)} onPressOut={() => (scale.value = 1)} style={{ width: '100%' }}>
          <Animated.View style={[animStyle, { width: '100%' }]}>
            <AppButton label="Enregistrer" fullWidth onPress={() => onSubmit?.(values)} style={styles.button} />
          </Animated.View>
        </Pressable>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  form: {
    gap: 16,
  },
  input: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  dropdown: {
    borderRadius: 12,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  button: {
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
});
