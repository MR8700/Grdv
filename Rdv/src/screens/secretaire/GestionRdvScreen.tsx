import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import { rdvApi } from '../../api/rendezVous.api';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { AppPagination } from '../../components/shared/AppPagination';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppLoader } from '../../components/ui/AppLoader';
import { Toast } from '../../components/ui/AppAlert';
import { useAppSettings } from '../../store/AppSettingsContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { RendezVous } from '../../types/models.types';
import { formatDate, formatTime } from '../../utils/formatters';
import { exportToPdfAndShare, getPdfExportErrorMessage } from '../../utils/pdfExport';

const STATUS_OPTIONS = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'En attente', value: 'en_attente' },
  { label: 'Confirmé', value: 'confirme' },
  { label: 'Refusé', value: 'refuse' },
  { label: 'Annulé', value: 'annule' },
  { label: 'Archivé', value: 'archive' },
];

export function GestionRdvScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { currentRole, rolePreferences } = useAppSettings();
  const exportAllowed = rolePreferences[currentRole]?.exportEnabled !== false;
  const [items, setItems] = useState<RendezVous[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const pageRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchRendezVous = useCallback(
    async (targetPage = pageRef.current) => {
      try {
        setLoading(true);
        setError(null);
        const response = await rdvApi.getAll({
          page: targetPage,
          limit: 10,
          statut_rdv: statusFilter === 'all' ? undefined : statusFilter,
        });
        const payload = response.data as PaginatedResponse<RendezVous>;
        setItems(payload.data);
        setPage(payload.meta.page);
        setTotalPages(payload.meta.totalPages || 1);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Impossible de charger les rendez-vous.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((rdv) => {
      const patient = `${rdv.patient?.utilisateur?.prenom || ''} ${rdv.patient?.utilisateur?.nom || ''}`.toLowerCase();
      const medecin = `${rdv.medecin?.utilisateur?.prenom || ''} ${rdv.medecin?.utilisateur?.nom || ''}`.toLowerCase();
      const motif = String(rdv.motif || '').toLowerCase();
      return patient.includes(query) || medecin.includes(query) || motif.includes(query) || String(rdv.id_rdv).includes(query);
    });
  }, [items, search]);

  const exportFiltered = useCallback(async () => {
    try {
      await exportToPdfAndShare({
        title: 'Export rendez-vous secrétaire',
        rows: filteredItems,
        filters: {
          Page: page,
          Statut: statusFilter === 'all' ? 'Tous' : statusFilter,
          Recherche: search || 'Aucune',
        },
        columns: [
          { key: 'id', label: 'ID', value: (r) => r.id_rdv },
          { key: 'date', label: 'Date', value: (r) => formatDate(r.date_heure_rdv) },
          { key: 'heure', label: 'Heure', value: (r) => formatTime(r.date_heure_rdv) },
          { key: 'statut', label: 'Statut', value: (r) => r.statut_rdv },
          { key: 'patient', label: 'Patient', value: (r) => `${r.patient?.utilisateur?.prenom || ''} ${r.patient?.utilisateur?.nom || ''}`.trim() },
          { key: 'medecin', label: 'Médecin', value: (r) => `${r.medecin?.utilisateur?.prenom || ''} ${r.medecin?.utilisateur?.nom || ''}`.trim() },
        ],
      });
      Toast.success('PDF prêt', `${filteredItems.length} rendez-vous exporté(s).`);
    } catch (exportError) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(exportError));
    }
  }, [filteredItems, page, search, statusFilter]);

  const updateStatus = useCallback(
    async (id: number, statut_rdv: 'confirme' | 'refuse') => {
      const target = items.find((rdv) => rdv.id_rdv === id);

      try {
        setBusyId(id);
        setError(null);

        await rdvApi.updateStatut(id, {
          statut_rdv,
          motif_refus: statut_rdv === 'refuse' ? 'Refus saisi depuis l’écran secrétaire.' : undefined,
        });

        Toast.success('Statut mis à jour', statut_rdv === 'confirme' ? 'Rendez-vous confirmé.' : 'Rendez-vous refusé.');
        await fetchRendezVous(page);
      } catch (err: any) {
        const message =
          err?.response?.data?.message ??
          `Mise à jour du rendez-vous ${target ? `du ${formatDate(target.date_heure_rdv)} à ${formatTime(target.date_heure_rdv)}` : ''} impossible.`;
        setError(message);
        Toast.error('Action impossible', message);
      } finally {
        setBusyId(null);
      }
    },
    [fetchRendezVous, items, page]
  );

  useEffect(() => {
    pageRef.current = 1;
    fetchRendezVous(1);
  }, [fetchRendezVous, statusFilter]);

  return (
    <ScreenWrapper scroll onRefresh={() => fetchRendezVous(page)} refreshing={loading}>
      <AppHeader
        title="Gestion des rendez-vous"
        subtitle="Validation et suivi depuis /rendez-vous"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={exportAllowed ? <AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportFiltered} /> : undefined}
      />

      <AppDropdown label="Filtrer par statut" value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />
      <AppInput label="Recherche rapide" value={search} onChangeText={setSearch} placeholder="Patient, médecin, motif ou ID" />

      {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}

      {loading && items.length === 0 ? (
        <AppLoader message="Chargement des rendez-vous..." />
      ) : filteredItems.length === 0 ? (
        <AppEmpty onRetry={() => fetchRendezVous(1)} subtitle="Aucun rendez-vous disponible pour ce filtre." />
      ) : (
        <>
          {filteredItems.map((rdv, index) => (
            <View key={rdv.id_rdv}>
              <RdvCard rdv={rdv} index={index} />
              {rdv.statut_rdv === 'en_attente' ? (
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      label="Confirmer"
                      fullWidth
                      loading={busyId === rdv.id_rdv}
                      onPress={() => updateStatus(rdv.id_rdv, 'confirme')}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <AppButton
                      label="Refuser"
                      variant="outline"
                      fullWidth
                      loading={busyId === rdv.id_rdv}
                      onPress={() => updateStatus(rdv.id_rdv, 'refuse')}
                    />
                  </View>
                </View>
              ) : null}
            </View>
          ))}

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => fetchRendezVous(page - 1)}
            onNext={() => fetchRendezVous(page + 1)}
          />
        </>
      )}
    </ScreenWrapper>
  );
}
