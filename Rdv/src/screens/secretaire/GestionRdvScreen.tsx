import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { rdvApi } from '../../api/rendezVous.api';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { AppPagination } from '../../components/shared/AppPagination';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PatientDetailsModal } from '../../components/rdv/PatientDetailsModal';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppIcon } from '../../components/ui/AppIcon';
import { AppInput } from '../../components/ui/AppInput';
import { AppLoader } from '../../components/ui/AppLoader';
import { Toast } from '../../components/ui/AppAlert';
import { useAppSettings } from '../../store/AppSettingsContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Patient, RendezVous } from '../../types/models.types';
import { formatDate, formatTime } from '../../utils/formatters';
import { exportToPdfAndShare, getPdfExportErrorMessage } from '../../utils/pdfExport';

const STATUS_OPTIONS = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'En attente', value: 'en_attente' },
  { label: 'Confirme', value: 'confirme' },
  { label: 'Refuse', value: 'refuse' },
  { label: 'Annule', value: 'annule' },
  { label: 'Archive', value: 'archive' },
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
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const pageRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchRendezVous = useCallback(async (targetPage = pageRef.current) => {
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
      setSelectedIds((current) => current.filter((id) => payload.data.some((item) => item.id_rdv === id)));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les rendez-vous.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

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

  const selectedRows = useMemo(
    () => filteredItems.filter((item) => selectedIds.includes(item.id_rdv)),
    [filteredItems, selectedIds]
  );

  const allVisibleSelected = filteredItems.length > 0 && filteredItems.every((item) => selectedIds.includes(item.id_rdv));

  const toggleSelection = useCallback((id: number) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !filteredItems.some((item) => item.id_rdv === id));
      }

      const merged = new Set(current);
      filteredItems.forEach((item) => merged.add(item.id_rdv));
      return Array.from(merged);
    });
  }, [allVisibleSelected, filteredItems]);

  const exportFiltered = useCallback(async () => {
    if (selectedRows.length === 0) {
      Toast.info('Export PDF', 'Selectionnez au moins un rendez-vous.', 1800);
      return;
    }

    try {
      await exportToPdfAndShare({
        title: 'Export rendez-vous secretaire',
        rows: selectedRows,
        filters: {
          Page: page,
          Statut: statusFilter === 'all' ? 'Tous' : statusFilter,
          Recherche: search || 'Aucune',
          Selection: selectedRows.length,
        },
        columns: [
          { key: 'id', label: 'ID', value: (r) => r.id_rdv },
          { key: 'date', label: 'Date', value: (r) => formatDate(r.date_heure_rdv) },
          { key: 'heure', label: 'Heure', value: (r) => formatTime(r.date_heure_rdv) },
          { key: 'statut', label: 'Statut', value: (r) => r.statut_rdv },
          { key: 'patient', label: 'Patient', value: (r) => `${r.patient?.utilisateur?.prenom || ''} ${r.patient?.utilisateur?.nom || ''}`.trim() },
          { key: 'medecin', label: 'Medecin', value: (r) => `${r.medecin?.utilisateur?.prenom || ''} ${r.medecin?.utilisateur?.nom || ''}`.trim() },
          { key: 'motif', label: 'Motif', value: (r) => r.motif || '' },
        ],
      });
      Toast.success('PDF pret', `${selectedRows.length} rendez-vous exporte(s).`);
    } catch (exportError) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(exportError));
    }
  }, [page, search, selectedRows, statusFilter]);

  const updateStatus = useCallback(async (id: number, statut_rdv: 'confirme' | 'refuse' | 'archive') => {
    const target = items.find((rdv) => rdv.id_rdv === id);

    try {
      setBusyId(id);
      setError(null);
      await rdvApi.updateStatut(id, {
        statut_rdv,
        motif_refus: statut_rdv === 'refuse' ? 'Refus saisi depuis l ecran secretaire.' : undefined,
      });

      Toast.success(
        'Statut mis a jour',
        statut_rdv === 'confirme'
          ? 'Rendez-vous confirme.'
          : statut_rdv === 'refuse'
            ? 'Rendez-vous refuse.'
            : 'Rendez-vous archive.'
      );
      await fetchRendezVous(pageRef.current);
    } catch (err: any) {
      const message =
        err?.response?.data?.message ??
        `Mise a jour du rendez-vous ${target ? `du ${formatDate(target.date_heure_rdv)} a ${formatTime(target.date_heure_rdv)}` : ''} impossible.`;
      setError(message);
      Toast.error('Action impossible', message);
    } finally {
      setBusyId(null);
    }
  }, [fetchRendezVous, items]);

  useEffect(() => {
    pageRef.current = 1;
    fetchRendezVous(1);
  }, [fetchRendezVous, statusFilter]);

  const renderItem = useCallback(
    ({ item, index }: { item: RendezVous; index: number }) => (
      <View>
        <RdvCard
          rdv={item}
          index={index}
          actions={
            <View style={{ gap: 10 }}>
              {item.patient ? (
                <TouchableOpacity onPress={() => setSelectedPatient(item.patient || null)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <AppIcon name="person-circle-outline" size={20} color={colors.primary} />
                  <Text style={{ color: colors.text, fontWeight: '600' }}>Voir le patient</Text>
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity onPress={() => toggleSelection(item.id_rdv)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <AppIcon
                  name={selectedIds.includes(item.id_rdv) ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={selectedIds.includes(item.id_rdv) ? colors.primary : colors.textMuted}
                />
                <Text style={{ color: colors.text, fontWeight: '600' }}>
                  {selectedIds.includes(item.id_rdv) ? 'Selectionne pour export' : 'Ajouter a la selection'}
                </Text>
              </TouchableOpacity>
            </View>
          }
        />
        {item.statut_rdv === 'en_attente' ? (
          <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
            <View style={{ flex: 1 }}>
              <AppButton
                label="Confirmer"
                fullWidth
                loading={busyId === item.id_rdv}
                onPress={() => updateStatus(item.id_rdv, 'confirme')}
              />
            </View>
            <View style={{ flex: 1 }}>
              <AppButton
                label="Refuser"
                variant="outline"
                fullWidth
                loading={busyId === item.id_rdv}
                onPress={() => updateStatus(item.id_rdv, 'refuse')}
              />
            </View>
          </View>
        ) : null}
        {item.statut_rdv === 'confirme' ? (
          <View style={{ marginBottom: 16 }}>
            <AppButton
              label="Archiver"
              variant="outline"
              fullWidth
              loading={busyId === item.id_rdv}
              onPress={() => updateStatus(item.id_rdv, 'archive')}
            />
          </View>
        ) : null}
      </View>
    ),
    [busyId, colors.primary, colors.text, colors.textMuted, selectedIds, toggleSelection, updateStatus]
  );

  const listHeader = useMemo(
    () => (
      <>
        <AppHeader
          title="Gestion des rendez-vous"
          subtitle="Validation et suivi depuis /rendez-vous"
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
          rightActions={exportAllowed ? <AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportFiltered} /> : undefined}
        />

        <AppDropdown label="Filtrer par statut" value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />
        <AppInput label="Recherche rapide" value={search} onChangeText={setSearch} placeholder="Patient, medecin, motif ou ID" />
        <TouchableOpacity onPress={toggleSelectAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <AppIcon name={allVisibleSelected ? 'checkbox' : 'square-outline'} size={20} color={allVisibleSelected ? colors.primary : colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {allVisibleSelected ? 'Tout decocher sur la page' : 'Tout cocher sur la page'} ({selectedRows.length})
          </Text>
        </TouchableOpacity>

        {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}
      </>
    ),
    [allVisibleSelected, colors.danger, colors.primary, colors.text, colors.textMuted, error, exportAllowed, exportFiltered, navigation, search, selectedRows.length, statusFilter, toggleSelectAll]
  );

  return (
    <ScreenWrapper scroll={false}>
      {loading && items.length === 0 ? (
        <>
          {listHeader}
          <AppLoader message="Chargement des rendez-vous..." />
        </>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id_rdv)}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={() => fetchRendezVous(pageRef.current)}
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            filteredItems.length > 0 ? (
              <AppPagination
                page={page}
                totalPages={totalPages}
                onPrev={() => fetchRendezVous(page - 1)}
                onNext={() => fetchRendezVous(page + 1)}
              />
            ) : null
          }
          ListEmptyComponent={<AppEmpty onRetry={() => fetchRendezVous(1)} subtitle="Aucun rendez-vous disponible pour ce filtre." />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 126 }}
          removeClippedSubviews
          initialNumToRender={6}
          maxToRenderPerBatch={8}
          windowSize={7}
        />
      )}
      <PatientDetailsModal patient={selectedPatient} visible={Boolean(selectedPatient)} onClose={() => setSelectedPatient(null)} />
    </ScreenWrapper>
  );
}
