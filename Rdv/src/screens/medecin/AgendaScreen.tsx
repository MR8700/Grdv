import React, { useCallback, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { dispoApi } from '../../api/disponibilites.api';
import { rdvApi } from '../../api/rendezVous.api';
import { AgendaDay } from '../../components/rdv/AgendaDay';
import { AgendaWeek, AgendaWeekItem } from '../../components/rdv/AgendaWeek';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppIcon } from '../../components/ui/AppIcon';
import { AppLoader } from '../../components/ui/AppLoader';
import { AppModal } from '../../components/ui/AppModal';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useAppSettings } from '../../store/AppSettingsContext';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Disponibilite, RendezVous } from '../../types/models.types';
import { REFRESH_INTERVALS } from '../../utils/constants';
import { formatDate, formatTime } from '../../utils/formatters';
import { exportToPdfAndShare, getPdfExportErrorMessage } from '../../utils/pdfExport';

function getWeekDays(): AgendaWeekItem[] {
  const today = new Date();
  const monday = new Date(today);
  const day = monday.getDay() || 7;
  monday.setDate(monday.getDate() - day + 1);

  return Array.from({ length: 5 }, (_, index) => {
    const current = new Date(monday);
    current.setDate(monday.getDate() + index);
    const key = current.toISOString().slice(0, 10);

    return {
      key,
      dayLabel: current.toLocaleDateString('fr-FR', { weekday: 'short' }),
      dateLabel: current.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      totalRdv: 0,
      totalLibre: 0,
    };
  });
}

