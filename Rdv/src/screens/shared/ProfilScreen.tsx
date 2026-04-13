import React, { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { isNetworkError } from '../../api/errors';
import { utilisateursApi } from '../../api/utilisateurs.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppAvatar } from '../../components/ui/AppAvatar';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppSwitch } from '../../components/ui/AppSwitch';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { API_ORIGIN } from '../../utils/constants';
import { MediaOutbox } from '../../utils/mediaOutbox';
import { Storage } from '../../utils/storage';

export function ProfilScreen({ navigation }: { navigation?: any }) {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, updateUser, logout } = useAuth();

  const [nom, setNom] = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const entityKey = useMemo(() => (user ? `user-photo-${user.id_user}` : ''), [user]);
  const photoUri = useMemo(
    () => pendingPhotoUri ?? (user?.photo_path ? `${API_ORIGIN}/${user.photo_path}` : null),
    [pendingPhotoUri, user?.photo_path]
  );

  React.useEffect(() => {
    if (!entityKey) return;
    let mounted = true;

    const refreshPendingState = async () => {
      const pending = await MediaOutbox.getLatestForEntity(entityKey);
      if (!mounted) return;
      setPendingPhotoUri(pending?.localFilePath ?? null);
      setPendingSync(Boolean(pending));
    };

    refreshPendingState();
    const timer = setInterval(refreshPendingState, 4000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [entityKey]);

  const save = useCallback(async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await utilisateursApi.update(user.id_user, { nom, prenom, email });
      const updated = res.data?.data ?? res.data;
      updateUser(updated);
      await Storage.setUser({ ...(user as any), ...updated });
      setSuccess('Profil mis a jour.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Mise a jour impossible.');
    } finally {
      setSaving(false);
    }
  }, [email, nom, prenom, updateUser, user]);

  const uploadPhoto = useCallback(async (asset: { uri: string; name: string; type: string }) => {
    if (!user) return;

    const form = new FormData();
    form.append('photo', { uri: asset.uri, name: asset.name, type: asset.type } as any);
    const uploadId = MediaOutbox.buildUploadId();

    try {
      const res = await utilisateursApi.updatePhoto(user.id_user, form, uploadId);
      const photo_path = res.data?.data?.photo_path ?? res.data?.photo_path;

      if (photo_path) {
        await MediaOutbox.clearEntity(entityKey);
        setPendingPhotoUri(null);
        setPendingSync(false);
        updateUser({ photo_path });
        await Storage.setUser({ ...(user as any), photo_path });
        setSuccess('Photo mise a jour.');
      }
    } catch (e) {
      if (!isNetworkError(e)) throw e;

      const queued = await MediaOutbox.queueUpload({
        sourceUri: asset.uri,
        endpoint: `/utilisateurs/${user.id_user}/photo`,
        fieldName: 'photo',
        mime: asset.type,
        fileName: asset.name,
        entityId: user.id_user,
        entityKey,
      });

      setPendingPhotoUri(queued.localFilePath);
      setPendingSync(true);
      setSuccess('Photo enregistree localement. Elle sera envoyee des que le reseau revient.');
    }
  }, [entityKey, updateUser, user]);

  if (!user) {
    return (
      <ScreenWrapper scroll style={{ backgroundColor: colors.background }}>
        <AppHeader title="Profil" onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined} />
        <AppCard>
          <Text style={{ color: colors.textMuted }}>Aucune session active.</Text>
          <View style={{ marginTop: 12 }}>
            <AppButton label="Retour" variant="outline" onPress={() => navigation?.goBack?.()} />
          </View>
        </AppCard>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scroll style={{ backgroundColor: colors.background }}>
      <AppHeader
        title="Mon profil"
        subtitle={`Connecté en tant que ${user.type_user}`}
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export profil"
            rows={[{ nom, prenom, email, login: user.login, type_user: user.type_user, id_user: user.id_user }]}
            columns={[
              { key: 'id', label: 'ID', value: (r) => r.id_user },
              { key: 'nom', label: 'Nom', value: (r) => r.nom },
              { key: 'prenom', label: 'Prenom', value: (r) => r.prenom },
              { key: 'email', label: 'Email', value: (r) => r.email ?? '' },
              { key: 'login', label: 'Login', value: (r) => r.login },
              { key: 'type', label: 'Type', value: (r) => r.type_user },
            ]}
          />
        }
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarContainer}>
          <AppAvatar nom={user.nom} prenom={user.prenom} photoPath={photoUri} size={100} />
          <Text style={[styles.identityTitle, { color: colors.text }]}>{`${prenom} ${nom}`.trim() || user.login}</Text>
          <Text style={[styles.identitySubtitle, { color: colors.textMuted }]}>
            {email || 'Adresse e-mail non renseignee'}
          </Text>
        </View>

        {error && <Text style={[styles.message, { color: colors.danger }]}>{error}</Text>}
        {success && <Text style={[styles.message, { color: colors.success }]}>{success}</Text>}

        <AppCard title="Resume du compte">
          <View style={styles.summaryGrid}>
            <View style={[styles.summaryChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Identifiant</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{user.login}</Text>
            </View>
            <View style={[styles.summaryChip, { backgroundColor: colors.surfaceAlt, borderColor: colors.border }]}>
              <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>Role</Text>
              <Text style={[styles.summaryValue, { color: colors.text }]}>{user.type_user}</Text>
            </View>
          </View>
        </AppCard>

        <AppCard title="Informations">
          <AppInput label="Prenom" value={prenom} onChangeText={setPrenom} required />
          <AppInput label="Nom" value={nom} onChangeText={setNom} required />
          <AppInput label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />

          <View style={{ marginTop: 16 }}>
            <AppButton
              label={saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              fullWidth
              loading={saving}
              onPress={save}
            />
          </View>
        </AppCard>

        <ImageUploadField
          title="Photo"
          subtitle="Sélection via la galérie du téléphone"
          imageUri={photoUri}
          pendingSync={pendingSync}
          onUpload={uploadPhoto}
          placeholderEmoji="P"
        />

        <AppCard title="Préférences">
          <AppSwitch value={isDark} onToggle={toggleTheme} label="Mode sombre" />
          <View style={{ marginTop: 12 }}>
            <AppButton label="Voir synchronisation" variant="outline" onPress={() => navigation?.navigate?.('Synchronisation')} />
          </View>
        </AppCard>

        <AppCard>
          <AppButton label="Se déconnecter" variant="danger" fullWidth onPress={logout} />
        </AppCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 16, paddingBottom: 40 },
  message: { marginBottom: 12, fontWeight: '600' },
  avatarContainer: { alignItems: 'center', marginBottom: 24, gap: 6 },
  identityTitle: { fontSize: 22, fontWeight: '800', marginTop: 10 },
  identitySubtitle: { fontSize: 13, textAlign: 'center' },
  summaryGrid: { flexDirection: 'row', gap: 12 },
  summaryChip: { flex: 1, borderWidth: 1, borderRadius: 16, padding: 14 },
  summaryLabel: { fontSize: 12, marginBottom: 6, fontWeight: '700' },
  summaryValue: { fontSize: 15, fontWeight: '800' },
});
