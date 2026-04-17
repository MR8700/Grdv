import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppCard } from '../../components/ui/AppCard';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppBadge } from '../../components/ui/AppBadge';
import { showAlert } from '../../components/ui/AppAlert';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { AppDropdown } from '../../components/shared/AppDropdown';
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
  statut: string;
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
  statut: 'actif',
  password: '',
  code_rpps: '',
  specialite_principale: '',
  id_services_affectes: [],
  niveau_acces: '1',
  num_secu_sociale: '',
  groupe_sanguin: '',
};

const typeOptions = [
  { label: 'Patient', value: 'patient' },
  { label: 'Médecin', value: 'medecin' },
  { label: 'Secrétaire', value: 'secretaire' },
  { label: 'Administrateur', value: 'administrateur' },
];

const statusOptions = [
  { label: 'Actif', value: 'actif' },
  { label: 'Suspendu', value: 'suspendu' },
  { label: 'Archivé', value: 'archive' },
];

const bloodOptions = [
  { label: 'A+', value: 'A+' },
  { label: 'A-', value: 'A-' },
  { label: 'B+', value: 'B+' },
  { label: 'B-', value: 'B-' },
  { label: 'O+', value: 'O+' },
  { label: 'O-', value: 'O-' },
  { label: 'AB+', value: 'AB+' },
  { label: 'AB-', value: 'AB-' },
];

