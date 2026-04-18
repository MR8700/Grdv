import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import { rdvApi } from '../../api/rendezVous.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppPagination } from '../../components/shared/AppPagination';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppIcon } from '../../components/ui/AppIcon';
import { AppInput } from '../../components/ui/AppInput';
import { AppLoader } from '../../components/ui/AppLoader';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { RendezVous } from '../../types/models.types';
import { formatDate, formatDateTime } from '../../utils/formatters';

function ArchiveAction({
  icon,
  label,
  onPress,
  danger = false,
}: {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginRight: 16 }}
    >
      <AppIcon name={icon} size={18} color={danger ? colors.danger : colors.primary} />
      <Text style={{ color: danger ? colors.danger : colors.primary, fontWeight: '700' }}>{label}</Text>
    </TouchableOpacity>
  );
}

export function ArchivesRdvScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const isAdmin = user?.type_user === 'administrateur';
  const [items, setItems] = useState<RendezVous[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const pageRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchArchives = useCallback(async (targetPage = pageRef.current) => {
    try {
      setLoading(true);
      setError(null);
      const response = await rdvApi.getArchives({ page: targetPage, limit: 10 });
      const payload = response.data as PaginatedResponse<RendezVous>;
      setItems(payload.data);
      setPage(payload.meta.page);
      setTotalPages(payload.meta.totalPages || 1);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les archives.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchArchives(1);
  }, [fetchArchives]);

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

  const resetDelay = useCallback(async (id: number) => {
    try {
      setBusyId(id);
      await rdvApi.resetArchiveDelay(id);
      Toast.success('Archive reaffichee', 'Le delai a ete reinitialise pour cet element.');
      await fetchArchives(pageRef.current);
    } catch (err: any) {
      Toast.error('Action impossible', err?.response?.data?.message ?? 'Reinitialisation impossible.');
    } finally {
      setBusyId(null);
    }
  }, [fetchArchives]);

  const permanentDelete = useCallback(async (id: number) => {
    try {
      setBusyId(id);
      await rdvApi.permanentDelete(id);
      Toast.success('Suppression definitive', 'Le rendez-vous archive a ete supprime.');
      await fetchArchives(pageRef.current);
    } catch (err: any) {
      Toast.error('Suppression impossible', err?.response?.data?.message ?? 'Suppression definitive impossible.');
    } finally {
      setBusyId(null);
    }
  }, [fetchArchives]);

  const renderItem = useCallback(
    ({ item, index }: { item: RendezVous; index: number }) => (
      <RdvCard
        rdv={item}
        index={index}
        actions={
          <View style={{ gap: 10 }}>
            <Text style={{ color: colors.textMuted }}>
              Archive le {item.date_archivage ? formatDateTime(item.date_archivage) : formatDate(item.date_heure_rdv)}
            </Text>
            {isAdmin ? (
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <ArchiveAction icon="refresh-outline" label={busyId === item.id_rdv ? 'Reinitialisation...' : 'Reinitialiser le delai'} onPress={() => resetDelay(item.id_rdv)} />
                <ArchiveAction icon="trash-outline" label={busyId === item.id_rdv ? 'Suppression...' : 'Supprimer definitivement'} onPress={() => permanentDelete(item.id_rdv)} danger />
              </View>
            ) : (
              <Text style={{ color: colors.textMuted }}>
                Visible 10 jours dans vos archives apres archivage.
              </Text>
            )}
          </View>
        }
      />
    ),
    [busyId, colors.textMuted, isAdmin, permanentDelete, resetDelay]
  );

  const listHeader = useMemo(
    () => (
      <>
        <AppHeader
          title="Archives"
          subtitle={isAdmin ? 'Gestion des rendez-vous archives' : 'Historique archive visible 10 jours'}
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        />
        <AppInput label="Recherche archive" value={search} onChangeText={setSearch} placeholder="Patient, medecin, motif ou ID" />
        {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}
      </>
    ),
    [colors.danger, error, isAdmin, navigation, search]
  );

  return (
    <ScreenWrapper scroll={false}>
      {loading && items.length === 0 ? (
        <>
          {listHeader}
          <AppLoader message="Chargement des archives..." />
        </>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id_rdv)}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={() => fetchArchives(pageRef.current)}
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            filteredItems.length > 0 ? (
              <AppPagination
                page={page}
                totalPages={totalPages}
                onPrev={() => fetchArchives(page - 1)}
                onNext={() => fetchArchives(page + 1)}
              />
            ) : null
          }
          ListEmptyComponent={<AppEmpty onRetry={() => fetchArchives(1)} subtitle="Aucune archive disponible pour le moment." />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 126 }}
        />
      )}
    </ScreenWrapper>
  );
}
