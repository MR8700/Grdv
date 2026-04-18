import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Text } from 'react-native';
import { patientsApi } from '../../api/patients.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PatientCard } from '../../components/rdv/PatientCard';
import { PatientDetailsModal } from '../../components/rdv/PatientDetailsModal';
import { AppInput } from '../../components/ui/AppInput';
import { AppPagination } from '../../components/shared/AppPagination';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Patient } from '../../types/models.types';

export function PatientsScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Patient[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const pageRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchPatients = useCallback(async (targetPage = pageRef.current) => {
    try {
      setLoading(true);
      setError(null);
      const response = await patientsApi.getAll({ page: targetPage, limit: 10 });
      const payload = response.data as PaginatedResponse<Patient>;
      setItems(payload.data);
      setPage(payload.meta.page);
      setTotalPages(payload.meta.totalPages || 1);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les patients.');
    } finally {
      setLoading(false);
    }
  }, []);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((patient) => {
      const fullName = `${patient.utilisateur?.prenom || ''} ${patient.utilisateur?.nom || ''}`.toLowerCase();
      const email = (patient.utilisateur?.email || '').toLowerCase();
      const dossier = String(patient.id_dossier_medical || '').toLowerCase();
      return fullName.includes(query) || email.includes(query) || dossier.includes(query);
    });
  }, [items, search]);

  useEffect(() => {
    fetchPatients(1);
  }, [fetchPatients]);

  const renderItem = useCallback(
    ({ item }: { item: Patient }) => (
      <PatientCard
        patient={item}
        subtitle={item.utilisateur?.email}
        onPress={() => setSelectedPatient(item)}
      />
    ),
    []
  );

  const listHeader = useMemo(
    () => (
      <>
        <AppHeader
          title="Patients"
          subtitle="Liste de vos patients"
          onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        />

        <AppInput label="Recherche patient" value={search} onChangeText={setSearch} placeholder="Nom, e-mail ou dossier" />

        {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}
      </>
    ),
    [colors.danger, error, navigation, search]
  );

  return (
    <ScreenWrapper scroll={false}>
      {loading && items.length === 0 ? (
        <>
          {listHeader}
          <AppLoader message="Chargement des patients..." />
        </>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => String(item.id_user)}
          renderItem={renderItem}
          refreshing={loading}
          onRefresh={() => fetchPatients(pageRef.current)}
          ListHeaderComponent={listHeader}
          ListFooterComponent={
            filteredItems.length > 0 ? (
              <AppPagination
                page={page}
                totalPages={totalPages}
                onPrev={() => fetchPatients(page - 1)}
                onNext={() => fetchPatients(page + 1)}
              />
            ) : null
          }
          ListEmptyComponent={<AppEmpty onRetry={() => fetchPatients(1)} subtitle="Aucun patient pour ce filtre." />}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 126 }}
          removeClippedSubviews
          initialNumToRender={8}
          maxToRenderPerBatch={10}
          windowSize={7}
        />
      )}

      <PatientDetailsModal patient={selectedPatient} visible={Boolean(selectedPatient)} onClose={() => setSelectedPatient(null)} />
    </ScreenWrapper>
  );
}
