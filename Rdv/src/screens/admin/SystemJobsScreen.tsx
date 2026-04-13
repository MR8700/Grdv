import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { showAlert } from '../../components/ui/AppAlert';
import { systemJobsApi } from '../../api/systemJobs.api';
import { useTheme } from '../../store/ThemeContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { PaginatedResponse } from '../../types/api.types';
import { SystemJob } from '../../types/models.types';
import { REFRESH_INTERVALS } from '../../utils/constants';

const JOB_TYPES = [
  { label: 'Envoyer rappel', value: 'envoyer_rappel' },
  { label: 'Nettoyage archives', value: 'nettoyage_archives' },
];

const STATUS_OPTIONS = [
  { label: 'Tous les statuts', value: 'all' },
  { label: 'Attente', value: 'attente' },
  { label: 'Succes', value: 'succes' },
  { label: 'Echec', value: 'echec' },
];

export function SystemJobsScreen() {
  const { colors } = useTheme();
  const [items, setItems] = useState<SystemJob[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningType, setRunningType] = useState('envoyer_rappel');
  const [statusFilter, setStatusFilter] = useState('all');
  const [busy, setBusy] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const response = await systemJobsApi.getAll({
        limit: 100,
        statut: statusFilter === 'all' ? undefined : statusFilter,
      });
      const payload = response.data as PaginatedResponse<SystemJob>;
      setItems(payload.data);
    } catch {
      showAlert('error', 'Jobs systeme', 'Impossible de charger les jobs systeme.');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  React.useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  useAutoRefresh(fetchJobs, REFRESH_INTERVALS.DASHBOARD, true);

  const runManual = useCallback(async () => {
    setBusy(runningType);
    try {
      await systemJobsApi.runManual(runningType);
      showAlert('success', 'Job lance', `Le job ${runningType} a ete declenche.`);
      await fetchJobs();
    } catch {
      showAlert('error', 'Execution impossible', 'Le job n a pas pu etre lance.');
    } finally {
      setBusy(null);
    }
  }, [fetchJobs, runningType]);

  const removeJob = useCallback(async (id: number) => {
    setBusy(`remove-${id}`);
    try {
      await systemJobsApi.remove(id);
      showAlert('success', 'Job supprime');
      await fetchJobs();
    } catch {
      showAlert('error', 'Suppression impossible', 'Ce job ne peut pas etre supprime.');
    } finally {
      setBusy(null);
    }
  }, [fetchJobs]);

  const rows = useMemo(
    () =>
      items.map((job) => ({
        id: job.id_job,
        type: job.type_tache || '',
        statut: job.statut,
        date: job.date_execution_prevue || '',
        tentatives: job.nombre_tentatives,
      })),
    [items]
  );

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader
        title="System Jobs"
        subtitle={`${items.length} job(s)`}
        rightActions={
          <PdfExportButton
            title="Export system jobs"
            rows={rows}
            filters={{ Statut: statusFilter }}
            columns={[
              { key: 'id', label: 'ID', value: (r) => r.id },
              { key: 'type', label: 'Type', value: (r) => r.type },
              { key: 'statut', label: 'Statut', value: (r) => r.statut },
              { key: 'date', label: 'Execution', value: (r) => r.date },
              { key: 'tentatives', label: 'Tentatives', value: (r) => r.tentatives },
            ]}
          />
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => String(item.id_job)}
        refreshing={loading}
        onRefresh={fetchJobs}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: 12 }}>
            <AppCard title="Déclenchement manuel" subtitle="Lancer un job backend à la demande">
              <AppDropdown label="Type de job" value={runningType} options={JOB_TYPES} onValueChange={setRunningType} />
              <AppButton
                label={busy === runningType ? 'Execution...' : 'Lancer le job'}
                onPress={runManual}
                loading={busy === runningType}
                fullWidth
              />
            </AppCard>

            <AppDropdown label="Filtrer par statut" value={statusFilter} options={STATUS_OPTIONS} onValueChange={setStatusFilter} />
          </View>
        }
        renderItem={({ item }) => (
          <AppCard noPadding>
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <Text style={{ flex: 1, color: colors.text, fontWeight: '800', fontSize: 15 }}>
                  {item.type_tache || 'Type inconnu'}
                </Text>
                <AppBadge
                  label={item.statut}
                  size="sm"
                  color={
                    item.statut === 'succes'
                      ? `${colors.success}18`
                      : item.statut === 'echec'
                        ? `${colors.danger}18`
                        : `${colors.warning}18`
                  }
                  textColor={
                    item.statut === 'succes'
                      ? colors.success
                      : item.statut === 'echec'
                        ? colors.danger
                        : colors.warning
                  }
                />
              </View>
              <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>
                Execution prevue: {item.date_execution_prevue || 'Non renseignee'}
              </Text>
              <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
                Tentatives: {item.nombre_tentatives}
              </Text>

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => removeJob(item.id_job)}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: `${colors.danger}14`,
                    borderWidth: 1,
                    borderColor: `${colors.danger}30`,
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>
                    {busy === `remove-${item.id_job}` ? 'Suppression...' : 'Supprimer'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Aucun job systeme.</Text>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
}
