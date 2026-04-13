// screens/admin/UtilisateurDetailScreen.tsx
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { showAlert } from '../../components/ui/AppAlert';
import { AppDropdown } from '../../components/shared/AppDropdown';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { utilisateursApi } from '../../api/utilisateurs.api';
import { adminApi } from '../../api/admin.api';
import { Utilisateur, TypeUser } from '../../types/models.types';
import { TYPE_USER_LABELS } from '../../utils/constants';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface RoleItem {
  id_role: number;
  nom_role: string;
  permissions: Array<{ id_permission: number; nom_permission: string }>;
}

interface FormState {
  nom: string;
  prenom: string;
  email: string;
  login: string;
  type_user: TypeUser;
  id_role?: number;
  password: string;
}

const initialForm: FormState = {
  nom: '',
  prenom: '',
  email: '',
  login: '',
  type_user: 'patient',
  id_role: undefined,
  password: '',
};

export function UtilisateurDetailScreen({ navigation, route }: { navigation: any; route: any }) {
  const { colors } = useTheme();
  const { hasPermission, startImpersonation, user: currentUser } = useAuth();
  const idUser = route.params?.id_user;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [targetUser, setTargetUser] = useState<Utilisateur | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [form, setForm] = useState<FormState>(initialForm);
  const [justification, setJustification] = useState('');

  // Permissions
  const canCreate = hasPermission('creer_utilisateur');
  const canUpdate = hasPermission('modifier_utilisateur');
  const canRequestAccess = hasPermission('demander_navigation_compte');
  const canForceAccess = hasPermission('forcer_navigation_compte');

  // Role sélectionné et options dropdown
  const selectedRole = useMemo(
    () => roles.find((role) => role.id_role === form.id_role) || null,
    [roles, form.id_role]
  );

  const roleOptions = useMemo(
    () =>
      roles.map((role) => ({
        label: role.nom_role,
        value: String(role.id_role),
      })),
    [roles]
  );

  /** Chargement des données */
  const hydrate = useCallback(async () => {
    setLoading(true);
    try {
      const matrix = await adminApi.getPermissionsMatrix();
      const matrixRoles = (matrix.data.data.roles || []) as RoleItem[];
      setRoles(matrixRoles);

      if (idUser) {
        const response = await utilisateursApi.getOne(idUser);
        const user = response.data.data as Utilisateur;
        setTargetUser(user);
        const fallbackRole = matrixRoles.find((role) => role.nom_role === user.type_user);
        setForm({
          nom: user.nom || '',
          prenom: user.prenom || '',
          email: user.email || '',
          login: user.login || '',
          type_user: user.type_user,
          id_role: user.id_role || fallbackRole?.id_role,
          password: '',
        });
      } else if (matrixRoles.length > 0) {
        const defaultRole = matrixRoles.find((role) => role.nom_role === 'patient');
        setForm((prev) => ({ ...prev, id_role: defaultRole?.id_role }));
      }
    } catch {
      showAlert('error', 'Utilisateur', 'Impossible de charger les informations.');
    } finally {
      setLoading(false);
    }
  }, [idUser]);

  React.useEffect(() => {
    hydrate();
  }, [hydrate]);

  useAutoRefresh(hydrate, 30000, Boolean(idUser));

  /** Gestion changement de rôle */
  const onRoleChange = (roleId: number) => {
    const role = roles.find((r) => r.id_role === roleId);
    if (!role) return;
    setForm((prev) => ({
      ...prev,
      id_role: role.id_role,
      type_user: role.nom_role as TypeUser,
    }));
  };

  /** Validation formulaire */
  const validate = () => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.login.trim()) {
      showAlert('warning', 'Champs requis', 'Nom, prenom et login sont obligatoires.');
      return false;
    }
    if (!idUser && !form.password.trim()) {
      showAlert('warning', 'Mot de passe requis', 'Veuillez renseigner un mot de passe.');
      return false;
    }
    if (!form.id_role) {
      showAlert('warning', 'Role requis', 'Selectionnez un role pour cet utilisateur.');
      return false;
    }
    return true;
  };

  /** Soumission formulaire */
  const submit = async () => {
    if (!validate()) return;

    setSaving(true);
    try {
      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim() || undefined,
        login: form.login.trim(),
        type_user: form.type_user,
        id_role: form.id_role,
        ...(idUser ? {} : { password: form.password }),
      };

      if (idUser) {
        if (!canUpdate) {
          showAlert('warning', 'Action non autorisee', 'Permission modifier_utilisateur manquante.');
          return;
        }
        await utilisateursApi.update(idUser, payload);
        showAlert('success', 'Utilisateur mis a jour');
      } else {
        if (!canCreate) {
          showAlert('warning', 'Action non autorisee', 'Permission creer_utilisateur manquante.');
          return;
        }
        await utilisateursApi.create(payload);
        showAlert('success', 'Utilisateur cree');
      }
      await hydrate();
    } catch {
      showAlert('error', 'Sauvegarde impossible', "Verifiez les donnees puis reessayez.");
    } finally {
      setSaving(false);
    }
  };

  /** Demande navigation compte */
  const requestAccess = async () => {
    if (!idUser || !canRequestAccess || !justification.trim()) return;

    setSaving(true);
    try {
      await adminApi.requestImpersonation(idUser, justification.trim());
      showAlert('success', 'Demande envoyee', "L'utilisateur a recu une notification.");
    } catch {
      showAlert('error', 'Demande echouee', 'Impossible de notifier cet utilisateur.');
    } finally {
      setSaving(false);
    }
  };

  /** Forcage navigation compte */
  const forceAccess = async () => {
    if (!idUser || !canForceAccess || !justification.trim()) return;

    setSaving(true);
    try {
      const response = await adminApi.forceImpersonation(idUser, justification.trim());
      const data = response.data.data;
      await startImpersonation({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user as Utilisateur,
      });
      showAlert('success', 'Navigation forcee', 'Session basculee vers le compte utilisateur cible.');
      navigation.navigate('AdminDrawer');
    } catch {
      showAlert('error', 'Forcage refuse', "Impossible de forcer l'acces a ce compte.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenWrapper>
      <AppHeader
        title={idUser ? 'Compte utilisateur' : 'Ajouter utilisateur'}
        subtitle={loading ? 'Chargement...' : idUser ? `ID #${idUser}` : 'Creation'}
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export fiche utilisateur"
            rows={[form]}
            filters={{ Mode: idUser ? 'Edition' : 'Création' }}
            columns={[
              { key: 'nom', label: 'Nom', value: (f) => f.nom },
              { key: 'prenom', label: 'Prenom', value: (f) => f.prenom },
              { key: 'email', label: 'Email', value: (f) => f.email || '' },
              { key: 'login', label: 'Login', value: (f) => f.login },
              { key: 'type', label: 'Type', value: (f) => f.type_user },
              { key: 'role', label: 'Role ID', value: (f) => f.id_role || '' },
            ]}
          />
        }
      />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
        {/* === Informations principales === */}
        <AppCard title="Informations principales">
          <AppInput label="Nom" value={form.nom} onChangeText={(v) => setForm((prev) => ({ ...prev, nom: v }))} required />
          <AppInput label="Prenom" value={form.prenom} onChangeText={(v) => setForm((prev) => ({ ...prev, prenom: v }))} required />
          <AppInput label="Email" value={form.email} onChangeText={(v) => setForm((prev) => ({ ...prev, email: v }))} keyboardType="email-address" />
          <AppInput label="Login" value={form.login} onChangeText={(v) => setForm((prev) => ({ ...prev, login: v }))} required />
          {!idUser && <AppInput label="Mot de passe initial" value={form.password} onChangeText={(v) => setForm((prev) => ({ ...prev, password: v }))} secureTextEntry required />}
        </AppCard>

        {/* === Attribution de rôle === */}
        <AppCard title="Attribution de role">
          <AppDropdown label="Role principal" value={form.id_role ? String(form.id_role) : ''} options={roleOptions} onValueChange={(value) => onRoleChange(Number(value))} />

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
            {roles.map((role) => {
              const active = role.id_role === form.id_role;
              return (
                <TouchableOpacity
                  key={role.id_role}
                  onPress={() => onRoleChange(role.id_role)}
                  style={{
                    borderRadius: 18,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                    backgroundColor: active ? `${colors.primary}18` : colors.surfaceAlt,
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                  }}
                >
                  <Text style={{ color: active ? colors.primary : colors.text, fontWeight: '700' }}>{role.nom_role}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {selectedRole && (
            <View style={{ marginTop: 12, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 10, backgroundColor: colors.surfaceAlt }}>
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8 }}>Permissions accordées ({selectedRole.permissions?.length || 0})</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                {(selectedRole.permissions || []).map((perm) => (
                  <AppBadge key={perm.id_permission} label={perm.nom_permission} color={`${colors.primary}1B`} textColor={colors.primary} size="sm" />
                ))}
              </View>
            </View>
          )}
        </AppCard>

        {/* === Navigation sur compte utilisateur (Admin) === */}
        {idUser && (
          <AppCard title="Navigation sur compte utilisateur" subtitle="Workflow demande puis forcage admin">
            <AppInput label="Justification" value={justification} onChangeText={setJustification} multiline required />

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
              <AppButton label="Demander permission" onPress={requestAccess} loading={saving} disabled={!canRequestAccess || currentUser?.id_user === idUser} style={{ flex: 1 }} />
              <AppButton label="Forcer (Rouge)" variant="danger" onPress={forceAccess} loading={saving} disabled={!canForceAccess || currentUser?.id_user === idUser} style={{ flex: 1 }} />
            </View>

            <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 8 }}>
              Le forcage envoie automatiquement une notification à l'utilisateur cible avec votre justification.
            </Text>
          </AppCard>
        )}

        {/* === Footer - Bouton principal === */}
        <View style={{ marginTop: 12 }}>
          <AppButton label={idUser ? 'Enregistrer les modifications' : 'Creer le compte'} onPress={submit} loading={saving} fullWidth disabled={idUser ? !canUpdate : !canCreate} />
        </View>

        {/* === Etat du compte === */}
        {targetUser && (
          <View style={{ marginTop: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, borderRadius: 14, padding: 12 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Etat du compte</Text>
            <Text style={{ color: colors.textMuted, marginTop: 4 }}>
              {targetUser.statut} • type: {TYPE_USER_LABELS[targetUser.type_user]}
            </Text>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}
