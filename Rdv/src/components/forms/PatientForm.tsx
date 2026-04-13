// components/forms/PatientForm.tsx
import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { AppCard } from '../ui/AppCard';
import { AppDropdown } from '../shared/AppDropdown';
import { GroupeSanguin } from '../../types/models.types';

export interface PatientFormValues {
  nom: string;
  prenom: string;
  num_secu_sociale: string;
  groupe_sanguin: GroupeSanguin;
  id_dossier_medical: string;
}

interface PatientFormProps {
  title?: string;
  onSubmit?: (values: PatientFormValues) => void;
}

export function PatientForm({ title = 'Informations patient', onSubmit }: PatientFormProps) {
  const [values, setValues] = useState<PatientFormValues>({
    nom: '',
    prenom: '',
    num_secu_sociale: '',
    groupe_sanguin: 'O+',
    id_dossier_medical: '',
  });

  const update = <K extends keyof PatientFormValues>(key: K, value: PatientFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Animation du bouton
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 180 }) }],
  }));

  const bloodTypes: GroupeSanguin[] = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  return (
    <AppCard title={title} style={styles.card}>
      <View style={styles.form}>
        <AppInput
          label="Nom"
          value={values.nom}
          onChangeText={(value) => update('nom', value)}
          style={styles.input}
        />
        <AppInput
          label="Prénom"
          value={values.prenom}
          onChangeText={(value) => update('prenom', value)}
          style={styles.input}
        />
        <AppInput
          label="Numéro de sécurité sociale"
          value={values.num_secu_sociale}
          onChangeText={(value) => update('num_secu_sociale', value)}
          style={styles.input}
          keyboardType="numeric"
        />
        <AppDropdown
          label="Groupe sanguin"
          value={values.groupe_sanguin}
          onValueChange={(value) => update('groupe_sanguin', value as GroupeSanguin)}
          options={bloodTypes.map((value) => ({ label: value, value }))}
          containerStyle={styles.dropdown}
        />
        <AppInput
          label="Numéro de dossier"
          value={values.id_dossier_medical}
          onChangeText={(value) => update('id_dossier_medical', value)}
          style={styles.input}
        />

        {/* Bouton animé */}
        <Pressable
          onPressIn={() => (scale.value = 0.95)}
          onPressOut={() => (scale.value = 1)}
          style={{ width: '100%' }}
        >
          <Animated.View style={[animStyle, { width: '100%' }]}>
            <AppButton
              label="Enregistrer"
              fullWidth
              onPress={() => onSubmit?.(values)}
              style={styles.button}
            />
          </Animated.View>
        </Pressable>
      </View>
    </AppCard>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    paddingVertical: 24,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
    marginVertical: 10,
  },
  form: {
    gap: 16, // espace entre champs
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
    marginVertical: 4,
  },
  button: {
    borderRadius: 14,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
    marginTop: 12,
  },
});