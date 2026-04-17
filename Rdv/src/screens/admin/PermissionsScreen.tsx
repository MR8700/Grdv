import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppSwitch } from '../../components/ui/AppSwitch';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { showAlert } from '../../components/ui/AppAlert';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { adminApi } from '../../api/admin.api';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { REFRESH_INTERVALS } from '../../utils/constants';
 
interface PermissionItem {
  id_permission: number;
  nom_permission: string;
  description?: string;
}

interface RoleItem {
  id_role: number;
  nom_role: string;
  permissions: PermissionItem[];
}

const GROUPS: Record<string, string> = {
  utilisateurs: 'Utilisateurs',
  rdv: 'Rendez-vous',
  planning: 'Planning',
  medical: 'Medical',
  clinique: 'Clinique',
  audit: 'Audit',
  navigation: 'Navigation compte',
  notifications: 'Notifications',
  admin: 'Administration',
};

const getGroupKey = (permissionName: string) => {
  if (permissionName.includes('utilisateur')) return 'utilisateurs';
  if (permissionName.includes('rdv')) return 'rdv';
  if (permissionName.includes('planning') || permissionName.includes('disponibilites')) return 'planning';
  if (permissionName.includes('dossier')) return 'medical';
  if (permissionName.includes('clinique') || permissionName.includes('services')) return 'clinique';
  if (permissionName.includes('audit')) return 'audit';
  if (permissionName.includes('navigation_compte')) return 'navigation';
  if (permissionName.includes('notification')) return 'notifications';
  if (permissionName.includes('attribuer')) return 'admin';
  return 'admin';
};

