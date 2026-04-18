import React from 'react';
import { Text, View } from 'react-native';
import { Patient } from '../../types/models.types';
import { AppButton } from '../ui/AppButton';
import { AppModal } from '../ui/AppModal';
import { useTheme } from '../../store/ThemeContext';

interface PatientDetailsModalProps {
  patient: Patient | null;
  visible: boolean;
  onClose: () => void;
}

export function PatientDetailsModal({ patient, visible, onClose }: PatientDetailsModalProps) {
  const { colors } = useTheme();
  const fullName = `${patient?.utilisateur?.prenom || ''} ${patient?.utilisateur?.nom || ''}`.trim() || 'Patient';

  return (
    <AppModal
      visible={visible}
      onClose={onClose}
      title={fullName}
      actions={<AppButton label="Fermer" fullWidth onPress={onClose} />}
    >
      {patient ? (
        <View style={{ gap: 12 }}>
          <Text style={{ color: colors.textMuted }}>
            Dossier medical: {patient.id_dossier_medical || 'Non renseigne'}
          </Text>
          <Text style={{ color: colors.text }}>
            E-mail: {patient.utilisateur?.email || 'Non renseigne'}
          </Text>
          <Text style={{ color: colors.text }}>
            Groupe sanguin: {patient.groupe_sanguin || 'Non renseigne'}
          </Text>
          <Text style={{ color: colors.text }}>
            Numero de securite sociale: {patient.num_secu_sociale || 'Non renseigne'}
          </Text>
          <Text style={{ color: colors.text }}>
            Statut du compte: {patient.utilisateur?.statut || 'Inconnu'}
          </Text>
        </View>
      ) : null}
    </AppModal>
  );
}
