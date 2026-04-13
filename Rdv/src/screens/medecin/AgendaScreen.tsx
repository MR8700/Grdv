import React, { useCallback, useMemo, useState } from 'react';
import { Text } from 'react-native';
import { dispoApi } from '../../api/disponibilites.api';
import { rdvApi } from '../../api/rendezVous.api';
import { AgendaDay } from '../../components/rdv/AgendaDay';
import { AgendaWeek, AgendaWeekItem } from '../../components/rdv/AgendaWeek';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppButton } from '../../components/ui/AppButton';
import { Toast } from '../../components/ui/AppAlert';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
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
  const { user } = useAuth();
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(getWeekDays()[0].key);
  const [selectedDispoId, setSelectedDispoId] = useState<number | undefined>(undefined);

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
      setRendezVous((rdvResponse.data as PaginatedResponse<RendezVous>).data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger l\'agenda.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchAgenda();
  }, [fetchAgenda]);

  useAutoRefresh(fetchAgenda, REFRESH_INTERVALS.AGENDA, !!user);

  const weekData = useMemo(() => {
    return getWeekDays().map((day) => ({
      ...day,
      totalRdv: rendezVous.filter((item) => item.date_heure_rdv.startsWith(day.key)).length,
      totalLibre: disponibilites.filter((item) => item.date_heure_debut.startsWith(day.key) && item.est_libre).length,
    }));
  }, [disponibilites, rendezVous]);

  const dayDisponibilites = disponibilites.filter((item) => item.date_heure_debut.startsWith(selectedDay));
  const dayRendezVous = rendezVous.filter((item) => item.date_heure_rdv.startsWith(selectedDay));

  const exportDayPlanning = useCallback(async () => {
    try {
      await exportToPdfAndShare({
        title: 'Export planning medecin',
        rows: dayRendezVous,
        filters: { Jour: selectedDay, Creneaux_libres: dayDisponibilites.filter((d) => d.est_libre).length },
        columns: [
          { key: 'id', label: 'ID RDV', value: (r) => r.id_rdv },
          { key: 'date', label: 'Date', value: (r) => formatDate(r.date_heure_rdv) },
          { key: 'heure', label: 'Heure', value: (r) => formatTime(r.date_heure_rdv) },
          { key: 'statut', label: 'Statut', value: (r) => r.statut_rdv },
          { key: 'patient', label: 'Patient', value: (r) => `${r.patient?.utilisateur?.prenom || ''} ${r.patient?.utilisateur?.nom || ''}`.trim() },
          { key: 'motif', label: 'Motif', value: (r) => r.motif || '' },
        ],
      });
      Toast.success('PDF pret', `${dayRendezVous.length} rendez-vous exporté(s) pour le ${selectedDay}.`);
    } catch (exportError) {
      Toast.error('Export PDF impossible', getPdfExportErrorMessage(exportError));
    }
  }, [dayDisponibilites, dayRendezVous, selectedDay]);

  return (
    <ScreenWrapper scroll onRefresh={fetchAgenda} refreshing={loading}>
      <AppHeader
        title="Agenda"
        subtitle="Semaine en cours depuis le Backend"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={<AppButton label="Exporter PDF" size="sm" variant="outline" onPress={exportDayPlanning} />}
      />
      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}
      {loading && disponibilites.length === 0 && rendezVous.length === 0 ? (
        <AppLoader message="Chargement de l\'agenda..." />
      ) : weekData.length === 0 ? (
        <AppEmpty subtitle="Aucune donnée disponible pour cette semaine." onRetry={fetchAgenda} />
      ) : (
        <>
          <AgendaWeek days={weekData} activeKey={selectedDay} onSelectDay={setSelectedDay} />
          <AgendaDay
            title="Jour selectionné"
            date={selectedDay}
            disponibilites={dayDisponibilites}
            rendezVous={dayRendezVous}
            selectedDispoId={selectedDispoId}
            onSelectDispo={(value) => setSelectedDispoId(value.id_dispo)}
          />
        </>
      )}
    </ScreenWrapper>
  );
}
