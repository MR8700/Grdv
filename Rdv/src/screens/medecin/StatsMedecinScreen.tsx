import React, { useCallback, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { dispoApi } from '../../api/disponibilites.api';
import { rdvApi } from '../../api/rendezVous.api';
import { RdvPieChart } from '../../components/charts/RdvPieChart';
import { StatsCarousel } from '../../components/charts/StatsCarousel';
import { StatsLineChart } from '../../components/charts/StatsLineChart';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { Disponibilite, RendezVous } from '../../types/models.types';
import { COLORS, REFRESH_INTERVALS } from '../../utils/constants';

const LAST_SEVEN_DAYS = Array.from({ length: 7 }, (_, index) => {
  const day = new Date();
  day.setHours(0, 0, 0, 0);
  day.setDate(day.getDate() - (6 - index));
  return {
    key: day.toISOString().slice(0, 10),
    label: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
  };
});

export function StatsMedecinScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [rendezVous, setRendezVous] = useState<RendezVous[]>([]);
  const [disponibilites, setDisponibilites] = useState<Disponibilite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const from = new Date();
      from.setDate(from.getDate() - 30);
      const fromIso = from.toISOString();
      const [rdvResponse, dispoResponse] = await Promise.all([
        rdvApi.getAll({ id_medecin: user.id_user, date_debut: fromIso, limit: 100 }),
        dispoApi.getAll({ id_medecin: user.id_user, date_debut: fromIso, limit: 100 }),
      ]);
      setRendezVous((rdvResponse.data as PaginatedResponse<RendezVous>).data);
      setDisponibilites((dispoResponse.data as PaginatedResponse<Disponibilite>).data);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les statistiques.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  React.useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useAutoRefresh(fetchStats, REFRESH_INTERVALS.DASHBOARD, !!user);

  const stats = useMemo(() => {
    let confirmed = 0;
    let pending = 0;
    let cancelled = 0;
    const byDay = new Map<string, number>(LAST_SEVEN_DAYS.map((day) => [day.key, 0]));

    for (const item of rendezVous) {
      if (item.statut_rdv === 'confirme') confirmed += 1;
      if (item.statut_rdv === 'en_attente') pending += 1;
      if (item.statut_rdv === 'annule') cancelled += 1;

      const key = String(item.date_heure_rdv || '').slice(0, 10);
      if (byDay.has(key)) byDay.set(key, (byDay.get(key) || 0) + 1);
    }

    let freeSlots = 0;
    for (const item of disponibilites) {
      if (item.est_libre) freeSlots += 1;
    }

    return {
      total: rendezVous.length,
      confirmed,
      pending,
      cancelled,
      freeSlots,
      byDay,
    };
  }, [disponibilites, rendezVous]);

  const statCards = useMemo(
    () => [
      {
        key: 'rdv_total',
        label: 'RDV total',
        value: stats.total,
        icon: 'RDV',
        color: COLORS.primary,
        subtitle: 'Charge des 30 derniers jours',
        onPress: () => navigation?.navigate?.('Agenda'),
      },
      {
        key: 'confirmed',
        label: 'Confirmes',
        value: stats.confirmed,
        icon: 'OK',
        color: COLORS.success,
        subtitle: 'Rendez-vous valides',
        onPress: () => navigation?.navigate?.('Agenda'),
      },
      {
        key: 'pending',
        label: 'En attente',
        value: stats.pending,
        icon: 'PEN',
        color: COLORS.warning,
        subtitle: 'Actions a traiter',
        onPress: () => navigation?.navigate?.('Agenda'),
      },
      {
        key: 'free_slots',
        label: 'Creneaux libres',
        value: stats.freeSlots,
        icon: 'FREE',
        color: COLORS.info,
        subtitle: 'Disponibilites ouvertes',
        onPress: () => navigation?.navigate?.('Disponibilites'),
      },
    ],
    [navigation, stats.confirmed, stats.freeSlots, stats.pending, stats.total]
  );

  const lineData = useMemo(
    () =>
      LAST_SEVEN_DAYS.map((day) => ({
        label: day.label,
        value: stats.byDay.get(day.key) || 0,
      })),
    [stats.byDay]
  );

  const pieData = useMemo(
    () => [
      { name: 'Confirmes', value: stats.confirmed, color: COLORS.success },
      { name: 'En attente', value: stats.pending, color: COLORS.warning },
      { name: 'Annules', value: stats.cancelled, color: COLORS.danger },
    ],
    [stats.cancelled, stats.confirmed, stats.pending]
  );

  if (loading) {
    return (
      <ScreenWrapper scroll={false}>
        <AppLoader message="Chargement des statistiques..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll onRefresh={fetchStats} refreshing={loading}>
      <AppHeader
        title="Statistiques medecin"
        subtitle="Calculees a partir de vos donnees enregistrees"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export statistiques medecin"
            rows={statCards}
            columns={[
              { key: 'label', label: 'Carte', value: (s) => s.label },
              { key: 'value', label: 'Valeur', value: (s) => s.value },
              { key: 'subtitle', label: 'Details', value: (s) => s.subtitle || '' },
            ]}
          />
        }
      />
      {error && <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>}

      <StatsCarousel items={statCards} autoScrollMs={5000} />

      <View style={{ marginBottom: 16 }}>
        <StatsLineChart title="Rendez-vous sur 7 jours" data={lineData} />
      </View>
      <RdvPieChart title="Repartition des statuts" data={pieData} />
    </ScreenWrapper>
  );
}
