import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { AppCard } from '../ui/AppCard';
import { AppDropdown, DropdownOption } from '../shared/AppDropdown';
import { useTheme } from '../../store/ThemeContext';

export interface RdvFormValues {
  patient: string;
  medecin: string;
  service: string;
  date: string;
  motif: string;
}

interface RdvFormProps {
  title?: string;
  serviceOptions?: DropdownOption[];
  onSubmit?: (values: RdvFormValues) => void;
}
 
export function RdvForm({ title = 'Nouveau rendez-vous', serviceOptions, onSubmit }: RdvFormProps) {
  const { colors } = useTheme();
  const [values, setValues] = useState<RdvFormValues>({
    patient: '',
    medecin: '',
    service: serviceOptions?.[0]?.value ?? 'consultation',
    date: '',
    motif: '',
  });

  const update = <K extends keyof RdvFormValues>(key: K, value: RdvFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  const options = serviceOptions ?? [
    { label: 'Consultation generale', value: 'consultation' },
    { label: 'Cardiologie', value: 'cardiologie' },
    { label: 'Radiologie', value: 'radiologie' },
  ];

  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 150 }) }],
  }));

  return (
    <AppCard title={title} style={styles.card}>
      <View style={styles.form}>
        <AppInput label="Patient" value={values.patient} placeholder="Ex: Marie Martin" onChangeText={(v) => update('patient', v)} style={styles.input} />
        <AppInput label="Medecin" value={values.medecin} placeholder="Ex: Dr. Diallo (medecin traitant)" onChangeText={(v) => update('medecin', v)} style={styles.input} />
        <AppDropdown label="Service" value={values.service} options={options} onValueChange={(v) => update('service', v)} containerStyle={styles.dropdown} />
        <AppInput
          label="Date et heure"
          value={values.date}
          placeholder="Ex: 20/03/2026 10:30"
          onChangeText={(v) => update('date', v)}
          style={styles.input}
        />
        <AppInput
          label="Motif"
          value={values.motif}
          placeholder="Ex: Consultation de suivi"
          onChangeText={(v) => update('motif', v)}
          multiline
          numberOfLines={3}
          style={styles.input}
        />

        <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 12 }}>Soumission simulee cote frontend pour le moment.</Text>

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
    borderRadius: 18,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  form: {
    gap: 16,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  dropdown: {
    borderRadius: 14,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  button: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
