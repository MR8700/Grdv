import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { rdvApi } from '../../api/rendezVous.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { AppPagination } from '../../components/shared/AppPagination';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppIcon } from '../../components/ui/AppIcon';
import { AppInput } from '../../components/ui/AppInput';
import { AppLoader } from '../../components/ui/AppLoader';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { RendezVous } from '../../types/models.types';
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

function SelectionToggle({
  selected,
  label,
  onPress,
}: {
  selected: boolean;
  label: string;
  onPress: () => void;
}) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingVertical: 2,
      }}
    >
      <AppIcon
        name={selected ? 'checkbox' : 'square-outline'}
        size={20}
        color={selected ? colors.primary : colors.textMuted}
      />
      <Text style={{ color: colors.text, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function RendezVousAdminScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const [items, setItems] = useState<RendezVous[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
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

  useEffect(() => {
    pageRef.current = 1;
    fetchRendezVous(1);
  }, [fetchRendezVous, statusFilter]);

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

  const exportSelection = useCallback(async () => {
    if (selectedRows.length === 0) {
      Toast.info('Export PDF', 'Selectionnez au moins un rendez-vous.', 1800);
      return;
    }

    try {
      await exportToPdfAndShare({
        title: 'Export rendez-vous administrateur',
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

  const renderItem = useCallback(
    ({ item, index }: { item: RendezVous; index: number }) => (
      <RdvCard
        rdv={item}
        index={index}
        actions={
          <SelectionToggle
            selected={selectedIds.includes(item.id_rdv)}
            label={selectedIds.includes(item.id_rdv) ? 'Selectionne pour export' : 'Ajouter a la selection'}
            onPress={() => toggleSelection(item.id_rdv)}
          />
        }
      />
    ),
    [selectedIds, toggleSelection]
  );

  const listHeader = useMemo(
    () => (
      <>
        <AppHeader
          title="Tous les rendez-vous"
          subtitle="Vue globale et export PDF"
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
          rightActions={<AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportSelection} />}
        />
        <AppDropdown label="Filtrer par statut" value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />
        <AppInput label="Recherche rapide" value={search} onChangeText={setSearch} placeholder="Patient, medecin, motif ou ID" />
        <View
          style={{
            marginBottom: 14,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}
        >
          <SelectionToggle selected={allVisibleSelected} label="Tout cocher sur la page" onPress={toggleSelectAll} />
          <Text style={{ color: colors.textMuted, fontWeight: '600' }}>{selectedRows.length} selection(s)</Text>
        </View>
        {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}
      </>
    ),
    [allVisibleSelected, colors.danger, colors.textMuted, error, exportSelection, navigation, search, selectedRows.length, statusFilter, toggleSelectAll]
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
        />
      )}
    </ScreenWrapper>
  );
}
