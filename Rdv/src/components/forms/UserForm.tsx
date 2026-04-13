import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';
import { AppCard } from '../ui/AppCard';
import { AppDropdown, DropdownOption } from '../shared/AppDropdown';
import { useTheme } from '../../store/ThemeContext';
import { TypeUser } from '../../types/models.types';

export interface UserFormValues {
  nom: string;
  prenom: string;
  email: string;
  login: string;
  type_user: TypeUser;
}

interface UserFormProps {
  title?: string;
  onSubmit?: (values: UserFormValues) => void;
}
 
export function UserForm({ title = 'Utilisateur', onSubmit }: UserFormProps) {
  const { colors } = useTheme();
  const [values, setValues] = useState<UserFormValues>({
    nom: '',
    prenom: '',
    email: '',
    login: '',
    type_user: 'patient',
  });

  const update = <K extends keyof UserFormValues>(key: K, value: UserFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }));

  // Animation bouton
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withSpring(scale.value, { damping: 12, stiffness: 160 }) }],
  }));

  const roleOptions: DropdownOption[] = [
    { label: 'Patient', value: 'patient' },
    { label: 'Médecin', value: 'medecin' },
    { label: 'Secrétaire', value: 'secretaire' },
    { label: 'Administrateur', value: 'administrateur' },
  ];

  return (
    <AppCard title={title} style={styles.card}>
      <View style={styles.form}>
        <AppInput label="Nom" value={values.nom} onChangeText={(v) => update('nom', v)} style={styles.input} />
        <AppInput label="Prénom" value={values.prenom} onChangeText={(v) => update('prenom', v)} style={styles.input} />
        <AppInput
          label="Email"
          value={values.email}
          onChangeText={(v) => update('email', v)}
          keyboardType="email-address"
          style={styles.input}
        />
        <AppInput label="Login" value={values.login} onChangeText={(v) => update('login', v)} style={styles.input} />
        <AppDropdown
          label="Rôle"
          value={values.type_user}
          options={roleOptions}
          onValueChange={(v) => update('type_user', v as TypeUser)}
          containerStyle={styles.dropdown}
        />
        <Text style={{ color: colors.textLight, fontSize: 12, marginBottom: 12 }}>
          Les validations métier pourront être ajoutées plus tard.
        </Text>

        {/* Bouton animé */}
        <Pressable
          onPressIn={() => (scale.value = 0.95)}
          onPressOut={() => (scale.value = 1)}
          style={{ width: '100%' }}
        >
          <Animated.View style={[animStyle, { width: '100%' }]}>
            <AppButton
              label="Valider"
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