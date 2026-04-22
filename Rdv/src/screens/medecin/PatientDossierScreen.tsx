import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { patientsApi } from '../../api/patients.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PatientCard } from '../../components/rdv/PatientCard';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppCard } from '../../components/ui/AppCard';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Patient, RendezVous } from '../../types/models.types';
import { formatDate, formatTime } from '../../utils/formatters';

export function PatientDossierScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const { colors } = useTheme();
  const patientId = Number(route?.params?.id_patient ?? route?.params?.id_user);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDossier = useCallback(async () => {
    if (!Number.isFinite(patientId) || patientId <= 0) {
      setPatient(null);
      setRendezVous([]);
      setError('Identifiant patient invalide.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const [patientResponse, rdvResponse] = await Promise.all([
        patientsApi.getOne(patientId),
        patientsApi.getRendezVous(patientId, { limit: 100 }),
      ]);

      setPatient((patientResponse.data?.data ?? patientResponse.data) as Patient);
      const payload = (rdvResponse.data as PaginatedResponse<RendezVous>) || { data: [] };
      setRendezVous(payload.data || []);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger le dossier patient.');
    } finally {
      setLoading(false);
    }
  }, [patientId]);

  useEffect(() => {
    fetchDossier();
  }, [fetchDossier]);

  const exportRows = useMemo(
    () =>
      rendezVous.map((rdv) => ({
        patient: `${patient?.utilisateur?.prenom || ''} ${patient?.utilisateur?.nom || ''}`.trim(),
        dossier: patient?.id_dossier_medical || '',
        groupe: patient?.groupe_sanguin || '',
        date: formatDate(rdv.date_heure_rdv),
        heure: formatTime(rdv.date_heure_rdv),
        statut: rdv.statut_rdv,
        motif: rdv.motif || '',
      })),
    [patient, rendezVous]
  );

  return (
    <ScreenWrapper scroll onRefresh={fetchDossier} refreshing={loading}>
      <AppHeader
        title="Dossier patient"
        subtitle={patient?.id_dossier_medical ? `Dossier ${patient.id_dossier_medical}` : 'Suivi du patient'}
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export dossier patient"
            rows={exportRows}
            filters={{ Patient: patient ? `${patient.utilisateur?.prenom || ''} ${patient.utilisateur?.nom || ''}`.trim() : '' }}
            columns={[
              { key: 'patient', label: 'Patient', value: (r) => r.patient },
              { key: 'dossier', label: 'Dossier', value: (r) => r.dossier },
              { key: 'groupe', label: 'Groupe sanguin', value: (r) => r.groupe },
              { key: 'date', label: 'Date', value: (r) => r.date },
              { key: 'heure', label: 'Heure', value: (r) => r.heure },
              { key: 'statut', label: 'Statut', value: (r) => r.statut },
              { key: 'motif', label: 'Motif', value: (r) => r.motif },
            ]}
          />
        }
      />

      {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

      {loading && !patient ? (
        <AppLoader message="Chargement du dossier patient..." />
      ) : patient ? (
        <>
          <PatientCard patient={patient} subtitle={patient.utilisateur?.email} />

          <AppCard title="Synthese">
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text }}>Dossier: {patient.id_dossier_medical || 'Non renseigne'}</Text>
              <Text style={{ color: colors.text }}>Groupe sanguin: {patient.groupe_sanguin || 'Non renseigne'}</Text>
              <Text style={{ color: colors.text }}>Rendez-vous affiches: {rendezVous.length}</Text>
            </View>
          </AppCard>

          <AppCard title="Historique des rendez-vous">
            {rendezVous.length === 0 ? (
              <AppEmpty subtitle="Aucun rendez-vous lie a ce patient pour ce medecin." onRetry={fetchDossier} />
            ) : (
              <View style={{ gap: 12 }}>
                {rendezVous.map((rdv) => (
                  <RdvCard key={rdv.id_rdv} rdv={rdv} />
                ))}
              </View>
            )}
          </AppCard>
        </>
      ) : (
        <AppEmpty subtitle="Patient introuvable." onRetry={fetchDossier} />
      )}
    </ScreenWrapper>
  );
}
