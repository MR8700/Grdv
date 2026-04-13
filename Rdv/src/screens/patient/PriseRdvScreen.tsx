import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { AxiosError } from 'axios';
import { dispoApi } from '../../api/disponibilites.api';
import { medecinsApi } from '../../api/medecins.api';
import { rdvApi } from '../../api/rendezVous.api';
import { servicesApi } from '../../api/services.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { DispoSlot } from '../../components/rdv/DispoSlot';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { AppSnackbar } from '../../components/shared/AppSnackbar';
import { AppButton } from '../../components/ui/AppButton';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppLoader } from '../../components/ui/AppLoader';
import { AppCard } from '../../components/ui/AppCard';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Disponibilite, Medecin, Service } from '../../types/models.types';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { formatDateTime } from '../../utils/formatters';
 
export function PriseRdvScreen({ navigation, route }: { navigation?: any; route?: any }) {
  const { colors } = useTheme();
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [medecinId, setMedecinId] = useState<string>('');
  const [serviceId, setServiceId] = useState<string>('all');
  const [selectedDispo, setSelectedDispo] = useState<Disponibilite | null>(null);
  const [motif, setMotif] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchInitialData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [medecinsResponse, servicesResponse] = await Promise.all([
        medecinsApi.getAll({ limit: 50 }),
        servicesApi.getAll({ limit: 50 }),
      ]);
      const medecinsPayload = medecinsResponse.data as PaginatedResponse<Medecin>;
      const servicesPayload = servicesResponse.data as PaginatedResponse<Service>;
      setMedecins(medecinsPayload.data);
      setServices(servicesPayload.data);
      const routeMedecinId = route?.params?.medecinId ? String(route.params.medecinId) : '';
      const preferredMedecin = medecinsPayload.data.find((item) => String(item.id_user) === routeMedecinId);
      if (preferredMedecin) {
        setMedecinId(String(preferredMedecin.id_user));
      } else if (medecinsPayload.data[0]) {
        setMedecinId(String(medecinsPayload.data[0].id_user));
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les médecins et services.');
    } finally {
      setLoading(false);
    }
  }, [route?.params?.medecinId]);

  const fetchDisponibilites = useCallback(async () => {
    if (!medecinId) return;
    try {
      setError(null);
      const response = await dispoApi.getAll({
        id_medecin: medecinId,
        id_service: serviceId === 'all' ? undefined : serviceId,
        libre_seulement: true,
        limit: 20,
      });
      const payload = response.data as PaginatedResponse<Disponibilite>;
      setDisponibilites(payload.data);
      setSelectedDispo((current) => payload.data.find((item) => item.id_dispo === current?.id_dispo) ?? null);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les créneaux.');
    }
  }, [medecinId, serviceId]);

  React.useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  React.useEffect(() => {
    fetchDisponibilites();
  }, [fetchDisponibilites]);

  React.useEffect(() => {
    setSelectedDispo(null);
    setMessage(null);
  }, [medecinId, serviceId]);

  const selectedMedecin = useMemo(
    () => medecins.find((item) => String(item.id_user) === medecinId),
    [medecinId, medecins]
  );

  const sortedDisponibilites = useMemo(
    () => [...disponibilites].sort((a, b) => new Date(a.date_heure_debut).getTime() - new Date(b.date_heure_debut).getTime()),
    [disponibilites]
  );

  const submit = useCallback(async () => {
    if (!selectedDispo) {
      setError('Selectionnez un créneau avant de continuer.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);
      await rdvApi.create({
        id_dispo: selectedDispo.id_dispo,
        id_medecin: selectedDispo.id_medecin,
        date_heure_rdv: selectedDispo.date_heure_debut,
        motif,
      });
      setMessage('Votre demande de rendez-vous a été envoyée.');
      setMotif('');
      setSelectedDispo(null);
      await fetchDisponibilites();
      navigation?.navigate?.('MesRdv');
    } catch (err) {
      const errorValue = err as AxiosError<{ message?: string }>;
      setError(errorValue.response?.data?.message ?? 'Création du rendez-vous impossible.');
    } finally {
      setSubmitting(false);
    }
  }, [fetchDisponibilites, motif, navigation, selectedDispo]);

  return (
    <ScreenWrapper scroll onRefresh={fetchDisponibilites} refreshing={loading}>
      <AppHeader
        title="Prendre un rendez-vous"
        subtitle="Sélection d'un créneau via les créneaux disponibles"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export prise de rendez-vous"
            rows={disponibilites}
            filters={{
              Medecin: selectedMedecin ? `${selectedMedecin.utilisateur?.prenom || ''} ${selectedMedecin.utilisateur?.nom || ''}`.trim() : 'Non choisi',
              Service: serviceId === 'all' ? 'Tous' : serviceId,
              Selection: selectedDispo ? String(selectedDispo.id_dispo) : 'Aucune',
            }}
            columns={[
              { key: 'id', label: 'ID', value: (d) => d.id_dispo },
              { key: 'debut', label: 'Début', value: (d) => formatDateTime(d.date_heure_debut) },
              { key: 'fin', label: 'Fin', value: (d) => formatDateTime(d.date_heure_fin) },
              { key: 'libre', label: 'Libre', value: (d) => (d.est_libre ? 'Oui' : 'Non') },
              { key: 'service', label: 'Service', value: (d) => d.service?.nom_service || '' },
            ]}
          />
        }
      />
      <AppSnackbar visible={!!message} message={message ?? ''} variant="success" />
      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}
      {loading ? (
        <AppLoader message="Chargement des disponibilités..." />
      ) : (
        <>
          <AppDropdown
            label="Medecin"
            value={medecinId}
            onValueChange={setMedecinId}
            options={medecins.map((medecin) => ({
              label: `${medecin.utilisateur?.prenom ?? ''} ${medecin.utilisateur?.nom ?? ''}`.trim(),
              value: String(medecin.id_user),
            }))}
          />
          <AppDropdown
            label="Service"
            value={serviceId}
            onValueChange={setServiceId}
            options={[
              { label: 'Tous les services', value: 'all' },
              ...services.map((service) => ({ label: service.nom_service, value: String(service.id_service) })),
            ]}
          />
          <AppCard
            title="Creneaux disponibles"
            subtitle={
              sortedDisponibilites.length > 0
                ? `${sortedDisponibilites.length} créneau(x) trouvés`
                : 'Aucun créneau libre pour ce filtre'
            }
          >
            {sortedDisponibilites.length === 0 ? (
              <AppEmpty
                title="Aucun créneau disponible"
                subtitle="Veuillez contacter un médecin ou un administrateur pour trouver un autre horaire."
                onRetry={fetchDisponibilites}
              />
            ) : (
              <View
                style={{
                  marginTop: 4,
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  alignItems: 'flex-start',
                }}
              >
                {sortedDisponibilites.map((item) => (
                  <DispoSlot
                    key={item.id_dispo}
                    dispo={item}
                    selected={selectedDispo?.id_dispo === item.id_dispo}
                    onSelect={setSelectedDispo}
                  />
                ))}
              </View>
            )}
          </AppCard>
          {selectedDispo && (
            <AppCard title="Sélection actuelle" subtitle={formatDateTime(selectedDispo.date_heure_debut)}>
              <Text style={{ color: colors.textMuted }}>
                Fin: {formatDateTime(selectedDispo.date_heure_fin)}
                {selectedDispo.service?.nom_service ? ` | Service: ${selectedDispo.service.nom_service}` : ''}
              </Text>
            </AppCard>
          )}
          <AppInput
            label="Motif"
            value={motif}
            onChangeText={setMotif}
            multiline
            numberOfLines={3}
          />
          {selectedMedecin && (
            <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
              Medecin choisi: {selectedMedecin.utilisateur?.prenom} {selectedMedecin.utilisateur?.nom}
            </Text>
          )}
          <AppButton
            label="Confirmer la demande"
            fullWidth
            loading={submitting}
            disabled={!selectedDispo || submitting}
            onPress={submit}
          />
        </>
      )}
    </ScreenWrapper>
  );
}
