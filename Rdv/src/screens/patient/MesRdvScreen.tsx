import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { rdvApi } from '../../api/rendezVous.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { AppPagination } from '../../components/shared/AppPagination';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { RendezVous, StatutRdv } from '../../types/models.types';
import { REFRESH_INTERVALS } from '../../utils/constants';
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

function buildStatusMessage(rdv: RendezVous) {
  const when = `${formatDate(rdv.date_heure_rdv)} a ${formatTime(rdv.date_heure_rdv)}`;
  switch (rdv.statut_rdv) {
    case 'confirme':
      return { title: 'Rendez-vous confirme', body: `Votre rendez-vous du ${when} est confirme.` };
    case 'refuse':
      return { title: 'Rendez-vous refuse', body: `Votre demande du ${when} a ete refusee.` };
    case 'annule':
      return { title: 'Rendez-vous annule', body: `Votre rendez-vous du ${when} a ete annule.` };
    default:
      return null;
  }
}

export function MesRdvScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const [items, setItems] = useState<RendezVous[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');

  const previousStatusRef = useRef<Record<number, StatutRdv>>({});
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

        const prev = previousStatusRef.current;
        for (const rdv of payload.data) {
          const old = prev[rdv.id_rdv];
          if (old && old !== rdv.statut_rdv) {
            const msg = buildStatusMessage(rdv);
            if (msg) {
              Toast.info(msg.title, msg.body, 4500);
            }
          }
          prev[rdv.id_rdv] = rdv.statut_rdv;
        }
        previousStatusRef.current = prev;

        setItems(payload.data);
        setPage(payload.meta.page);
        setTotalPages(payload.meta.totalPages || 1);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Impossible de charger vos rendez-vous.');
      } finally {
        setLoading(false);
      }
    },
    [statusFilter]
  );

  const filteredItems = items;

  const exportFiltered = useCallback(async () => {
    try {
      await exportToPdfAndShare({
        title: 'Export rendez-vous patient',
        rows: filteredItems,
        filters: { Page: page, Statut: statusFilter === 'all' ? 'Tous' : statusFilter },
        columns: [
          { key: 'id', label: 'ID', value: (r) => r.id_rdv },
          { key: 'date', label: 'Date', value: (r) => formatDate(r.date_heure_rdv) },
          { key: 'heure', label: 'Heure', value: (r) => formatTime(r.date_heure_rdv) },
          { key: 'statut', label: 'Statut', value: (r) => r.statut_rdv },
          { key: 'motif', label: 'Motif', value: (r) => r.motif || '' },
          { key: 'medecin', label: 'Medecin', value: (r) => `${r.medecin?.utilisateur?.prenom || ''} ${r.medecin?.utilisateur?.nom || ''}`.trim() },
        ],
      });
      Toast.success('PDF pret', `${filteredItems.length} rendez-vous exporte(s).`);
    } catch (exportError) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(exportError));
    }
  }, [filteredItems, page, statusFilter]);

  const cancelRendezVous = useCallback(
    async (id: number) => {
      try {
        setBusyId(id);
        await rdvApi.cancel(id);
        Toast.success('Rendez-vous annulé', 'Votre demande a bien été prise en compte.');
        await fetchRendezVous(page);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Annulation impossible.');
        Toast.error('Annulation impossible', err?.response?.data?.message ?? 'Erreur backend.');
      } finally {
        setBusyId(null);
      }
    },
    [fetchRendezVous, page]
  );

  React.useEffect(() => {
    pageRef.current = 1;
    fetchRendezVous(1);
  }, [fetchRendezVous, statusFilter]);

  useAutoRefresh(() => {
    fetchRendezVous(pageRef.current);
  }, REFRESH_INTERVALS.AGENDA);

  return (
    <ScreenWrapper scroll onRefresh={() => fetchRendezVous(page)} refreshing={loading}>
      <AppHeader
        title="Mes rendez-vous"
        subtitle="Suivi et confirmation"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={<AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportFiltered} />}
      />

      <AppDropdown label="Filtrer par statut" value={statusFilter} onValueChange={setStatusFilter} options={STATUS_OPTIONS} />

      {error && <Text style={{ color: colors.danger, marginBottom: 12, fontWeight: '600' }}>{error}</Text>}

      {loading && items.length === 0 ? (
        <AppLoader message="Chargement des rendez-vous..." />
      ) : filteredItems.length === 0 ? (
        <AppEmpty title="Aucun rendez-vous" subtitle="Aucun élément ne correspond au filtre actuel." onRetry={() => fetchRendezVous(1)} />
      ) : (
        <View>
          {filteredItems.map((rdv, index) => (
            <View key={rdv.id_rdv}>
              <RdvCard rdv={rdv} index={index} />
              {rdv.statut_rdv !== 'annule' && rdv.statut_rdv !== 'archive' && (
                <View style={{ marginBottom: 16 }}>
                  <AppButton
                    label={busyId === rdv.id_rdv ? 'Annulation...' : 'Annuler'}
                    variant="outline"
                    fullWidth
                    loading={busyId === rdv.id_rdv}
                    onPress={() => cancelRendezVous(rdv.id_rdv)}
                  />
                </View>
              )}
            </View>
          ))}

          <AppPagination
            page={page}
            totalPages={totalPages}
            onPrev={() => fetchRendezVous(page - 1)}
            onNext={() => fetchRendezVous(page + 1)}
          />
        </View>
      )}
    </ScreenWrapper>
  );
}
