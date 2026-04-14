import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, FlatList } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppBadge } from '../../components/ui/AppBadge';
import { AppButton } from '../../components/ui/AppButton';
import { showAlert } from '../../components/ui/AppAlert';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { auditApi } from '../../api/auditLogs.api';
import { AuditLog } from '../../types/models.types';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { REFRESH_INTERVALS } from '../../utils/constants';
 
const formatDateTime = (value?: string) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
};

const actionColor = (action?: string) => {
  if (!action) return '#64748B';
  if (action.includes('DELETE') || action.includes('ARCHIVE')) return '#EF4444';
  if (action.includes('CREATE')) return '#10B981';
  if (action.includes('UPDATE')) return '#F59E0B';
  if (action.includes('LOGIN')) return '#2563EB';
  return '#64748B';
};

export function AuditLogsScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tableFilter, setTableFilter] = useState('');
  const filterRef = React.useRef('');
  const [loading, setLoading] = useState(false);

  const loadLogs = useCallback(async (explicitFilter?: string) => {
    if (!hasPermission('voir_audit_logs')) return;
    setLoading(true);
    try {
      const activeFilter = typeof explicitFilter === 'string' ? explicitFilter : filterRef.current;
      const response = await auditApi.getAll({
        limit: 200,
        ...(activeFilter.trim() ? { table_nom: activeFilter.trim() } : {}),
      });
      setLogs((response.data.data || []) as AuditLog[]);
    } catch {
      showAlert('error', 'Audit', 'Impossible de charger les logs de production.');
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  React.useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  useAutoRefresh(loadLogs, REFRESH_INTERVALS.DASHBOARD, hasPermission('voir_audit_logs'));

  const subtitle = useMemo(
    () => `${logs.length} evenement(s) • ${loading ? 'synchronisation...' : 'en direct'}`,
    [logs.length, loading]
  );

  if (!hasPermission('voir_audit_logs')) {
    return (
      <ScreenWrapper>
        <AppHeader
          title="Audit logs"
          subtitle="Accès restreint"
          rightActions={
            <PdfExportButton
              title="Export audit"
              rows={[{ statut: 'Accès réfusé' }]}
              columns={[{ key: 'statut', label: 'Statut', value: (r) => r.statut }]}
            />
          }
        />
        <Text style={{ color: colors.textMuted }}>
          Votre rôle ne permet pas d'afficher les journaux d'audit.
        </Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader
        title="Audit de production"
        subtitle={subtitle}
        rightActions={
          <PdfExportButton
            title="Export audit"
            rows={logs}
            filters={{ Table: tableFilter || 'Toutes' }}
            columns={[
              { key: 'id', label: 'ID', value: (l) => l.id_log },
              { key: 'date', label: 'Date', value: (l) => formatDateTime(l.horodatage) },
              { key: 'action', label: 'Action', value: (l) => l.action_type || '' },
              { key: 'table', label: 'Table', value: (l) => l.table_nom || '' },
              { key: 'user', label: 'Utilisateur', value: (l) => l.id_user || '' },
              { key: 'ip', label: 'IP', value: (l) => l.adresse_ip || '' },
            ]}
          />
        }
      />

      <AppCard title="Filtre">
        <AppInput
          label="Table (optionnel)"
          value={tableFilter}
          onChangeText={(value) => {
            setTableFilter(value);
            filterRef.current = value;
          }}
          placeholder="Ex: utilisateurs, services, rendez-vous"
        />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <AppButton label="Actualiser" onPress={() => loadLogs(tableFilter)} style={{ flex: 1 }} />
          <AppButton
            label="Reset"
            variant="outline"
            onPress={() => {
              setTableFilter('');
              filterRef.current = '';
              loadLogs('');
            }}
            style={{ flex: 1 }}
          />
        </View>
      </AppCard>

      <FlatList
        data={logs}
        keyExtractor={(item) => String(item.id_log)}
        refreshing={loading}
        onRefresh={() => loadLogs(tableFilter)}
        contentContainerStyle={{ paddingBottom: 16, gap: 10 }}
        renderItem={({ item }) => {
          const color = actionColor(item.action_type);
          return (
            <AppCard noPadding>
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 14 }}>
                    {item.action_type || 'Action'}
                  </Text>
                  <AppBadge label={item.table_nom || 'systeme'} color={`${color}20`} textColor={color} size="sm" />
                </View>
                <Text style={{ color: colors.textMuted, marginTop: 6, fontSize: 12 }}>
                  {formatDateTime(item.horodatage)} • IP: {item.adresse_ip || '-'}
                </Text>
                <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
                  Utilisateur: {item.id_user || 'systeme'}
                </Text>
                {!!item.description_details && (
                  <Text style={{ color: colors.text, marginTop: 8, fontSize: 12 }}>
                    {JSON.stringify(item.description_details)}
                  </Text>
                )}
              </View>
            </AppCard>
          );
        }}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>
                Aucun log disponible pour ce filtre.
              </Text>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
}
