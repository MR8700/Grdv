import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { showAlert } from '../../components/ui/AppAlert';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { utilisateursApi } from '../../api/utilisateurs.api';
import { adminApi } from '../../api/admin.api';
import { servicesApi } from '../../api/services.api';
import { Service, Utilisateur, TypeUser } from '../../types/models.types';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';

interface RoleItem {
  id_role: number;
  nom_role: TypeUser;
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
  code_rpps: string;
  specialite_principale: string;
  id_services_affectes: string[];
  niveau_acces: string;
  num_secu_sociale: string;
  groupe_sanguin: string;
}

const initialForm: FormState = {
  nom: '',
  prenom: '',
  email: '',
  login: '',
  type_user: 'patient',
  password: '',
  code_rpps: '',
  specialite_principale: '',
  id_services_affectes: [],
  niveau_acces: '1',
  num_secu_sociale: '',
  groupe_sanguin: '',
};

export function UtilisateurDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { hasPermission, startImpersonation } = useAuth();

  const idUser = route.params?.id_user;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [targetUser, setTargetUser] = useState<Utilisateur | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [justification, setJustification] = useState('');

  const updateForm = useCallback((k: keyof FormState, v: any) => {
    setForm((p) => ({ ...p, [k]: v }));
  }, []);

  // ✅ SAFE HYDRATE
  const hydrate = useCallback(async () => {
    try {
      setLoading(true);

      const [matrix, servicesRes] = await Promise.all([
        adminApi.getPermissionsMatrix(),
        servicesApi.getAll({ limit: 200 }),
      ]);

      const rolesData = matrix.data.data.roles ?? [];
      setRoles(rolesData);

      if (idUser) {
        const res = await utilisateursApi.getOne(idUser);
        const u: Utilisateur = res.data.data;

        setTargetUser(u);

        // 🔥 mapping propre (PAS spread direct)
        setForm({
          nom: u.nom ?? '',
          prenom: u.prenom ?? '',
          email: u.email ?? '',
          login: u.login ?? '',
          type_user: u.type_user,
          id_role: u.id_role,
          password: '',
          code_rpps: u.profil_medecin?.code_rpps ?? '',
          specialite_principale: u.profil_medecin?.specialite_principale ?? '',
          id_services_affectes: (u.profil_secretaire?.services_affectes ?? []).map(s => String(s.id_service)),
          niveau_acces: String(u.profil_administrateur?.niveau_acces ?? 1),
          num_secu_sociale: u.profil_patient?.num_secu_sociale ?? '',
          groupe_sanguin: u.profil_patient?.groupe_sanguin ?? '',
        });
      } else {
        setTargetUser(null);
        setForm(initialForm);
      }
    } catch {
      showAlert('error', 'Erreur', 'Chargement impossible');
    } finally {
      setLoading(false);
    }
  }, [idUser]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useAutoRefresh(hydrate, 30000, !!idUser);

  const selectedRole = useMemo(
    () => roles.find(r => r.id_role === form.id_role),
    [roles, form.id_role]
  );

  // ✅ VALIDATION FIXED
  const validate = useCallback(() => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.login.trim()) {
      showAlert('warning', 'Champs requis', 'Nom, prenom et login obligatoires');
      return false;
    }

    if (!idUser && !form.password.trim()) {
      showAlert('warning', 'Mot de passe requis', 'Créer un mot de passe est obligatoire');
      return false;
    }

    return true;
  }, [form, idUser]);

  // ✅ SUBMIT SAFE
  const submit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSaving(true);

      const payload = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim() || undefined,
        login: form.login.trim(),
        type_user: form.type_user,
        id_role: form.id_role,
        password: idUser ? undefined : form.password,
        id_services_affectes: form.id_services_affectes.map(Number),
      };

      if (idUser) {
        await utilisateursApi.update(idUser, payload);
      } else {
        await utilisateursApi.create(payload);
      }

      showAlert('success', 'Succès');
      await hydrate();
    } catch {
      showAlert('error', 'Erreur', 'Sauvegarde impossible');
    } finally {
      setSaving(false);
    }
  }, [form, idUser, validate, hydrate]);

  // ✅ IMPERSONATION SAFE
  const forceAccess = useCallback(async () => {
    if (!idUser || !justification.trim()) return;

    try {
      const res = await adminApi.forceImpersonation(idUser, justification);

      const data = res.data.data;

      await startImpersonation({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });

      navigation.navigate('AdminDrawer');
    } catch {
      showAlert('error', 'Erreur');
    }
  }, [idUser, justification]);

  if (loading) {
    return (
      <ScreenWrapper>
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll>
      <AppHeader
        title={idUser ? 'Utilisateur' : 'Créer utilisateur'}
        subtitle={idUser ? `#${idUser}` : 'Nouveau'}
        onBack={() => navigation.goBack()}
        rightActions={
          <PdfExportButton
            title="Export"
            rows={[form]}
            columns={[{ key: 'nom', label: 'Nom', value: (f) => f.nom }]}
          />
        }
      />

      <AppCard title="Infos">
        <AppInput label="Nom" value={form.nom} onChangeText={(v) => updateForm('nom', v)} />
        <AppInput label="Prenom" value={form.prenom} onChangeText={(v) => updateForm('prenom', v)} />
        <AppInput label="Login" value={form.login} onChangeText={(v) => updateForm('login', v)} />
      </AppCard>

      {selectedRole && (
        <AppCard title="Permissions">
          {selectedRole.permissions.map(p => (
            <AppBadge key={p.id_permission} label={p.nom_permission} />
          ))}
        </AppCard>
      )}

      {idUser && (
        <AppCard title="Impersonation">
          <AppInput
            label="Justification"
            value={justification}
            onChangeText={setJustification}
          />
          <AppButton label="Forcer accès" onPress={forceAccess} />
        </AppCard>
      )}

      <AppButton
        label={idUser ? 'Modifier' : 'Créer'}
        onPress={submit}
        loading={saving}
        style={{ marginTop: 20 }}
      />
    </ScreenWrapper>
  );
}