import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { useTheme } from '../../store/ThemeContext';
import { MediaOutbox, MediaOutboxItem } from '../../utils/mediaOutbox';
import { flushPendingMutations, getPendingMutationsCount } from '../../utils/offlineSync';
import { Toast } from '../../components/ui/AppAlert';
import { PdfExportButton } from '../../components/ui/PdfExportButton';

export function SynchronisationScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const [mediaItems, setMediaItems] = React.useState<MediaOutboxItem[]>([]);
  const [jsonQueueCount, setJsonQueueCount] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [syncing, setSyncing] = React.useState(false);

  const refresh = React.useCallback(async () => {
    setLoading(true);
    try {
      const [items, jsonCount] = await Promise.all([MediaOutbox.getAll(), getPendingMutationsCount()]);
      items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
      setMediaItems(items);
      setJsonQueueCount(jsonCount);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    refresh();
  }, [refresh]);

  const retryNow = React.useCallback(async () => {
    setSyncing(true);
    try {
      const [jsonSynced, mediaResult] = await Promise.all([flushPendingMutations(), MediaOutbox.flush()]);
      await refresh();

      if (jsonSynced > 0 || mediaResult.synced > 0) {
        Toast.success('Synchronisation', `${jsonSynced + mediaResult.synced} element(s) envoye(s).`);
      } else {
        Toast.info('Synchronisation', 'Aucun element envoye pour le moment.');
      }

      if (mediaResult.failed > 0) {
        Toast.error('Media en echec', `${mediaResult.failed} media(s) en echec final.`);
      }
    } catch {
      Toast.error('Synchronisation', 'Echec de la relance manuelle.');
    } finally {
      setSyncing(false);
    }
  }, [refresh]);

  const pendingCount = mediaItems.filter((item) => item.status === 'pending').length;
  const failedCount = mediaItems.filter((item) => item.status === 'failed').length;

  return (
    <ScreenWrapper scroll onRefresh={refresh} refreshing={loading} style={{ backgroundColor: colors.background }}>
      <AppHeader
        title="Synchronisation"
        subtitle="Queue hors ligne et relance manuelle"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export synchronisation"
            rows={mediaItems}
            filters={{ JSON: jsonQueueCount, Pending: pendingCount, Failed: failedCount }}
            columns={[
              { key: 'id', label: 'ID', value: (m) => m.id },
              { key: 'field', label: 'Champ', value: (m) => m.fieldName },
              { key: 'entity', label: 'Entite', value: (m) => m.entityKey },
              { key: 'status', label: 'Statut', value: (m) => m.status },
              { key: 'endpoint', label: 'Endpoint', value: (m) => m.endpoint },
              { key: 'retries', label: 'Tentatives', value: (m) => m.retries },
            ]}
          />
        }
      />

      <View style={styles.container}>
        <AppCard style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <View style={[styles.badge, { backgroundColor: colors.primary }]}>
              <Text style={styles.badgeText}>{jsonQueueCount} JSON</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: colors.warning }]}>
              <Text style={styles.badgeText}>{pendingCount} Pending</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: failedCount > 0 ? colors.danger : colors.success }]}>
              <Text style={styles.badgeText}>{failedCount} Failed</Text>
            </View>
          </View>
          <AppButton
            label={syncing ? 'Relance...' : 'Relancer maintenant'}
            loading={syncing}
            fullWidth
            onPress={retryNow}
            style={{ marginTop: 16 }}
          />
        </AppCard>

        <AppCard title="Queue media" subtitle="Photos et logos" style={styles.card}>
          {mediaItems.length === 0 ? (
            <Text style={{ color: colors.textMuted }}>Aucun media en attente.</Text>
          ) : (
            <View style={{ gap: 12 }}>
              {mediaItems.map((item) => (
                <View
                  key={item.id}
                  style={[styles.mediaItem, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}
                >
                  <View style={styles.mediaHeader}>
                    <MaterialIcons
                      name={item.status === 'failed' ? 'error' : item.status === 'pending' ? 'schedule' : 'check-circle'}
                      size={18}
                      color={item.status === 'failed' ? colors.danger : item.status === 'pending' ? colors.warning : colors.success}
                      style={{ marginRight: 6 }}
                    />
                    <Text style={[styles.mediaTitle, { color: colors.text }]}>
                      {item.fieldName.toUpperCase()} - {item.entityKey}
                    </Text>
                  </View>
                  <Text style={[styles.mediaText, { color: colors.textMuted }]}>Endpoint: {item.endpoint}</Text>
                  <Text style={[styles.mediaText, { color: colors.textMuted }]}>Tentatives: {item.retries}</Text>
                  {item.errorMessage ? (
                    <Text style={[styles.mediaText, { color: colors.danger }]}>Erreur: {item.errorMessage}</Text>
                  ) : null}
                </View>
              ))}
            </View>
          )}
        </AppCard>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, paddingBottom: 40, gap: 20 },
  summaryCard: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 2 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  badge: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 20 },
  badgeText: { fontWeight: '700', color: '#fff' },
  card: { borderRadius: 16, padding: 16, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  mediaItem: { borderWidth: 1, borderRadius: 12, padding: 12 },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  mediaTitle: { fontWeight: '700', fontSize: 14 },
  mediaText: { marginTop: 2, fontSize: 13 },
});
