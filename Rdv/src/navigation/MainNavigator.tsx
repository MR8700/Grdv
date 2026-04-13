import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useAuth } from '../store/AuthContext';
import { useTheme } from '../store/ThemeContext';
import { AdminNavigator } from './AdminNavigator';
import { MedecinNavigator } from './MedecinNavigator';
import { PatientNavigator } from './PatientNavigator';
import { SecretaireNavigator } from './SecretaireNavigator';

function normalizeRole(input?: string | null) {
  if (!input) return null;
  const value = input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
  
  if (['admin', 'administrateur', 'administrator'].includes(value)) return 'administrateur';
  if (['medecin', 'docteur', 'doctor'].includes(value)) return 'medecin';
  if (value === 'secretaire') return 'secretaire';
  if (value === 'patient') return 'patient';
  return null;
}

function CurrentNavigator() {
  const { user } = useAuth();

  const normalizedType = useMemo(() => {
    const profileBasedType =
      (user?.profil_administrateur && 'administrateur') ||
      (user?.profil_medecin && 'medecin') ||
      (user?.profil_secretaire && 'secretaire') ||
      (user?.profil_patient && 'patient') ||
      null;

    return (
      normalizeRole(user?.type_user) ||
      normalizeRole(user?.role?.nom_role) ||
      normalizeRole((user as any)?.requested_role_code) ||
      profileBasedType
    );
  }, [user]);

  switch (normalizedType) {
    case 'administrateur':
      return <AdminNavigator />;
    case 'medecin':
      return <MedecinNavigator />;
    case 'secretaire':
      return <SecretaireNavigator />;
    case 'patient':
    default:
      return <PatientNavigator />;
  }
}

export function MainNavigator() {
  const { colors } = useTheme();
  const { isImpersonating, stopImpersonation, actorSession, user } = useAuth();

  return (
    <View style={{ flex: 1 }}>
      <CurrentNavigator />
      {isImpersonating && (
        <View
          pointerEvents="box-none"
          style={{
            position: 'absolute',
            left: 12,
            right: 12,
            top: 48,
            zIndex: 1000,
          }}
        >
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${colors.warning}88`,
              backgroundColor: `${colors.warning}20`,
              padding: 10,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 12 }}>
                Session déléguée active
              </Text>
              <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                {actorSession?.user?.login} {'->'} {user?.login}
              </Text>
            </View>
            <TouchableOpacity
              onPress={stopImpersonation}
              style={{
                borderRadius: 10,
                backgroundColor: colors.danger,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
            >
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 11 }}>Quitter</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}