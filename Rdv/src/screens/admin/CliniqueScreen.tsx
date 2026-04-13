import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Text, View, StyleSheet, Animated } from 'react-native';

import { isNetworkError } from '../../api/errors';
import { cliniqueApi } from '../../api/clinique.api';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppLoader } from '../../components/ui/AppLoader';
import { ImageUploadField } from '../../components/ui/ImageUploadField';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { useTheme } from '../../store/ThemeContext';
import { Clinique, Service } from '../../types/models.types';
import { API_ORIGIN } from '../../utils/constants';
import { MediaOutbox } from '../../utils/mediaOutbox';
 
export function CliniqueScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();

  const [clinique, setClinique] = useState<Clinique | null>(null);
  const [nom, setNom] = useState('');
  const [adresse, setAdresse] = useState('');
  const [siteWeb, setSiteWeb] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pendingLogoUri, setPendingLogoUri] = useState<string | null>(null);
  const [pendingSync, setPendingSync] = useState(false);

  const entityKey = 'clinic-logo';
  const cliniqueId = clinique?.id_clinique ?? '1';

  const fetchClinique = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await cliniqueApi.get();
      const payload: Clinique = res.data?.data ?? res.data;
      setClinique(payload);
      setNom(payload.nom ?? '');
      setAdresse(payload.adresse ?? '');
      setSiteWeb(payload.site_web ?? '');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Impossible de charger la clinique.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClinique();
  }, [fetchClinique]);

  useEffect(() => {
    let mounted = true;

    const refreshPendingState = async () => {
      const pending = await MediaOutbox.getLatestForEntity(entityKey);
      if (!mounted) return;
      setPendingLogoUri(pending?.localFilePath ?? null);
      setPendingSync(Boolean(pending));
    };

    refreshPendingState();
    const timer = setInterval(refreshPendingState, 4000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, []);

  const logoUri = useMemo(() => pendingLogoUri ?? (clinique?.logo_path ? `${API_ORIGIN}/${clinique.logo_path}` : null), [
    clinique?.logo_path,
    pendingLogoUri,
  ]);

  const save = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await cliniqueApi.update({ nom, adresse, site_web: siteWeb });
      const payload: Clinique = res.data?.data ?? res.data;
      setClinique((current) => ({ ...(current as any), ...payload }));
      setSuccess('Clinique mise à jour.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Mise à jour impossible.');
    } finally {
      setSaving(false);
    }
  }, [adresse, nom, siteWeb]);

  const uploadLogo = useCallback(async (asset: { uri: string; name: string; type: string }) => {
    const form = new FormData();
    form.append('logo', { uri: asset.uri, name: asset.name, type: asset.type } as any);
    const uploadId = MediaOutbox.buildUploadId();

    try {
      const res = await cliniqueApi.updateLogo(form, uploadId);
      const logo_path = res.data?.data?.logo_path ?? res.data?.logo_path;
      if (logo_path) {
        await MediaOutbox.clearEntity(entityKey);
        setPendingLogoUri(null);
        setPendingSync(false);
        setClinique((current) => (current ? { ...current, logo_path } : current));
      }
    } catch (e) {
      if (!isNetworkError(e)) throw e;
      const queued = await MediaOutbox.queueUpload({
        sourceUri: asset.uri,
        endpoint: '/clinique/logo',
        fieldName: 'logo',
        mime: asset.type,
        fileName: asset.name,
        entityId: cliniqueId,
        entityKey,
      });
      setPendingLogoUri(queued.localFilePath);
      setPendingSync(true);
      setSuccess('Logo enregistré localement. Synchronisation dès que le réseau revient.');
    }
  }, [cliniqueId]);

  const services = (clinique?.services ?? []) as Service[];

  const scrollX = useMemo(() => new Animated.Value(0), []);

  return (
    <ScreenWrapper scroll onRefresh={fetchClinique} refreshing={loading}>
      <AppHeader
        title="Clinique"
        subtitle="Logo, informations et services"
        onBack={navigation?.canGoBack?.() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export clinique"
            rows={services}
            filters={{
              Nom: nom || clinique?.nom || '',
              Adresse: adresse || clinique?.adresse || '',
              Site: siteWeb || clinique?.site_web || '',
            }}
            columns={[
              { key: 'id', label: 'ID Service', value: (s) => s.id_service },
              { key: 'nom', label: 'Service', value: (s) => s.nom_service },
              { key: 'description', label: 'Description', value: (s) => s.description || '' },
            ]}
          />
        }
      />

      {!!error && <Text style={{ color: colors.danger, marginBottom: 12, fontWeight: '600' }}>{error}</Text>}
      {!!success && <Text style={{ color: colors.success, marginBottom: 12, fontWeight: '600' }}>{success}</Text>}

      {loading && !clinique ? (
        <AppLoader message="Chargement de la clinique..." />
      ) : (
        <>
          {/* Logo */}
          <ImageUploadField
            title="Logo"
            subtitle="Ajoutez/modifiez le logo de la clinique"
            imageUri={logoUri}
            pendingSync={pendingSync}
            onUpload={uploadLogo}
            placeholderEmoji="🏥"
          />

          {/* Infos */}
          <AppCard title="Informations" style={styles.card}>
            <AppInput label="Nom" value={nom} onChangeText={setNom} required />
            <AppInput label="Adresse" value={adresse} onChangeText={setAdresse} />
            <AppInput label="Site web" value={siteWeb} onChangeText={setSiteWeb} autoCapitalize="none" placeholder="https://..." />
            <AppButton label={saving ? 'Enregistrement...' : 'Enregistrer'} fullWidth loading={saving} onPress={save} />
          </AppCard>

          {/* Services */}
          <AppCard title="Services" subtitle="Défilement horizontal" style={styles.card}>
            {services.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>Aucun service configuré.</Text>
            ) : (
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingVertical: 8 }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: true })}
                scrollEventThrottle={16}
              >
                {services.map((service, index) => {
                  const inputRange = [(index - 1) * 240, index * 240, (index + 1) * 240];
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.9, 1, 0.9],
                    extrapolate: 'clamp',
                  });
                  return (
                    <Animated.View
                      key={service.id_service}
                      style={[
                        {
                          width: 220,
                          borderRadius: 16,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.surfaceAlt,
                          overflow: 'hidden',
                        },
                        { transform: [{ scale }] },
                      ]}
                    >
                      {service.image_path ? (
                        <Image
                          source={{ uri: `${API_ORIGIN}/${service.image_path}` }}
                          style={{ width: '100%', height: 120, backgroundColor: colors.surfaceAlt }}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={{ height: 120, alignItems: 'center', justifyContent: 'center' }}>
                          <Text style={{ fontSize: 30 }}>🏷️</Text>
                        </View>
                      )}
                      <View style={{ padding: 12 }}>
                        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16, marginBottom: 4 }}>
                          {service.nom_service}
                        </Text>
                        {!!service.description && (
                          <Text style={{ color: colors.textMuted, fontSize: 13 }} numberOfLines={3}>
                            {service.description}
                          </Text>
                        )}
                      </View>
                    </Animated.View>
                  );
                })}
              </Animated.ScrollView>
            )}
          </AppCard>
        </>
      )}
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
});
