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
 
function getLastSevenDays() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    return {
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
    };
  });
}

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

  const cards = useMemo(() => {
    const confirmed = rendezVous.filter((item) => item.statut_rdv === 'confirme').length;
    const pending = rendezVous.filter((item) => item.statut_rdv === 'en_attente').length;
    const freeSlots = disponibilites.filter((item) => item.est_libre).length;
    return { total: rendezVous.length, confirmed, pending, freeSlots };
  }, [disponibilites, rendezVous]);

  const statCards = useMemo(
    () => [
      {
        key: 'rdv_total',
        label: 'RDV total',
        value: cards.total,
        icon: 'RDV',
        color: COLORS.primary,
        subtitle: 'Charge des 30 derniers jours',
        onPress: () => navigation?.navigate?.('Agenda'),
      },
      {
        key: 'confirmed',
        label: 'Confirmes',
        value: cards.confirmed,
        icon: 'OK',
        color: COLORS.success,
        subtitle: 'Rendez-vous valides',
        onPress: () => navigation?.navigate?.('Agenda'),
      },
      {
        key: 'pending',
        label: 'En attente',
        value: cards.pending,
        icon: 'PEN',
        color: COLORS.warning,
        subtitle: 'Actions a traiter',
        onPress: () => navigation?.navigate?.('Agenda'),
      },
      {
        key: 'free_slots',
        label: 'Créneaux libres',
        value: cards.freeSlots,
        icon: 'FREE',
        color: COLORS.info,
        subtitle: 'Disponibilités ouvertes',
        onPress: () => navigation?.navigate?.('Disponibilites'),
      },
    ],
    [cards, navigation]
  );

  const lineData = useMemo(() => {
    return getLastSevenDays().map((day) => ({
      label: day.label,
      value: rendezVous.filter((item) => item.date_heure_rdv.startsWith(day.key)).length,
    }));
  }, [rendezVous]);

  const pieData = useMemo(() => {
    return [
      { name: 'Confirmes', value: rendezVous.filter((item) => item.statut_rdv === 'confirme').length, color: COLORS.success },
      { name: 'En attente', value: rendezVous.filter((item) => item.statut_rdv === 'en_attente').length, color: COLORS.warning },
      { name: 'Annules', value: rendezVous.filter((item) => item.statut_rdv === 'annule').length, color: COLORS.danger },
    ];
  }, [rendezVous]);

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
        title="Statistiques médecin"
        subtitle="Calculées à partir de vos données enregistrées"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export statistiques médecin"
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
