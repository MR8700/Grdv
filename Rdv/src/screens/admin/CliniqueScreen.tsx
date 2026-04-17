import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Animated, Image, StyleSheet, Text, View } from 'react-native';

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
import { showAlert } from '../../components/ui/AppAlert';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { Clinique, Service } from '../../types/models.types';
import { resolveAssetUri } from '../../utils/assets';
import { MediaOutbox } from '../../utils/mediaOutbox';

export function CliniqueScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();

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
  const canManageClinic = hasPermission('gerer_clinique');
  const canManageServices = hasPermission('gerer_services');

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

  const logoUri = useMemo(
    () => pendingLogoUri ?? resolveAssetUri(clinique?.logo_path, clinique?.logo_path),
    [clinique?.logo_path, pendingLogoUri]
  );

  const save = useCallback(async () => {
    if (!canManageClinic) {
      showAlert('warning', 'Action non autorisee', 'Permission gerer_clinique manquante.');
      return;
    }

    const trimmedNom = nom.trim();
    const trimmedAdresse = adresse.trim();
    const trimmedSiteWeb = siteWeb.trim();

    if (!trimmedNom) {
      showAlert('warning', 'Champ requis', 'Le nom de la clinique est obligatoire.');
      return;
    }

    if (trimmedSiteWeb && !/^https?:\/\//i.test(trimmedSiteWeb)) {
      showAlert('warning', 'Site web invalide', 'Utilisez une URL complete commencant par http:// ou https://.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      const res = await cliniqueApi.update({
        nom: trimmedNom,
        adresse: trimmedAdresse || undefined,
        site_web: trimmedSiteWeb || undefined,
      });
      const payload: Clinique = res.data?.data ?? res.data;
      setClinique((current) => (current ? { ...current, ...payload } : payload));
      setNom(payload.nom ?? trimmedNom);
      setAdresse(payload.adresse ?? trimmedAdresse);
      setSiteWeb(payload.site_web ?? trimmedSiteWeb);
      setSuccess('Clinique mise a jour.');
    } catch (e: any) {
      setError(e?.response?.data?.message ?? 'Mise a jour impossible.');
    } finally {
      setSaving(false);
    }
  }, [adresse, canManageClinic, nom, siteWeb]);

  const uploadLogo = useCallback(
    async (asset: { uri: string; name: string; type: string }) => {
      if (!canManageClinic) {
        showAlert('warning', 'Action non autorisee', 'Permission gerer_clinique manquante.');
        return;
      }

      const form = new FormData();
      form.append('logo', { uri: asset.uri, name: asset.name, type: asset.type } as any);
      const uploadId = MediaOutbox.buildUploadId();

      try {
        const res = await cliniqueApi.updateLogo(form, uploadId);
        const logoPath = res.data?.data?.logo_path ?? res.data?.logo_path;
        if (logoPath) {
          await MediaOutbox.clearEntity(entityKey);
          setPendingLogoUri(null);
          setPendingSync(false);
          setClinique((current) => (current ? { ...current, logo_path: logoPath } : current));
          setSuccess('Logo mis a jour.');
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
        setSuccess('Logo enregistre localement. Synchronisation des que le reseau revient.');
      }
    },
    [canManageClinic, cliniqueId]
  );

  const services = (clinique?.services ?? []) as Service[];
  const scrollX = useMemo(() => new Animated.Value(0), []);
  const clinicMetrics = useMemo(
    () => [
      { label: 'Services', value: String(services.length) },
      { label: 'Logo', value: logoUri ? (pendingSync ? 'En attente' : 'Configure') : 'Aucun' },
      { label: 'Site web', value: siteWeb.trim() ? 'Renseigne' : 'Vide' },
    ],
    [logoUri, pendingSync, services.length, siteWeb]
  );

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
          <ImageUploadField
            title="Logo"
            subtitle="Ajoutez ou remplacez le logo de la clinique"
            imageUri={logoUri}
            pendingSync={pendingSync}
            onUpload={uploadLogo}
            placeholderEmoji="🏥"
          />

          <AppCard title="Pilotage" subtitle="Vue rapide sur la configuration admin" style={styles.card}>
            <View style={styles.metricsRow}>
              {clinicMetrics.map((metric) => (
                <View
                  key={metric.label}
                  style={[
                    styles.metricCard,
                    {
                      borderColor: colors.border,
                      backgroundColor: colors.surfaceAlt,
                    },
                  ]}
                >
                  <Text style={{ color: colors.textMuted, fontSize: 12 }}>{metric.label}</Text>
                  <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15, marginTop: 4 }}>{metric.value}</Text>
                </View>
              ))}
            </View>

            <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
              <AppButton label="Rafraichir" variant="outline" onPress={fetchClinique} style={{ flex: 1 }} />
              <AppButton
                label="Gerer les services"
                onPress={() => navigation.navigate('Services')}
                disabled={!canManageServices}
                style={{ flex: 1 }}
              />
            </View>
          </AppCard>

          <AppCard title="Informations" style={styles.card}>
            <AppInput label="Nom" value={nom} onChangeText={setNom} required />
            <AppInput label="Adresse" value={adresse} onChangeText={setAdresse} />
            <AppInput
              label="Site web"
              value={siteWeb}
              onChangeText={setSiteWeb}
              autoCapitalize="none"
              placeholder="https://..."
            />
            <AppButton
              label={saving ? 'Enregistrement...' : 'Enregistrer'}
              fullWidth
              loading={saving}
              onPress={save}
              disabled={!canManageClinic}
            />
          </AppCard>

          <AppCard title="Services" subtitle="Defilement horizontal" style={styles.card}>
            {services.length === 0 ? (
              <Text style={{ color: colors.textMuted }}>Aucun service configure.</Text>
            ) : (
              <Animated.ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 16, paddingVertical: 8 }}
                onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
                  useNativeDriver: true,
                })}
                scrollEventThrottle={16}
              >
                {services.map((service, index) => {
                  const inputRange = [(index - 1) * 240, index * 240, (index + 1) * 240];
                  const scale = scrollX.interpolate({
                    inputRange,
                    outputRange: [0.92, 1, 0.92],
                    extrapolate: 'clamp',
                  });

                  return (
                    <Animated.View
                      key={service.id_service}
                      style={[
                        styles.serviceCard,
                        {
                          borderColor: colors.border,
                          backgroundColor: colors.surfaceAlt,
                          transform: [{ scale }],
                        },
                      ]}
                    >
                      {service.image_path ? (
                        <Image
                          source={{ uri: resolveAssetUri(service.image_path, service.image_path) as string }}
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
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  metricCard: {
    minWidth: 100,
    flexGrow: 1,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  serviceCard: {
    width: 220,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
});
