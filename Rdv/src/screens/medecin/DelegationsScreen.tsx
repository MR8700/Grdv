import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { medecinsApi } from '../../api/medecins.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppLoader } from '../../components/ui/AppLoader';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { Toast } from '../../components/ui/AppAlert';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

interface DelegationPermissionItem {
  id_permission: number;
  nom_permission: string;
  description?: string;
}

interface DelegationSecretaryItem {
  id_user: number;
  id_service_affecte?: number;
  selected_permission_ids: number[];
  utilisateur?: {
    nom?: string;
    prenom?: string;
    email?: string;
  };
  services_affectes?: Array<{ id_service: number; nom_service: string }>;
}

export function DelegationsScreen({ navigation }: { navigation?: any }) {
  const { user, reloadMe } = useAuth();
  const { colors } = useTheme();
  const [permissions, setPermissions] = useState<DelegationPermissionItem[]>([]);
  const [secretaires, setSecretaires] = useState<DelegationSecretaryItem[]>([]);
  const [draft, setDraft] = useState<Record<number, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [savingSecretaryId, setSavingSecretaryId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadDelegations = useCallback(async () => {
    if (!user?.id_user) return;

    try {
      setLoading(true);
      setError(null);
      const response = await medecinsApi.getDelegations(user.id_user);
      const payload = response.data.data as {
        permissions: DelegationPermissionItem[];
        secretaires: DelegationSecretaryItem[];
      };

      setPermissions(payload.permissions || []);
      setSecretaires(payload.secretaires || []);
      setDraft(
        Object.fromEntries(
          (payload.secretaires || []).map((secretary) => [secretary.id_user, secretary.selected_permission_ids || []])
        )
      );
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Impossible de charger les delegations.');
    } finally {
      setLoading(false);
    }
  }, [user?.id_user]);

  useEffect(() => {
    loadDelegations();
  }, [loadDelegations]);

  const togglePermission = useCallback((secretaryId: number, permissionId: number) => {
    setDraft((current) => {
      const selected = new Set(current[secretaryId] || []);
      if (selected.has(permissionId)) selected.delete(permissionId);
      else selected.add(permissionId);

      return {
        ...current,
        [secretaryId]: [...selected],
      };
    });
  }, []);

  const saveDelegation = useCallback(async (secretaryId: number) => {
    if (!user?.id_user) return;

    try {
      setSavingSecretaryId(secretaryId);
      await medecinsApi.updateDelegation(user.id_user, secretaryId, draft[secretaryId] || []);
      await reloadMe();
      Toast.success('Delegation enregistrée', 'Les permissions du secretaire ont été mises a jour.');
      await loadDelegations();
    } catch (err: any) {
      Toast.error('Enregistrement impossible', err?.response?.data?.message ?? 'La délégation n\'a pas pu être sauvegardée.');
    } finally {
      setSavingSecretaryId(null);
    }
  }, [draft, loadDelegations, reloadMe, user?.id_user]);

  const hasSecretaries = useMemo(() => secretaires.length > 0, [secretaires]);

  if (loading) {
    return (
      <ScreenWrapper scroll={false}>
        <AppLoader message="Chargement des délégation..." />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll onRefresh={loadDelegations} refreshing={loading} contentStyle={{ paddingBottom: 120 }}>
      <AppHeader
        title="délégations de secretaire"
        subtitle="Vous choisissez quelles permissions de votre role sont transmises à chaque sécrétaire"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <AppCard
        title="Cadre de délégation"
        subtitle="Les permissions visibles ici viennent de votre rôle médecin. Le sécrétaire ne recoit que ce que vous cochez."
      >
        <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
          Les sécrétaires affichés sont limites à vos services. Le rôle definit le maximum autorisable, puis vous choisissez la délégation effective.
        </Text>
      </AppCard>

      {error ? <Text style={{ color: colors.danger }}>{error}</Text> : null}

      {!hasSecretaries ? (
        <AppEmpty
          subtitle="Aucun secretaire rattache a vos services pour le moment."
          onRetry={loadDelegations}
        />
      ) : (
        secretaires.map((secretary) => {
          const selectedIds = draft[secretary.id_user] || [];
          const fullName = `${secretary.utilisateur?.prenom || ''} ${secretary.utilisateur?.nom || ''}`.trim();

          return (
            <AppCard
              key={secretary.id_user}
              title={fullName || `Secretaire #${secretary.id_user}`}
              subtitle={secretary.utilisateur?.email || 'Aucun email'}
            >
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 14 }}>
                {(secretary.services_affectes || []).map((service) => (
                  <View
                    key={service.id_service}
                    style={{
                      borderRadius: 999,
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      backgroundColor: `${colors.primary}12`,
                      borderWidth: 1,
                      borderColor: `${colors.primary}26`,
                    }}
                  >
                    <Text style={{ color: colors.primary, fontWeight: '700', fontSize: 12 }}>{service.nom_service}</Text>
                  </View>
                ))}
              </View>

              <View style={{ gap: 10 }}>
                {permissions.map((permission) => {
                  const active = selectedIds.includes(permission.id_permission);

                  return (
                    <TouchableOpacity
                      key={permission.id_permission}
                      onPress={() => togglePermission(secretary.id_user, permission.id_permission)}
                      style={{
                        borderRadius: 20,
                        padding: 14,
                        borderWidth: 1,
                        borderColor: active ? `${colors.primary}55` : colors.border,
                        backgroundColor: active ? `${colors.primary}14` : colors.surfaceAlt,
                      }}
                    >
                      <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '800' }}>
                        {permission.nom_permission}
                      </Text>
                      {permission.description ? (
                        <Text style={{ color: colors.textMuted, marginTop: 4, lineHeight: 18 }}>
                          {permission.description}
                        </Text>
                      ) : null}
                    </TouchableOpacity>
                  );
                })}
              </View>

              <AppButton
                label="Enregistrer la delegation"
                onPress={() => saveDelegation(secretary.id_user)}
                loading={savingSecretaryId === secretary.id_user}
                fullWidth
                style={{ marginTop: 16 }}
              />
            </AppCard>
          );
        })
      )}
    </ScreenWrapper>
  );
}
