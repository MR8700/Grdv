import React, { useCallback, useEffect, useState } from 'react';
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
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [ancienPassword, setAncienPassword] = useState('');
  const [nouveauPassword, setNouveauPassword] = useState('');
  const [confirmationPassword, setConfirmationPassword] = useState('');

  const [pendingPhotoUri, setPendingPhotoUri] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const entityKey = user ? `user-photo-${user.id_user}` : '';

  // 🔥 IMPORTANT: on NE mémorise plus l'URL
  const photoUri =
    pendingPhotoUri ??
    (user?.photo_path ? `${API_ORIGIN}/${user.photo_path}?t=${Date.now()}` : null);

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

  const save = useCallback(async () => {
    if (!user) return;

    try {
      setSaving(true);

      const res = await utilisateursApi.update(user.id_user, { nom, prenom, email });

      const updated = res.data?.data ?? res.data;

      updateUser((prev: any) => ({
        ...prev,
        ...updated,
      }));

      await Storage.setUser({
        ...(user as any),
        ...updated,
      });

      setSuccess('Profil mis à jour.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Erreur mise à jour');
    } finally {
      setSaving(false);
    }
  }, [email, nom, prenom, user, updateUser]);

  const uploadPhoto = useCallback(async (asset: any) => {
    if (!user) return;

    const form = new FormData();
    form.append('photo', {
      uri: asset.uri,
      name: asset.name,
      type: asset.type,
    } as any);

    try {
      const res = await utilisateursApi.updatePhoto(user.id_user, form);

      const photo_path = res.data?.data?.photo_path;

      if (photo_path) {
        setPendingPhotoUri(null);
        setPendingSync(false);

        updateUser((prev: any) => ({
          ...prev,
          photo_path,
        }));

        await Storage.setUser({
          ...(user as any),
          photo_path,
        });

        setSuccess('Photo mise à jour.');
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
      setSuccess('Photo enregistrée localement.');
    }
  }, [user, entityKey, updateUser]);

  const changePassword = useCallback(async () => {
    if (!user) return;

    try {
      setPasswordSaving(true);

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
      setError(e?.response?.data?.message ?? 'Erreur mot de passe');
    } finally {
      setPasswordSaving(false);
    }
  }, [ancienPassword, nouveauPassword, confirmationPassword, user]);

  if (!user) return null;

  return (
    <ScreenWrapper scroll style={{ backgroundColor: colors.background }}>
      <AppHeader title="Mon profil" />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.avatarContainer}>
          {/* 🔥 KEY FORCE RELOAD IMAGE */}
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
        </View>

        <AppCard title="Informations">
          <AppInput label="Prenom" value={prenom} onChangeText={setPrenom} />
          <AppInput label="Nom" value={nom} onChangeText={setNom} />
          <AppInput label="Email" value={email} onChangeText={setEmail} />

          <AppButton label="Enregistrer" loading={saving} onPress={save} />
        </AppCard>

        <ImageUploadField
          title="Photo de profil"
          imageUri={photoUri}
          pendingSync={pendingSync}
          onUpload={uploadPhoto}
        />

        <AppCard title="Securité">
          <AppInput label="Ancien mot de passe" value={ancienPassword} onChangeText={setAncienPassword} secureTextEntry />
          <AppInput label="Nouveau mot de passe" value={nouveauPassword} onChangeText={setNouveauPassword} secureTextEntry />
          <AppInput label="Confirmation" value={confirmationPassword} onChangeText={setConfirmationPassword} secureTextEntry />

          <AppButton label="Modifier mot de passe" loading={passwordSaving} onPress={changePassword} />
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
  scrollContainer: { padding: 16 },
  avatarContainer: { alignItems: 'center', marginBottom: 20 },
  identityTitle: { fontSize: 20, fontWeight: '700' },
});