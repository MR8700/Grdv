import React, { useEffect, useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
  StyleSheet,
} from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Picker } from '@react-native-picker/picker';
import { AuthForm, AuthFormData } from '../../components/auth/AuthForm';
import { Toast } from '../../components/ui/AppAlert';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { servicesApi } from '../../api/services.api';
import { PaginatedResponse } from '../../types/api.types';
import { Service } from '../../types/models.types';

type RegisterRole = 'patient' | 'medecin' | 'secretaire';

const ROLE_COPY: Record<RegisterRole, { title: string; subtitle: string; helper: string }> = {
  patient: {
    title: "Inscription patient",
    subtitle: "Prise de rendez-vous, dossier et notifications",
    helper: "Vous pourrez gérer vos rendez-vous et accéder à votre dossier, tout en ajoutant d’autres rôles sur ce même compte.",
  },
  medecin: {
    title: "Demande médecin",
    subtitle: "Agenda, disponibilités et gestion des patients",
    helper: "Votre compte vous permettra de gérer vos consultations. Vous pourrez également cumuler ce rôle avec d’autres profils.",
  },
  secretaire: {
    title: "Demande secrétaire",
    subtitle: "Suivi des rendez-vous et accueil des patients",
    helper: "Accédez aux outils de gestion des rendez-vous et basculez facilement entre vos différents rôles si nécessaire.",
  },
};


export function RegisterScreen({ navigation }: { navigation?: any }) {
  const { register } = useAuth();
  const { colors } = useTheme();
  const cardY = useSharedValue(60);
  const [selectedRole, setSelectedRole] = useState<RegisterRole>('patient');
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    cardY.value = withSpring(0, { damping: 18 });
  }, [cardY]);

  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await servicesApi.getAll({ limit: 100 });
        const payload = response.data as PaginatedResponse<Service>;
        setServices(payload.data);
      } catch {
        setServices([]);
      }
    };

    loadServices();
  }, []);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
  }));

  const copy = useMemo(() => ROLE_COPY[selectedRole], [selectedRole]);

  const { mutate: handleRegister, loading } = useApiMutation<void>(
    async (data: unknown) => {
      const payload = data as AuthFormData;
      await register({
        login: payload.login,
        password: payload.password,
        nom: payload.nom || '',
        prenom: payload.prenom || '',
        email: payload.email,
        type_user: selectedRole,
        code_rpps: payload.code_rpps,
        specialite_principale: payload.specialite_principale,
        id_service_affecte: payload.id_service_affecte ? Number(payload.id_service_affecte) : undefined,
        id_services_affectes: payload.id_services_affectes?.map((value) => Number(value)).filter(Boolean),
        num_secu_sociale: payload.num_secu_sociale,
        groupe_sanguin: payload.groupe_sanguin as any,
        photo: payload.photo_asset,
      });
    },
    {
      onSuccess: () => Toast.success('Inscription reussie', 'Votre compte a ete cree.'),
      showToast: false,
    }
  );

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <Animated.ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces
          alwaysBounceVertical
          contentContainerStyle={styles.scrollContainer}
        >
          <View style={styles.header}>
            <Text style={styles.title}>{copy.title}</Text>
            <Text style={styles.subtitle}>{copy.subtitle}</Text>
          </View>

          <Animated.View style={[cardAnim, { backgroundColor: colors.surface }, styles.card]}>
            <View
              style={{
                borderRadius: 16,
                padding: 14,
                marginBottom: 18,
                backgroundColor: `${colors.primary}12`,
                borderWidth: 1,
                borderColor: `${colors.primary}24`,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8 }}>Type de compte souhaité</Text>
              <View style={[styles.pickerWrapper, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
                <Picker
                  selectedValue={selectedRole}
                  onValueChange={(itemValue) => setSelectedRole(itemValue)}
                  style={[styles.picker, { color: colors.text }]}
                  dropdownIconColor={colors.primary}
                >
                  <Picker.Item label="Patient" value="patient" />
                  <Picker.Item label="Médecin" value="medecin" />
                  <Picker.Item label="Sécrétaire" value="secretaire" />
                </Picker>
              </View>
              <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>{copy.helper}</Text>
            </View>

            <AuthForm
              mode="register"
              onSubmit={handleRegister}
              loading={loading}
              registerRole={selectedRole}
              serviceOptions={services.map((service) => ({
                label: service.nom_service,
                value: String(service.id_service),
              }))}
              onSwitchMode={() => navigation?.navigate?.('Login')}
            />
          </Animated.View>
        </Animated.ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0e5f87' },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingTop: 54,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  title: { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 0.5, textAlign: 'center' },
  subtitle: { color: 'rgba(255,255,255,0.8)', fontSize: 14, marginTop: 6, textAlign: 'center' },
  card: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 28,
    paddingBottom: 48,
    minHeight: 720,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 10,
  },
  pickerWrapper: { borderWidth: 1, borderRadius: 12, overflow: 'hidden' },
  picker: { height: 52 },
});
