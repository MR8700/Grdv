import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { resolveAssetUri } from '../../utils/assets';
import { MediaOutbox } from '../../utils/mediaOutbox';
import { Storage } from '../../utils/storage';

export function ProfilScreen({ navigation }: { navigation?: any }) {
  const { colors, toggleTheme, isDark } = useTheme();
  const { user, updateUser, logout } = useAuth();

  const [nom, setNom] = useState(user?.nom ?? '');
  const [prenom, setPrenom] = useState(user?.prenom ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ancienPassword, setAncienPassword] = useState('');
  const [nouveauPassword, setNouveauPassword] = useState('');
  const [confirmationPassword, setConfirmationPassword] = useState('');
  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const entityKey = user ? `user-photo-${user.id_user}` : '';

  useEffect(() => {
    setNom(user?.nom ?? '');
    setPrenom(user?.prenom ?? '');
    setEmail(user?.email ?? '');
  }, [user?.email, user?.nom, user?.prenom]);

  useEffect(() => {
    if (!entityKey) return;

    let mounted = true;
    const refreshPendingState = async () => {
      const pending = await MediaOutbox.getLatestForEntity(entityKey);
      if (!mounted) return;
      setPendingPhotoUri(pending?.localFilePath ?? null);
      setPendingSync(Boolean(pending));
    };

    refreshPendingState();
    const timer = setInterval(refreshPendingState, 3000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [entityKey]);

  const photoUri = useMemo(
    () => pendingPhotoUri ?? resolveAssetUri(user?.photo_path, user?.photo_path),
    [pendingPhotoUri, user?.photo_path]
  );

  const save = useCallback(async () => {
    if (!user) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const res = await utilisateursApi.update(user.id_user, {
        nom: nom.trim(),
        prenom: prenom.trim(),
        email: email.trim() || undefined,
      });

      const updatedUser = { ...user, ...(res.data?.data ?? res.data) };
      updateUser(updatedUser);
      await Storage.setUser(updatedUser);
      setSuccess('Profil mis à jour.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur de mise à jour du profil.');
    } finally {
      setSaving(false);
    }
  }, [email, nom, prenom, updateUser, user]);

  const uploadPhoto = useCallback(async (asset: { uri: string; type: string; name: string }) => {
    if (!user) return;

    const form = new FormData();
    form.append('photo', {
      uri: asset.uri,
      name: asset.name,
      type: asset.type,
    } as never);

    try {
      const res = await utilisateursApi.updatePhoto(user.id_user, form);
      const photo_path = res.data?.data?.photo_path;
      if (!photo_path) return;

      const updatedUser = { ...user, photo_path };
      setPendingPhotoUri(null);
      setPendingSync(false);
      updateUser(updatedUser);
      await Storage.setUser(updatedUser);
      setSuccess('Photo mise à jour.');
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
      setSuccess('Photo enregistrée localement en attente de synchronisation.');
    }
  }, [entityKey, updateUser, user]);

  const changePassword = useCallback(async () => {
    if (!user) return;

    try {
      setPasswordSaving(true);
      setError(null);
      setSuccess(null);

      await utilisateursApi.changePassword(user.id_user, {
        ancien_password: ancienPassword,
        nouveau_password: nouveauPassword,
        confirmation: confirmationPassword,
      });

      setAncienPassword('');
      setNouveauPassword('');
      setConfirmationPassword('');
      setSuccess('Mot de passe mis à jour.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur lors du changement de mot de passe.');
    } finally {
      setPasswordSaving(false);
    }
  }, [ancienPassword, confirmationPassword, nouveauPassword, user]);

  if (!user) return null;

  return (
    <ScreenWrapper scroll style={{ backgroundColor: colors.background }}>
      <AppHeader
        title="Mon profil"
        subtitle="Informations personnelles et photo"
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarContainer}>
          <AppAvatar
            key={photoUri || 'no-photo'}
            nom={user.nom}
            prenom={user.prenom}
            photoPath={photoUri}
            size={100}
          />
          <Text style={[styles.identityTitle, { color: colors.text }]}>
            {`${prenom} ${nom}`.trim() || user.login}
          </Text>
          <Text style={{ color: colors.textMuted, marginTop: 6 }}>{user.login}</Text>
        </View>

        {error ? <Text style={{ color: colors.danger, fontWeight: '600' }}>{error}</Text> : null}
        {success ? <Text style={{ color: colors.success, fontWeight: '600' }}>{success}</Text> : null}

        <AppCard title="Informations">
          <AppInput label="Prénom" value={prenom} onChangeText={setPrenom} />
          <AppInput label="Nom" value={nom} onChangeText={setNom} />
          <AppInput label="E-mail" value={email} onChangeText={setEmail} autoCapitalize="none" />
          <AppButton label="Enregistrer" loading={saving} onPress={save} />
        </AppCard>

        <ImageUploadField
          title="Photo de profil"
          imageUri={photoUri}
          pendingSync={pendingSync}
          onUpload={uploadPhoto}
        />

        <AppCard title="Sécurité">
          <AppInput label="Ancien mot de passe" value={ancienPassword} onChangeText={setAncienPassword} secureTextEntry />
          <AppInput label="Nouveau mot de passe" value={nouveauPassword} onChangeText={setNouveauPassword} secureTextEntry />
          <AppInput label="Confirmation" value={confirmationPassword} onChangeText={setConfirmationPassword} secureTextEntry />
          <AppButton label="Modifier le mot de passe" loading={passwordSaving} onPress={changePassword} />
        </AppCard>

        <AppCard>
          <AppSwitch value={isDark} onToggle={toggleTheme} label="Mode sombre" />
        </AppCard>

        <AppCard>
          <AppButton label="Déconnexion" variant="danger" onPress={logout} />
        </AppCard>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { padding: 16, gap: 16 },
  avatarContainer: { alignItems: 'center', marginBottom: 4 },
  identityTitle: { fontSize: 20, fontWeight: '700', marginTop: 10 },
});
