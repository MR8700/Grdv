import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator } from 'react-native';
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
  return Number.isNaN(date.getTime())
    ? value
    : `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
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

  // ✅ Permission calculée UNE FOIS
  const canView = hasPermission('voir_audit_logs');

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [tableFilter, setTableFilter] = useState('');
  const filterRef = useRef<string>('');
  const [loading, setLoading] = useState(false);

  const isMounted = useRef(true);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // 🔁 Load logs sécurisé
  const loadLogs = useCallback(async (explicitFilter?: string) => {
    if (!canView) return;

    setLoading(true);
    try {
      const activeFilter =
        typeof explicitFilter === 'string'
          ? explicitFilter
          : filterRef.current;

      const response = await auditApi.getAll({
        limit: 200,
        ...(activeFilter.trim() && { table_nom: activeFilter.trim() }),
      });

      if (isMounted.current) {
        setLogs(response?.data?.data ?? []);
      }
    } catch (error: any) {
      showAlert(
        'error',
        'Audit',
        error?.response?.data?.message || 'Erreur de chargement'
      );
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [canView]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  // ✅ Hook stable
  useAutoRefresh(loadLogs, REFRESH_INTERVALS.DASHBOARD, canView);

  const subtitle = useMemo(() => {
    return loading
      ? 'Synchronisation...'
      : `${logs.length} événement(s) • en direct`;
  }, [logs.length, loading]);

  const renderItem = useCallback(({ item }: { item: AuditLog }) => {
    const color = actionColor(item.action_type);

    return (
      <AppCard noPadding>
        <View style={{ padding: 14 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>
              {item.action_type || 'Action'}
            </Text>

            <AppBadge
              label={item.table_nom || 'systeme'}
              color={`${color}20`}
              textColor={color}
              size="sm"
            />
          </View>

          <Text style={{ color: colors.textMuted, marginTop: 6 }}>
            {formatDateTime(item.horodatage)} • IP: {item.adresse_ip || '-'}
          </Text>

          <Text style={{ color: colors.textMuted }}>
            User: {item.id_user || 'systeme'}
          </Text>

          {!!item.description_details && (
            <Text
              style={{ color: colors.text, marginTop: 6 }}
              numberOfLines={2}
            >
              {typeof item.description_details === 'object'
                ? '[Détails disponibles]'
                : item.description_details}
            </Text>
          )}
        </View>
      </AppCard>
    );
  }, [colors]);

  const keyExtractor = useCallback(
    (item: AuditLog) => String(item.id_log),
    []
  );

  return (
    <ScreenWrapper>
      {!canView ? (
        <>
          <AppHeader title="Audit logs" subtitle="Accès restreint" />
          <Text style={{ color: colors.textMuted }}>Accès refusé</Text>
        </>
      ) : (
        <>
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
              label="Table"
              value={tableFilter}
              onChangeText={(value) => {
                setTableFilter(value);
                filterRef.current = value;
              }}
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

          {loading && logs.length === 0 ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <FlatList
              data={logs}
              keyExtractor={keyExtractor}
              renderItem={renderItem}
              refreshing={loading}
              onRefresh={() => loadLogs(tableFilter)}
              contentContainerStyle={{ paddingBottom: 16 }}
              initialNumToRender={10}
              windowSize={5}
              removeClippedSubviews
              ListEmptyComponent={
                <Text style={{ textAlign: 'center', marginTop: 20, color: colors.textMuted }}>
                  Aucun log trouvé
                </Text>
              }
            />
          )}
        </>
      )}
    </ScreenWrapper>
  );
}