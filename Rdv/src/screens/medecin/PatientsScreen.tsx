import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Text } from 'react-native';
import { patientsApi } from '../../api/patients.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { PatientCard } from '../../components/rdv/PatientCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppPagination } from '../../components/shared/AppPagination';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Patient } from '../../types/models.types';
import { exportToPdfAndShare, getPdfExportErrorMessage } from '../../utils/pdfExport';
 
export function PatientsScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const [items, setItems] = useState<Patient[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const pageRef = useRef(1);

  useEffect(() => {
    pageRef.current = page;
  }, [page]);

  const fetchPatients = useCallback(
    async (targetPage = pageRef.current) => {
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
    },
    []
  );

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

  const exportFiltered = useCallback(async () => {
    try {
      await exportToPdfAndShare({
        title: 'Export patients médecin',
        rows: filteredItems,
        filters: { Page: page, Recherche: search || 'Aucune' },
        columns: [
          { key: 'id', label: 'ID', value: (p) => p.id_user },
          { key: 'nom', label: 'Nom', value: (p) => p.utilisateur?.nom || '' },
          { key: 'prenom', label: 'Prenom', value: (p) => p.utilisateur?.prenom || '' },
          { key: 'email', label: 'Email', value: (p) => p.utilisateur?.email || '' },
          { key: 'dossier', label: 'Dossier', value: (p) => p.id_dossier_medical || '' },
          { key: 'groupe', label: 'Groupe sanguin', value: (p) => p.groupe_sanguin || '' },
        ],
      });
      Toast.success('PDF prêt', `${filteredItems.length} patient(s) exporte(s).`);
    } catch (exportError) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(exportError));
    }
  }, [filteredItems, page, search]);

  React.useEffect(() => {
    fetchPatients(1);
  }, [fetchPatients]);

  return (
    <ScreenWrapper scroll onRefresh={() => fetchPatients(page)} refreshing={loading}>
      <AppHeader
        title="Patients"
        subtitle="Liste de vos patients"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={<AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportFiltered} />}
      />

      <AppInput label="Recherche patient" value={search} onChangeText={setSearch} placeholder="Nom, email ou dossier" />

      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}
      {loading && items.length === 0 ? (
        <AppLoader message="Chargement des patients..." />
      ) : filteredItems.length === 0 ? (
        <AppEmpty onRetry={() => fetchPatients(1)} subtitle="Aucun patient pour ce filtre." />
      ) : (
        <>
          {filteredItems.map((patient) => (
            <PatientCard key={patient.id_user} patient={patient} subtitle={patient.utilisateur?.email} />
          ))}
          <AppPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => fetchPatients(page - 1)}
            onNext={() => fetchPatients(page + 1)}
          />
        </>
      )}
    </ScreenWrapper>
  );
}
