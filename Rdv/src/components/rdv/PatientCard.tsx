import React from 'react';
import { Text, View } from 'react-native';
import { Patient } from '../../types/models.types';
import { AppAvatar } from '../ui/AppAvatar';
import { AppCard } from '../ui/AppCard';
import { useTheme } from '../../store/ThemeContext';

interface PatientCardProps {
  patient: Patient;
  subtitle?: string;
  onPress?: () => void;
}

function PatientCardComponent({ patient, subtitle, onPress }: PatientCardProps) {
  const { colors } = useTheme();
  const utilisateur = patient.utilisateur;

  if (!utilisateur) return null;
 
  return (
    <AppCard onPress={onPress} style={{ marginBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <AppAvatar
          nom={utilisateur.nom}
          prenom={utilisateur.prenom}
          photoPath={utilisateur.photo_path}
          size={48}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>
            {utilisateur.prenom} {utilisateur.nom}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 13 }}>
            {subtitle ?? patient.id_dossier_medical ?? 'Dossier en cours'}
          </Text>
          {patient.groupe_sanguin && (
            <Text style={{ color: colors.primary, marginTop: 6, fontSize: 12, fontWeight: '600' }}>
              Groupe sanguin: {patient.groupe_sanguin}
            </Text>
          )}
        </View>
      </View>
    </AppCard>
  );
}

export const PatientCard = React.memo(PatientCardComponent);
