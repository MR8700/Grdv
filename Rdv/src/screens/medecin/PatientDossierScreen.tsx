import React, { useEffect, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { patientsApi } from '../../api/patients.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { PatientForm } from '../../components/forms/PatientForm';
import { AppInput } from '../../components/ui/AppInput';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useTheme } from '../../store/ThemeContext';
import { Patient } from '../../types/models.types';
import { API_ORIGIN } from '../../utils/constants';

export function PatientDossierScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const { colors } = useTheme();
  const patientId = route?.params?.id_patient;
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dateNaissance, setDateNaissance] = useState('');
  const [poids, setPoids] = useState('');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(null);
  const [photoMessage, setPhotoMessage] = useState<string | null>(null);

  const updatePatient = useApiMutation((data) => patientsApi.update(Number(patientId), data as any));

  const photoUri = useMemo(() => {
    if (localPhotoUri) return localPhotoUri;
    const backendPath = patient?.utilisateur?.photo_path;
    return backendPath ? `${API_ORIGIN}/${backendPath}` : null;
  }, [localPhotoUri, patient?.utilisateur?.photo_path]);

  useEffect(() => {
    if (patientId) {
      patientsApi.getOne(Number(patientId)).then((res) => {
        if (res.data) setPatient(res.data as Patient);
      });
    }
  }, [patientId]);

  const onFormSubmit = (values: any) => {
    if (patientId && patient) {
      const updateData = {
        ...values,
        dateNaissance,
        poids: parseFloat(poids || '0'),
      };
      updatePatient.mutate(updateData as any);
    }
  };

  const handleLocalPhoto = async (asset: { uri: string }) => {
    setLocalPhotoUri(asset.uri);
    setPhotoMessage('Photo chargee localement pour verification visuelle.');
  };

  return (
    <ScreenWrapper scroll>
      <AppHeader
        title="Dossier Patient"
        subtitle="Informations médicales"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export dossier"
            rows={
              patient
                ? [
                    {
                      patient: `${patient.utilisateur?.prenom || ''} ${patient.utilisateur?.nom || ''}`.trim(),
                      dossier: patient.id_dossier_medical || '',
                      groupe: patient.groupe_sanguin || '',
                    },
                  ]
                : []
            }
            columns={[
              { key: 'patient', label: 'Patient', value: (r) => r.patient },
              { key: 'dossier', label: 'Dossier', value: (r) => r.dossier },
              { key: 'groupe', label: 'Groupe sanguin', value: (r) => r.groupe },
            ]}
          />
        }
      />

      {photoMessage ? <Text style={{ color: colors.success, marginBottom: 12 }}>{photoMessage}</Text> : null}

      <PatientForm title="Informations personnelles" onSubmit={onFormSubmit} />
      <AppInput
        label="Date de naissance"
        value={dateNaissance}
        onChangeText={setDateNaissance}
        placeholder="DD/MM/YYYY"
      />
      <AppInput
        label="Poids (kg)"
        value={poids}
        onChangeText={setPoids}
        placeholder="70.5"
        keyboardType="decimal-pad"
      />
      <ImageUploadField
        title="Photo du patient"
        subtitle="Sélection locale pour controle visuel du dossier"
        imageUri={photoUri}
        onUpload={handleLocalPhoto}
        placeholderEmoji="P"
      />
    </ScreenWrapper>
  );
}