export function UtilisateurDetailScreen({ navigation, route }: any) {
  const { colors } = useTheme();
  const { hasPermission, startImpersonation } = useAuth();
  const idUser = route.params?.id_user;

  const canForceAccess = hasPermission('forcer_navigation_compte');
  const canRequestAccess = hasPermission('demander_navigation_compte');
  const canArchiveUser = hasPermission('archiver_utilisateur');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<'request' | 'force' | 'archive' | null>(null);
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [targetUser, setTargetUser] = useState<Utilisateur | null>(null);
  const [form, setForm] = useState<FormState>(initialForm);
  const [justification, setJustification] = useState('');

  const updateForm = useCallback((key: keyof FormState, value: any) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  }, []);

  const hydrate = useCallback(async () => {
    try {
      setLoading(true);

      const [matrix, servicesRes] = await Promise.all([
        adminApi.getPermissionsMatrix(),
        servicesApi.getAll({ limit: 200 }),
      ]);

      const rolesData = matrix.data.data.roles ?? [];
      setRoles(rolesData);
      setServices((servicesRes.data.data ?? servicesRes.data?.rows ?? servicesRes.data ?? []) as Service[]);

      if (idUser) {
        const res = await utilisateursApi.getOne(idUser);
        const u: Utilisateur = res.data.data;
        setTargetUser(u);
        setForm({
          nom: u.nom ?? '',
          prenom: u.prenom ?? '',
          email: u.email ?? '',
          login: u.login ?? '',
          type_user: u.type_user,
          statut: u.statut,
          id_role: u.id_role,
          password: '',
          code_rpps: u.profil_medecin?.code_rpps ?? '',
          specialite_principale: u.profil_medecin?.specialite_principale ?? '',
          id_services_affectes: (u.profil_secretaire?.services_affectes ?? []).map((service) => String(service.id_service)),
          niveau_acces: String(u.profil_administrateur?.niveau_acces ?? 1),
          num_secu_sociale: u.profil_patient?.num_secu_sociale ?? '',
          groupe_sanguin: u.profil_patient?.groupe_sanguin ?? '',
        });
      } else {
        setTargetUser(null);
        setForm(initialForm);
      }
    } catch {
      showAlert('error', 'Erreur', 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [idUser]);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  useAutoRefresh(hydrate, 30000, !!idUser);

  const selectedRole = useMemo(
    () => roles.find((role) => role.id_role === form.id_role),
    [form.id_role, roles]
  );

  const roleOptions = useMemo(
    () => roles.map((role) => ({ label: role.nom_role, value: String(role.id_role) })),
    [roles]
  );

  const serviceOptions = useMemo(
    () => services.map((service) => ({ label: service.nom_service, value: String(service.id_service) })),
    [services]
  );

  const validate = useCallback(() => {
    if (!form.nom.trim() || !form.prenom.trim() || !form.login.trim()) {
      showAlert('warning', 'Champs requis', 'Nom, prénom et login sont obligatoires.');
      return false;
    }

    if (!idUser && !form.password.trim()) {
      showAlert('warning', 'Mot de passe requis', 'Un mot de passe est obligatoire à la création.');
      return false;
    }

    return true;
  }, [form, idUser]);

  const submit = useCallback(async () => {
    if (!validate()) return;

    try {
      setSaving(true);
      const payload: Record<string, any> = {
        nom: form.nom.trim(),
        prenom: form.prenom.trim(),
        email: form.email.trim() || undefined,
        login: form.login.trim(),
        type_user: form.type_user,
        statut: form.statut,
        id_role: form.id_role,
      };

      if (!idUser) {
        payload.password = form.password;
      }

      if (form.type_user === 'medecin') {
        payload.code_rpps = form.code_rpps.trim();
        payload.specialite_principale = form.specialite_principale.trim() || undefined;
      }

      if (form.type_user === 'secretaire') {
        payload.id_services_affectes = form.id_services_affectes.map(Number);
        payload.id_service_affecte = payload.id_services_affectes[0] ?? null;
      }

      if (form.type_user === 'administrateur') {
        payload.niveau_acces = Number(form.niveau_acces || 1);
      }

      if (form.type_user === 'patient') {
        payload.num_secu_sociale = form.num_secu_sociale.trim() || undefined;
        payload.groupe_sanguin = form.groupe_sanguin || undefined;
      }

      if (idUser) await utilisateursApi.update(idUser, payload);
      else await utilisateursApi.create(payload);

      showAlert('success', 'Succès', 'Utilisateur enregistré.');
      await hydrate();
    } catch (err: any) {
      showAlert('error', 'Erreur', err?.response?.data?.message ?? 'Sauvegarde impossible.');
    } finally {
      setSaving(false);
    }
  }, [form, hydrate, idUser, validate]);

  const requestAccess = useCallback(async () => {
    if (!idUser || !justification.trim()) return;

    try {
      setActionLoading('request');
      await adminApi.requestImpersonation(idUser, justification.trim());
      showAlert('success', 'Demande envoyée', 'La demande de navigation a été transmise à l’utilisateur.');
    } catch (err: any) {
      showAlert('error', 'Erreur', err?.response?.data?.message ?? 'Demande impossible.');
    } finally {
      setActionLoading(null);
    }
  }, [idUser, justification]);

  const forceAccess = useCallback(async () => {
    if (!idUser || !justification.trim()) return;

    try {
      setActionLoading('force');
      const res = await adminApi.forceImpersonation(idUser, justification.trim());
      const data = res.data.data;
      await startImpersonation({
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        user: data.user,
      });
      navigation.navigate('AdminDrawer');
    } catch (err: any) {
      showAlert('error', 'Erreur', err?.response?.data?.message ?? 'Accès forcé impossible.');
    } finally {
      setActionLoading(null);
    }
  }, [idUser, justification, navigation, startImpersonation]);

  const archiveUser = useCallback(async () => {
    if (!idUser) return;

    try {
      setActionLoading('archive');
      await utilisateursApi.archive(idUser);
      showAlert('success', 'Compte archivé', 'Le compte a été archivé.');
      await hydrate();
    } catch (err: any) {
      showAlert('error', 'Erreur', err?.response?.data?.message ?? 'Archivage impossible.');
    } finally {
      setActionLoading(null);
    }
  }, [hydrate, idUser]);

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
        title={idUser ? 'Utilisateur' : 'Créer un utilisateur'}
        subtitle={idUser ? `#${idUser}` : 'Nouveau compte'}
        onBack={() => navigation.goBack()}
        rightActions={
          <PdfExportButton
            title="Export"
            rows={[form]}
            columns={[
              { key: 'nom', label: 'Nom', value: (f: FormState) => f.nom },
              { key: 'prenom', label: 'Prénom', value: (f: FormState) => f.prenom },
              { key: 'type', label: 'Type', value: (f: FormState) => f.type_user },
            ]}
          />
        }
      />

      <AppCard title="Compte">
        <AppInput label="Nom" value={form.nom} onChangeText={(v) => updateForm('nom', v)} />
        <AppInput label="Prénom" value={form.prenom} onChangeText={(v) => updateForm('prenom', v)} />
        <AppInput label="Login" value={form.login} onChangeText={(v) => updateForm('login', v)} autoCapitalize="none" />
        <AppInput label="E-mail" value={form.email} onChangeText={(v) => updateForm('email', v)} autoCapitalize="none" />
        {!idUser ? (
          <AppInput label="Mot de passe" value={form.password} onChangeText={(v) => updateForm('password', v)} secureTextEntry />
        ) : null}
        <AppDropdown label="Type de compte" value={form.type_user} onValueChange={(v) => updateForm('type_user', v as TypeUser)} options={typeOptions} />
        <AppDropdown label="Statut" value={form.statut} onValueChange={(v) => updateForm('statut', v)} options={statusOptions} />
        {roleOptions.length > 0 ? (
          <AppDropdown
            label="Rôle"
            value={String(form.id_role ?? roleOptions[0]?.value ?? '')}
            onValueChange={(v) => updateForm('id_role', Number(v))}
            options={roleOptions}
          />
        ) : null}
      </AppCard>

      {form.type_user === 'medecin' ? (
        <AppCard title="Profil médecin">
          <AppInput label="Code RPPS" value={form.code_rpps} onChangeText={(v) => updateForm('code_rpps', v)} />
          <AppInput label="Spécialité principale" value={form.specialite_principale} onChangeText={(v) => updateForm('specialite_principale', v)} />
        </AppCard>
      ) : null}

      {form.type_user === 'secretaire' ? (
        <AppCard title="Profil secrétaire" subtitle="Sélection du service principal">
          {serviceOptions.length > 0 ? (
            <AppDropdown
              label="Service principal"
              value={form.id_services_affectes[0] ?? serviceOptions[0].value}
              onValueChange={(v) => updateForm('id_services_affectes', [v])}
              options={serviceOptions}
            />
          ) : (
            <Text style={{ color: colors.textMuted }}>Aucun service disponible.</Text>
          )}
        </AppCard>
      ) : null}

      {form.type_user === 'administrateur' ? (
        <AppCard title="Profil administrateur">
          <AppInput label="Niveau d'accès" value={form.niveau_acces} onChangeText={(v) => updateForm('niveau_acces', v)} keyboardType="numeric" />
        </AppCard>
      ) : null}

      {form.type_user === 'patient' ? (
        <AppCard title="Profil patient">
          <AppInput label="Numéro de sécurité sociale" value={form.num_secu_sociale} onChangeText={(v) => updateForm('num_secu_sociale', v)} />
          <AppDropdown label="Groupe sanguin" value={form.groupe_sanguin || bloodOptions[0].value} onValueChange={(v) => updateForm('groupe_sanguin', v)} options={bloodOptions} />
        </AppCard>
      ) : null}

      {selectedRole ? (
        <AppCard title="Permissions du rôle">
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {selectedRole.permissions.map((permission) => (
              <AppBadge
                key={permission.id_permission}
                label={permission.nom_permission}
                color={`${colors.primary}18`}
                textColor={colors.primary}
              />
            ))}
          </View>
        </AppCard>
      ) : null}

      {idUser ? (
        <AppCard title="Navigation administrateur" subtitle="Demande ou forçage de navigation sur le compte">
          <AppInput
            label="Justification"
            value={justification}
            onChangeText={setJustification}
            placeholder="Expliquez pourquoi vous demandez ou forcez l'accès"
          />
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {canRequestAccess ? (
              <AppButton
                label="Demander l'accès"
                variant="outline"
                style={{ flex: 1 }}
                loading={actionLoading === 'request'}
                onPress={requestAccess}
              />
            ) : null}
            {canForceAccess ? (
              <AppButton
                label="Forcer l'accès"
                style={{ flex: 1 }}
                loading={actionLoading === 'force'}
                onPress={forceAccess}
              />
            ) : null}
          </View>
          {canArchiveUser && targetUser?.statut !== 'archive' ? (
            <View style={{ marginTop: 8 }}>
              <AppButton
                label="Archiver le compte"
                variant="danger"
                loading={actionLoading === 'archive'}
                onPress={archiveUser}
              />
            </View>
          ) : null}
        </AppCard>
      ) : null}

      <AppButton
        label={idUser ? 'Enregistrer les modifications' : 'Créer le compte'}
        onPress={submit}
        loading={saving}
        style={{ marginTop: 8 }}
      />
    </ScreenWrapper>
  );
}