export function AgendaScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { currentRole, rolePreferences } = useAppSettings();
  const exportAllowed = rolePreferences[currentRole]?.exportEnabled !== false;
  const { user, hasPermission } = useAuth();
  const canConfirm = hasPermission('confirmer_rdv');

  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(getWeekDays()[0].key);
  const [selectedDispoId, setSelectedDispoId] = useState<number | undefined>(undefined);
  const [selectedRdv, setSelectedRdv] = useState<RendezVous | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [selectedExportIds, setSelectedExportIds] = useState<number[]>([]);

  const fetchAgenda = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const week = getWeekDays();
      const firstDay = `${week[0].key}T00:00:00`;
      const lastDay = `${week[week.length - 1].key}T23:59:59`;
      const [dispoResponse, rdvResponse] = await Promise.all([
        dispoApi.getAll({
          id_medecin: user.id_user,
          date_debut: firstDay,
          date_fin: lastDay,
          limit: 50,
        }),
        rdvApi.getAll({
          id_medecin: user.id_user,
          date_debut: firstDay,
          date_fin: lastDay,
          limit: 50,
        }),
      ]);
      setDisponibilites((dispoResponse.data as PaginatedResponse<Disponibilite>).data);
      const rdvRows = (rdvResponse.data as PaginatedResponse<RendezVous>).data;
      setRendezVous(rdvRows);
      setSelectedExportIds((current) => current.filter((id) => rdvRows.some((item) => item.id_rdv === id)));
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger l agenda.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  useAutoRefresh(fetchAgenda, REFRESH_INTERVALS.AGENDA, !!user);

  const weekData = useMemo(
    () =>
      getWeekDays().map((day) => ({
        ...day,
        totalRdv: rendezVous.filter((item) => item.date_heure_rdv.startsWith(day.key)).length,
        totalLibre: disponibilites.filter((item) => item.date_heure_debut.startsWith(day.key) && item.est_libre).length,
      })),
    [disponibilites, rendezVous]
  );

  const dayDisponibilites = disponibilites.filter((item) => item.date_heure_debut.startsWith(selectedDay));
  const dayRendezVous = rendezVous.filter((item) => item.date_heure_rdv.startsWith(selectedDay));
  const selectedRows = dayRendezVous.filter((item) => selectedExportIds.includes(item.id_rdv));
  const allVisibleSelected = dayRendezVous.length > 0 && dayRendezVous.every((item) => selectedExportIds.includes(item.id_rdv));

  const toggleSelection = useCallback((id: number) => {
    setSelectedExportIds((current) => (current.includes(id) ? current.filter((value) => value !== id) : [...current, id]));
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedExportIds((current) => {
      if (allVisibleSelected) {
        return current.filter((id) => !dayRendezVous.some((item) => item.id_rdv === id));
      }

      const merged = new Set(current);
      dayRendezVous.forEach((item) => merged.add(item.id_rdv));
      return Array.from(merged);
    });
  }, [allVisibleSelected, dayRendezVous]);

  const exportDayPlanning = useCallback(async () => {
    if (selectedRows.length === 0) {
      Toast.info('Export PDF', 'Selectionnez au moins un rendez-vous.', 1800);
      return;
    }

    try {
      await exportToPdfAndShare({
        title: 'Export planning medecin',
        rows: selectedRows,
        filters: {
          Jour: selectedDay,
          Creneaux_libres: dayDisponibilites.filter((d) => d.est_libre).length,
          Selection: selectedRows.length,
        },
        columns: [
          { key: 'id', label: 'ID RDV', value: (r) => r.id_rdv },
          { key: 'date', label: 'Date', value: (r) => formatDate(r.date_heure_rdv) },
          { key: 'heure', label: 'Heure', value: (r) => formatTime(r.date_heure_rdv) },
          { key: 'statut', label: 'Statut', value: (r) => r.statut_rdv },
          { key: 'patient', label: 'Patient', value: (r) => `${r.patient?.utilisateur?.prenom || ''} ${r.patient?.utilisateur?.nom || ''}`.trim() },
          { key: 'motif', label: 'Motif', value: (r) => r.motif || '' },
        ],
      });
      Toast.success('PDF prêt', `${selectedRows.length} rendez-vous exporté(s) pour le ${selectedDay}.`);
    } catch (exportError) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(exportError));
    }
  }, [dayDisponibilites, selectedDay, selectedRows]);

  const updateAppointmentStatus = useCallback(async (rdv: RendezVous, statut_rdv: 'confirme' | 'refuse') => {
    try {
      setUpdatingId(rdv.id_rdv);
      await rdvApi.updateStatut(rdv.id_rdv, {
        statut_rdv,
        motif_refus: statut_rdv === 'refuse' ? 'Refus saisi par le medecin.' : undefined,
      });
      Toast.success(
        'Rendez-vous mis à jour',
        statut_rdv === 'confirme' ? 'Le rendez-vous a été confirmé.' : 'Le rendez-vous a été refusé.'
      );
      setSelectedRdv(null);
      await fetchAgenda();
    } catch (err: any) {
      Toast.error('Action impossible', err?.response?.data?.message ?? 'La mise à jour a échoué.');
    } finally {
      setUpdatingId(null);
    }
  }, [fetchAgenda]);

  return (
    <ScreenWrapper scroll onRefresh={fetchAgenda} refreshing={loading}>
      <AppHeader
        title="Agenda"
        subtitle="Semaine en cours"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={exportAllowed ? <AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportDayPlanning} /> : undefined}
      />
      {dayRendezVous.length > 0 ? (
        <TouchableOpacity onPress={toggleSelectAll} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12, paddingHorizontal: 4 }}>
          <AppIcon name={allVisibleSelected ? 'checkbox' : 'square-outline'} size={20} color={allVisibleSelected ? colors.primary : colors.textMuted} />
          <Text style={{ color: colors.text, fontWeight: '600' }}>
            {allVisibleSelected ? 'Tout decocher sur la journee' : 'Tout cocher sur la journee'} ({selectedRows.length})
          </Text>
        </TouchableOpacity>
      ) : null}
      {error ? <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text> : null}
      {loading && disponibilites.length === 0 && rendezVous.length === 0 ? (
        <AppLoader message="Chargement de l agenda..." />
      ) : weekData.length === 0 ? (
        <AppEmpty subtitle="Aucune donnée disponible pour cette semaine." onRetry={fetchAgenda} />
      ) : (
        <>
          <AgendaWeek days={weekData} activeKey={selectedDay} onSelectDay={setSelectedDay} />
          <AgendaDay
            title="Jour sélectionné"
            date={selectedDay}
            disponibilites={dayDisponibilites}
            rendezVous={dayRendezVous}
            selectedDispoId={selectedDispoId}
            onSelectDispo={(value) => setSelectedDispoId(value.id_dispo)}
            onPressRdv={setSelectedRdv}
          />
        </>
      )}

      <AppModal
        visible={Boolean(selectedRdv)}
        onClose={() => setSelectedRdv(null)}
        title={selectedRdv ? `RDV #${selectedRdv.id_rdv}` : 'Rendez-vous'}
        actions={
          selectedRdv ? (
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <AppButton label="Fermer" variant="ghost" style={{ flex: 1 }} onPress={() => setSelectedRdv(null)} />
              {canConfirm && selectedRdv.statut_rdv === 'en_attente' ? (
                <>
                  <AppButton
                    label="Refuser"
                    variant="outline"
                    style={{ flex: 1 }}
                    loading={updatingId === selectedRdv.id_rdv}
                    onPress={() => updateAppointmentStatus(selectedRdv, 'refuse')}
                  />
                  <AppButton
                    label="Confirmer"
                    style={{ flex: 1 }}
                    loading={updatingId === selectedRdv.id_rdv}
                    onPress={() => updateAppointmentStatus(selectedRdv, 'confirme')}
                  />
                </>
              ) : null}
            </View>
          ) : null
        }
      >
        {selectedRdv ? (
          <View style={{ gap: 12 }}>
            <TouchableOpacity onPress={() => toggleSelection(selectedRdv.id_rdv)} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <AppIcon
                name={selectedExportIds.includes(selectedRdv.id_rdv) ? 'checkbox' : 'square-outline'}
                size={20}
                color={selectedExportIds.includes(selectedRdv.id_rdv) ? colors.primary : colors.textMuted}
              />
              <Text style={{ color: colors.text, fontWeight: '600' }}>
                {selectedExportIds.includes(selectedRdv.id_rdv) ? 'Retirer de l export' : 'Ajouter à l export'}
              </Text>
            </TouchableOpacity>
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              Patient: {selectedRdv.patient?.utilisateur?.prenom} {selectedRdv.patient?.utilisateur?.nom}
            </Text>
            <Text style={{ color: colors.text }}>
              Statut: {selectedRdv.statut_rdv}
            </Text>
            <Text style={{ color: colors.text }}>
              Date: {formatDate(selectedRdv.date_heure_rdv)} à {formatTime(selectedRdv.date_heure_rdv)}
            </Text>
            <Text style={{ color: colors.text }}>
              Motif: {selectedRdv.motif || 'Non renseigné'}
            </Text>
            {selectedRdv.patient?.utilisateur?.email ? (
              <Text style={{ color: colors.text }}>
                E-mail patient: {selectedRdv.patient.utilisateur.email}
              </Text>
            ) : null}
          </View>
        ) : null}
      </AppModal>
    </ScreenWrapper>
  );
}
