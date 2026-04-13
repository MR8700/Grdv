import React, { useCallback, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { rdvApi } from '../../api/rendezVous.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { RdvCard } from '../../components/rdv/RdvCard';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppLoader } from '../../components/ui/AppLoader';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { useNotifContext } from '../../store/NotifContext';
import { useTheme } from '../../store/ThemeContext';
import { PaginatedResponse } from '../../types/api.types';
import { RendezVous } from '../../types/models.types';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { formatDate, formatTime } from '../../utils/formatters';
 
export function HomePatientScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const { unreadCount } = useNotifContext();

  const [rdv, setRdv] = useState<RendezVous[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUpcoming = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await rdvApi.getAll({
        page: 1,
        limit: 5,
        date_debut: new Date().toISOString(),
      });
      const payload = res.data as PaginatedResponse<RendezVous>;
      setRdv(payload.data);
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Impossible de charger vos rendez-vous.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchUpcoming();
  }, [fetchUpcoming]);

  const nextRdv = rdv[0] ?? null;

  return (
    <ScreenWrapper scroll onRefresh={fetchUpcoming} refreshing={loading}>
      <AppHeader
        title="Accueil"
        subtitle="Vos prochaines étapes"
        rightActions={
          <PdfExportButton
            title="Export accueil patient"
            rows={rdv}
            columns={[
              { key: 'id', label: 'ID', value: (r) => r.id_rdv },
              { key: 'date', label: 'Date', value: (r) => formatDate(r.date_heure_rdv) },
              { key: 'heure', label: 'Heure', value: (r) => formatTime(r.date_heure_rdv) },
              { key: 'statut', label: 'Statut', value: (r) => r.statut_rdv },
              { key: 'motif', label: 'Motif', value: (r) => r.motif || '' },
            ]}
          />
        }
      />

      {!!error && <Text style={{ color: colors.danger, marginBottom: 12, fontWeight: '600' }}>{error}</Text>}

      <AppCard
        title={nextRdv ? 'Prochain rendez-vous' : 'Aucun rendez-vous à venir'}
        subtitle={
          nextRdv
            ? `${formatDate(nextRdv.date_heure_rdv)} a ${formatTime(nextRdv.date_heure_rdv)}`
            : 'Prenez un rendez-vous pour commencer votre suivi'
        }
      >
        <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
          {nextRdv
            ? `Statut actuel: ${nextRdv.statut_rdv}. ${nextRdv.motif ? `Motif: ${nextRdv.motif}` : 'Consultez Mes RDV pour plus de details.'}`
            : 'Accedez rapidement aux créneaux disponibles, à vos notifications et au suivi de vos demandes.'}
        </Text>
      </AppCard>

      <AppCard title="Raccourcis" subtitle="Accès rapide">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingVertical: 4, paddingRight: 8 }}>
          <View style={{ width: 176 }}>
            <AppButton label="Prendre un RDV" fullWidth onPress={() => navigation?.navigate?.('PriseRdv')} />
          </View>
          <View style={{ width: 176 }}>
            <AppButton label="Mes RDV" variant="outline" fullWidth onPress={() => navigation?.navigate?.('MesRdv')} />
          </View>
          <View style={{ width: 176 }}>
            <AppButton
              label={unreadCount > 0 ? `Notifications (${unreadCount})` : 'Notifications'}
              variant="outline"
              fullWidth
              onPress={() => navigation?.navigate?.('Notifications')}
            />
          </View>
        </ScrollView>
      </AppCard>

      <AppCard title="Mes rendez-vous" subtitle="Vos prochains rendez-vous confirmés ou en attente">
        {loading && rdv.length === 0 ? (
          <AppLoader message="Chargement..." />
        ) : rdv.length === 0 ? (
          <AppEmpty
            title="Aucun rendez-vous"
            subtitle="Commencez par prendre un rendez-vous."
            onRetry={fetchUpcoming}
          />
        ) : (
          <View style={{ marginTop: 6 }}>
            {rdv.map((item, index) => (
              <RdvCard key={item.id_rdv} rdv={item} index={index} />
            ))}
            <View style={{ marginTop: 6 }}>
              <AppButton label="Voir tout" variant="ghost" fullWidth onPress={() => navigation?.navigate?.('MesRdv')} />
            </View>
          </View>
        )}
      </AppCard>
    </ScreenWrapper>
  );
}