export function PermissionsScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();

  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [permissions, setPermissions] = useState<PermissionItem[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [draft, setDraft] = useState<Record<number, Set<number>>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const initialRoleAppliedRef = React.useRef(false);

  const selectedRole = roles.find((role) => role.id_role === selectedRoleId) || null;
  const selectedSet = useMemo(
    () => (selectedRoleId ? draft[selectedRoleId] || new Set<number>() : new Set<number>()),
    [draft, selectedRoleId]
  );

  const groupedPermissions = useMemo(() => {
    const map: Record<string, PermissionItem[]> = {};
    permissions.forEach((permission) => {
      const key = getGroupKey(permission.nom_permission);
      if (!map[key]) map[key] = [];
      map[key].push(permission);
    });
    return map;
  }, [permissions]);

  const exportRows = useMemo(
    () =>
      permissions.map((permission) => ({
        ...permission,
        group: getGroupKey(permission.nom_permission),
        active: selectedSet.has(permission.id_permission),
      })),
    [permissions, selectedSet]
  );

  const loadMatrix = useCallback(async () => {
    if (!hasPermission('attribuer_permissions')) return;
    setLoading(true);
    try {
      const response = await adminApi.getPermissionsMatrix();
      const data = response.data.data;
      const loadedRoles = (data.roles || []) as RoleItem[];
      const loadedPermissions = (data.permissions || []) as PermissionItem[];
      setRoles(loadedRoles);
      setPermissions(loadedPermissions);

      const nextDraft: Record<number, Set<number>> = {};
      loadedRoles.forEach((role) => {
        nextDraft[role.id_role] = new Set(role.permissions?.map((p) => p.id_permission) || []);
      });
      setDraft(nextDraft);

      if (!initialRoleAppliedRef.current && loadedRoles.length > 0) {
        initialRoleAppliedRef.current = true;
        setSelectedRoleId(loadedRoles[0].id_role);
      }
    } catch {
      showAlert('error', 'Erreur', 'Impossible de charger les permissions.');
    } finally {
      setLoading(false);
    }
  }, [hasPermission]);

  useEffect(() => {
    loadMatrix();
  }, [loadMatrix]);

  useAutoRefresh(loadMatrix, REFRESH_INTERVALS.DASHBOARD, hasPermission('attribuer_permissions'));

  const togglePermission = (permissionId: number) => {
    if (!selectedRoleId) return;
    setDraft((prev) => {
      const current = new Set(prev[selectedRoleId] || []);
      if (current.has(permissionId)) current.delete(permissionId);
      else current.add(permissionId);
      return { ...prev, [selectedRoleId]: current };
    });
  };

  const save = async () => {
    if (!selectedRoleId) return;
    setSaving(true);
    try {
      await adminApi.updateRolePermissions(selectedRoleId, [...selectedSet]);
      showAlert('success', 'Permissions mises a jour', 'Le role a ete enregistre avec succes.');
      await loadMatrix();
    } catch {
      showAlert('error', 'Echec sauvegarde', "Impossible d'enregistrer les permissions.");
    } finally {
      setSaving(false);
    }
  };

  if (!hasPermission('attribuer_permissions')) {
    return (
      <ScreenWrapper scroll={false}>
        <AppHeader
          title="Permissions RBAC"
          subtitle="Accès restreint"
          rightActions={
            <PdfExportButton
              title="Export permissions"
              rows={[{ statut: 'Accès réfusé' }]}
              columns={[{ key: 'statut', label: 'Statut', value: (r) => r.statut }]}
            />
          }
        />
        <View
          style={{
            borderRadius: 16,
            borderWidth: 1,
            borderColor: `${colors.warning}55`,
            backgroundColor: `${colors.warning}12`,
            padding: 16,
          }}
        >
          <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>
            Permission manquante
          </Text>
          <Text style={{ color: colors.textMuted }}>
            Votre compte ne dispose pas de `permissions requises`.
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll={true}>
      <AppHeader
        title="Permissions RBAC"
        subtitle="Attribution dynamique des droits"
        rightActions={
          <PdfExportButton
            title="Export permissions"
            rows={exportRows}
            filters={{ Role: selectedRole?.nom_role || 'Aucun' }}
            columns={[
              { key: 'id', label: 'ID', value: (p) => p.id_permission },
              { key: 'nom', label: 'Permission', value: (p) => p.nom_permission },
              { key: 'groupe', label: 'Groupe', value: (p) => GROUPS[p.group] || p.group },
              { key: 'actif', label: 'Active', value: (p) => (p.active ? 'Oui' : 'Non') },
              { key: 'desc', label: 'Description', value: (p) => p.description || '' },
            ]}
          />
        }
      />

      <View style={{ borderRadius: 16, padding: 14, borderWidth: 1, borderColor: `${colors.primary}30`, backgroundColor: `${colors.primary}10` }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, marginBottom: 4 }}>
          Matrice de permissions
        </Text>
        <Text style={{ color: colors.textMuted, fontSize: 12 }}>
          Les boutons s'activent selon le rôle selectionné, avec sauvegarde immediate en mémoire.
        </Text>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {roles.map((role) => {
            const active = selectedRoleId === role.id_role;
            const count = draft[role.id_role]?.size ?? role.permissions?.length ?? 0;
            return (
              <TouchableOpacity
                key={role.id_role}
                onPress={() => setSelectedRoleId(role.id_role)}
                style={{
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: active ? colors.primary : colors.border,
                  backgroundColor: active ? `${colors.primary}14` : colors.surface,
                  paddingHorizontal: 14,
                  paddingVertical: 9,
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 8,
                }}
              >
                <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '700' }}>
                  {role.nom_role}
                </Text>
                <AppBadge label={String(count)} color={colors.primary} textColor="#fff" size="sm" />
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true} contentContainerStyle={{ paddingBottom: 24 }}>
        {Object.entries(groupedPermissions).map(([groupKey, groupPermissions]) => (
          <View
            key={groupKey}
            style={{
              borderRadius: 16,
              borderWidth: 1,
              borderColor: colors.border,
              backgroundColor: colors.surface,
              overflow: 'hidden',
              marginBottom: 12,
            }}
          >
            <View
              style={{
                backgroundColor: `${colors.primary}12`,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Text style={{ color: colors.primary, fontWeight: '800' }}>{GROUPS[groupKey] || groupKey}</Text>
            </View>

            {groupPermissions.map((permission) => {
              const value = selectedSet.has(permission.id_permission);
              const locked = !selectedRoleId || saving || loading;
              return (
                <View
                  key={permission.id_permission}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottomWidth: 1,
                    borderBottomColor: colors.border,
                    paddingHorizontal: 12,
                    paddingVertical: 12,
                  }}
                >
                  <View style={{ flex: 1, paddingRight: 10 }}>
                    <Text style={{ color: colors.text, fontWeight: '600', fontSize: 13 }}>
                      {permission.nom_permission}
                    </Text>
                    {!!permission.description && (
                      <Text style={{ color: colors.textMuted, fontSize: 11, marginTop: 2 }}>
                        {permission.description}
                      </Text>
                    )}
                  </View>
                  <AppSwitch
                    value={value}
                    onToggle={() => {
                      if (!locked) togglePermission(permission.id_permission);
                    }}
                    label={locked ? 'Verrouillé' : value ? 'Active' : 'Inactive'}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <AppButton
        label={saving ? 'Enregistrement...' : 'Enregistrer les permissions'}
        onPress={save}
        loading={saving}
        disabled={!selectedRole || loading}
        fullWidth
      />
    </ScreenWrapper>
  );
}
