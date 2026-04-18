import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { dispoApi } from '../../api/disponibilites.api';
import { medecinsApi } from '../../api/medecins.api';
import { servicesApi } from '../../api/services.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { AppSnackbar } from '../../components/shared/AppSnackbar';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppLoader } from '../../components/ui/AppLoader';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Disponibilite, Medecin, Service } from '../../types/models.types';
import { REFRESH_INTERVALS } from '../../utils/constants';
import { formatDateTime } from '../../utils/formatters';

const getToday = () => new Date().toISOString().slice(0, 10);

const buildIsoDateTime = (date: string, time: string) => {
  if (!date || !time) return '';
  return `${date}T${time}:00`;
};

export function DisponibilitesScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isSecretary = user?.type_user === 'secretaire';
  const [items, setItems] = useState<Disponibilite[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [selectedMedecinId, setSelectedMedecinId] = useState<string>(user?.id_user ? String(user.id_user) : '');
  const [serviceId, setServiceId] = useState<string>('all');
  const [createServiceId, setCreateServiceId] = useState<string>('all');
  const [dateValue, setDateValue] = useState(getToday());
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [capacityValue, setCapacityValue] = useState('1');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyDeleteId, setBusyDeleteId] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const effectiveMedecinId = selectedMedecinId || (user?.id_user ? String(user.id_user) : '');

  const fetchDisponibilites = useCallback(async () => {
    if (!user || !effectiveMedecinId) return;

    try {
      setLoading(true);
      setError(null);
      const dispoRequest = dispoApi.getAll({
        id_medecin: effectiveMedecinId,
        id_service: serviceId === 'all' ? undefined : serviceId,
        limit: 50,
      });
      const servicesRequest = servicesApi.getAll({ limit: 50 });
      const medecinsRequest = isSecretary ? medecinsApi.getAll({ limit: 50, delegated_only: true }) : null;

      const [dispoResponse, servicesResponse, medecinsResponse] = await Promise.all([
        dispoRequest,
        servicesRequest,
        medecinsRequest,
      ]);

      const dispoPayload = dispoResponse.data as PaginatedResponse<Disponibilite>;
      const servicesPayload = servicesResponse.data as PaginatedResponse<Service>;
      setItems(dispoPayload.data);
      setServices(servicesPayload.data);

      if (medecinsResponse) {
        const doctorsPayload = medecinsResponse.data as PaginatedResponse<Medecin>;
        const doctorRows = doctorsPayload.data || [];
        setMedecins(doctorRows);
        if (!selectedMedecinId && doctorRows[0]) {
          setSelectedMedecinId(String(doctorRows[0].id_user));
        }
      }
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les disponibilites.');
    } finally {
      setLoading(false);
    }
  }, [effectiveMedecinId, isSecretary, selectedMedecinId, serviceId, user]);

  const createDisponibilite = useCallback(async () => {
    if (!user || !effectiveMedecinId) return;

    const date_heure_debut = buildIsoDateTime(dateValue, startTime);
    const date_heure_fin = buildIsoDateTime(dateValue, endTime);

    if (!date_heure_debut || !date_heure_fin) {
      setError('Renseignez la date et les horaires du creneau.');
      return;
    }

    if (date_heure_fin <= date_heure_debut) {
      setError("L'heure de fin doit etre posterieure a l'heure de debut.");
      return;
    }

    const parsedCapacity = Number(capacityValue);
    if (!Number.isInteger(parsedCapacity) || parsedCapacity < 1 || parsedCapacity > 50) {
      setError('La capacite doit etre un entier entre 1 et 50.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      await dispoApi.create({
        id_medecin: Number(effectiveMedecinId),
        id_service: createServiceId === 'all' ? undefined : Number(createServiceId),
        capacite_max: parsedCapacity,
        date_heure_debut,
        date_heure_fin,
      });
      setMessage('Creneau cree avec succes.');
      setDateValue(getToday());
      setStartTime('08:00');
      setEndTime('12:00');
      setCapacityValue('1');
      setShowForm(false);
      await fetchDisponibilites();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Creation du creneau impossible.');
    } finally {
      setSaving(false);
    }
  }, [capacityValue, createServiceId, dateValue, effectiveMedecinId, endTime, fetchDisponibilites, startTime, user]);

  const removeDisponibilite = useCallback(async (id_dispo: number) => {
    try {
      setBusyDeleteId(id_dispo);
      setError(null);
      await dispoApi.remove(id_dispo);
      setMessage('Creneau supprime avec succes.');
      await fetchDisponibilites();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Suppression du creneau impossible.');
    } finally {
      setBusyDeleteId(null);
    }
  }, [fetchDisponibilites]);

  React.useEffect(() => {
    if (user?.id_user && !isSecretary) {
      setSelectedMedecinId(String(user.id_user));
    }
  }, [isSecretary, user?.id_user]);

  React.useEffect(() => {
    fetchDisponibilites();
  }, [fetchDisponibilites]);

  useAutoRefresh(fetchDisponibilites, REFRESH_INTERVALS.DISPONIBILITES, !!user && !!effectiveMedecinId);

  const stats = useMemo(() => {
    const libres = items.filter((item) => item.est_libre).length;
    return {
      total: items.length,
      libres,
      occupes: items.length - libres,
    };
  }, [items]);

  const sortedItems = useMemo(
    () => [...items].sort((a, b) => new Date(a.date_heure_debut).getTime() - new Date(b.date_heure_debut).getTime()),
    [items]
  );

  const medecinLabel = useMemo(() => {
    const selected = medecins.find((item) => String(item.id_user) === effectiveMedecinId);
    return selected ? `${selected.utilisateur?.prenom || ''} ${selected.utilisateur?.nom || ''}`.trim() : '';
  }, [effectiveMedecinId, medecins]);

  return (
    <ScreenWrapper scroll onRefresh={fetchDisponibilites} refreshing={loading}>
      <AppHeader
        title="Disponibilites"
        subtitle={isSecretary ? 'Creneaux des medecins delegues' : 'Vos creneaux et votre planning quotidien'}
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PdfExportButton
              title="Export de disponibilites"
              rows={items}
              filters={{
                Medecin: medecinLabel || effectiveMedecinId || 'Non defini',
                Service: serviceId === 'all' ? 'Tous' : serviceId,
              }}
              columns={[
                { key: 'id', label: 'ID', value: (d) => d.id_dispo },
                { key: 'service', label: 'Service', value: (d) => d.service?.nom_service || '' },
                { key: 'debut', label: 'Debut', value: (d) => formatDateTime(d.date_heure_debut) },
                { key: 'fin', label: 'Fin', value: (d) => formatDateTime(d.date_heure_fin) },
                { key: 'libre', label: 'Libre', value: (d) => (d.est_libre ? 'Oui' : 'Non') },
              ]}
            />
            <AppButton
              label={showForm ? 'Fermer' : 'Nouveau'}
              size="sm"
              variant="ghost"
              onPress={() => setShowForm((current) => !current)}
            />
          </View>
        }
      />

      <AppSnackbar visible={!!message} message={message ?? ''} variant="success" />
      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      {isSecretary ? (
        <AppDropdown
          label="Medecin"
          value={effectiveMedecinId}
          onValueChange={setSelectedMedecinId}
          options={medecins.map((medecin) => ({
            label: `${medecin.utilisateur?.prenom || ''} ${medecin.utilisateur?.nom || ''}`.trim() || `Medecin #${medecin.id_user}`,
            value: String(medecin.id_user),
          }))}
        />
      ) : null}

      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 4 }}>
        <AppCard style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Creneaux</Text>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{stats.total}</Text>
        </AppCard>
        <AppCard style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Libres</Text>
          <Text style={{ color: colors.success, fontSize: 22, fontWeight: '800' }}>{stats.libres}</Text>
        </AppCard>
        <AppCard style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 12, marginBottom: 6 }}>Occupes</Text>
          <Text style={{ color: colors.warning, fontSize: 22, fontWeight: '800' }}>{stats.occupes}</Text>
        </AppCard>
      </View>

      <AppDropdown
        label="Filtrer par service"
        value={serviceId}
        onValueChange={setServiceId}
        options={[
          { label: 'Tous les services', value: 'all' },
          ...services.map((service) => ({ label: service.nom_service, value: String(service.id_service) })),
        ]}
      />

      {showForm && (
        <AppCard title="Ajouter un creneau" subtitle="Saisissez une date et une plage horaire">
          <AppDropdown
            label="Service"
            value={createServiceId}
            onValueChange={setCreateServiceId}
            options={[
              { label: 'Sans service specifique', value: 'all' },
              ...services.map((service) => ({ label: service.nom_service, value: String(service.id_service) })),
            ]}
          />
          <AppInput label="Date" value={dateValue} onChangeText={setDateValue} placeholder="YYYY-MM-DD" />
          <View style={{ flexDirection: 'row', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <AppInput label="Debut" value={startTime} onChangeText={setStartTime} placeholder="08:00" />
            </View>
            <View style={{ flex: 1 }}>
              <AppInput label="Fin" value={endTime} onChangeText={setEndTime} placeholder="09:00" />
            </View>
          </View>
          <AppInput
            label="Capacite"
            value={capacityValue}
            onChangeText={setCapacityValue}
            placeholder="1"
            keyboardType="number-pad"
          />
          <Text style={{ color: colors.textMuted, marginBottom: 12 }}>
            Choisissez une capacite superieure a 1 si plusieurs patients peuvent reserver ce creneau.
          </Text>
          <AppButton
            label={saving ? 'Creation...' : 'Creer le creneau'}
            fullWidth
            loading={saving}
            disabled={!effectiveMedecinId}
            onPress={createDisponibilite}
          />
        </AppCard>
      )}

      {loading && items.length === 0 ? (
        <AppLoader message="Chargement des disponibilites..." />
      ) : sortedItems.length === 0 ? (
        <AppEmpty
          title="Aucun creneau"
          subtitle={
            isSecretary
              ? 'Aucun creneau disponible pour ce medecin ou ce filtre.'
              : 'Ajoutez un premier creneau pour construire votre planning.'
          }
          onRetry={fetchDisponibilites}
        />
      ) : (
        sortedItems.map((item) => (
          <AppCard
            key={item.id_dispo}
            title={item.service?.nom_service ?? 'Service non renseigne'}
            subtitle={formatDateTime(item.date_heure_debut)}
            style={{ marginBottom: 12 }}
          >
            <Text style={{ color: colors.textMuted }}>Fin: {formatDateTime(item.date_heure_fin)}</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>Capacite maximale: {item.capacite_max}</Text>
            <Text style={{ color: item.est_libre ? colors.success : colors.warning, marginTop: 6, fontWeight: '600' }}>
              {item.est_libre ? 'Disponible pour reservation' : 'Occupe ou deja reserve'}
            </Text>
            <View style={{ marginTop: 12 }}>
              <AppButton
                label={busyDeleteId === item.id_dispo ? 'Suppression...' : 'Supprimer'}
                variant="outline"
                fullWidth
                loading={busyDeleteId === item.id_dispo}
                onPress={() => removeDisponibilite(item.id_dispo)}
              />
            </View>
          </AppCard>
        ))
      )}
    </ScreenWrapper>
  );
}
