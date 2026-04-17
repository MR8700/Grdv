import React, { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Text, TouchableOpacity, View } from 'react-native';
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
import { servicesApi } from '../../api/services.api';
import { Service } from '../../types/models.types';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { REFRESH_INTERVALS } from '../../utils/constants';

interface ServicePayload {
  nom_service: string;
  description?: string;
  id_clinique?: number;
}

export function ServicesScreen() {
  const { colors } = useTheme();
  const { hasPermission } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ServicePayload>({ nom_service: '', description: '' });
  const listRef = useRef<FlatList<Service>>(null);

  const canWrite = hasPermission('gerer_services');

  const fetchServices = useCallback(async () => {
    setLoading(true);
    try {
      const response = await servicesApi.getAll({ limit: 200 });
      setServices((response.data.data || []) as Service[]);
    } catch {
      showAlert('error', 'Services', 'Echec du chargement des services.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  useAutoRefresh(fetchServices, REFRESH_INTERVALS.DASHBOARD, true);

  const resetForm = () => {
    setForm({ nom_service: '', description: '' });
    setEditingId(null);
  };

  const submit = async () => {
    if (!form.nom_service.trim()) {
      showAlert('warning', 'Champ requis', 'Le nom du service est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await servicesApi.update(editingId, form);
        showAlert('success', 'Service mis a jour');
      } else {
        await servicesApi.create(form);
        showAlert('success', 'Service cree');
      }
      resetForm();
      await fetchServices();
    } catch {
      showAlert('error', 'Operation echouee', 'Impossible de sauvegarder ce service.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (serviceId: number) => {
    if (!canWrite) return;

    Alert.alert('Confirmer la suppression', 'Ce service sera retire de la liste active.', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          setSaving(true);
          try {
            await servicesApi.remove(serviceId);
            showAlert('success', 'Service supprime');
            if (editingId === serviceId) resetForm();
            await fetchServices();
          } catch {
            showAlert('error', 'Suppression impossible');
          } finally {
            setSaving(false);
          }
        },
      },
    ]);
  };

  const statusText = useMemo(
    () => `${services.length} service(s) • ${loading ? 'actualisation...' : 'a jour'}`,
    [services.length, loading]
  );

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader
        title="Services"
        subtitle={statusText}
        rightActions={
          <PdfExportButton
            title="Export de services"
            rows={services}
            filters={{ Total: services.length }}
            columns={[
              { key: 'id', label: 'ID', value: (s) => s.id_service },
              { key: 'nom', label: 'Nom', value: (s) => s.nom_service },
              { key: 'description', label: 'Description', value: (s) => s.description || '' },
              { key: 'clinique', label: 'Clinique', value: (s) => s.id_clinique || '' },
            ]}
          />
        }
      />

      <FlatList
        ref={listRef}
        data={services}
        keyExtractor={(item) => String(item.id_service)}
        refreshing={loading}
        onRefresh={fetchServices}
        contentContainerStyle={{ paddingBottom: 24, gap: 10 }}
        ListHeaderComponent={
          <View style={{ gap: 12, paddingBottom: 12 }}>
            <View
              style={{
                borderRadius: 16,
                padding: 14,
                borderWidth: 1,
                borderColor: `${colors.primary}33`,
                backgroundColor: `${colors.primary}12`,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>Catalogue des services</Text>
              <Text style={{ color: colors.textMuted, marginTop: 4, fontSize: 12 }}>
                Rafraichissement automatique actif toutes les 30 secondes.
              </Text>
            </View>

            <AppCard title={editingId ? 'Modifier le service' : 'Ajouter un service'}>
              <AppInput
                label="Nom du service"
                value={form.nom_service}
                onChangeText={(value) => setForm((prev) => ({ ...prev, nom_service: value }))}
                required
              />
              <AppInput
                label="Description"
                value={form.description}
                onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <AppButton
                  label={editingId ? 'Mettre a jour' : 'Ajouter'}
                  onPress={submit}
                  loading={saving}
                  disabled={!canWrite}
                  style={{ flex: 1 }}
                />
                {editingId && <AppButton label="Annuler" variant="outline" onPress={resetForm} style={{ flex: 1 }} />}
              </View>
            </AppCard>
          </View>
        }
        renderItem={({ item }) => (
          <AppCard noPadding>
            <View style={{ padding: 14 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: '800', flex: 1 }}>
                  {item.nom_service}
                </Text>
                <AppBadge label={`#${item.id_service}`} color={`${colors.primary}18`} textColor={colors.primary} size="sm" />
              </View>

              {!!item.description && (
                <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 12 }}>{item.description}</Text>
              )}

              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    setEditingId(item.id_service);
                    setForm({
                      nom_service: item.nom_service,
                      description: item.description || '',
                      id_clinique: item.id_clinique,
                    });
                    requestAnimationFrame(() => {
                      listRef.current?.scrollToOffset({ offset: 0, animated: true });
                    });
                  }}
                  disabled={!canWrite}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: colors.border,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: colors.surfaceAlt,
                    opacity: canWrite ? 1 : 0.45,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '700' }}>Modifier</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => remove(item.id_service)}
                  disabled={!canWrite}
                  style={{
                    flex: 1,
                    borderRadius: 12,
                    paddingVertical: 10,
                    alignItems: 'center',
                    backgroundColor: `${colors.danger}20`,
                    borderWidth: 1,
                    borderColor: `${colors.danger}44`,
                    opacity: canWrite ? 1 : 0.45,
                  }}
                >
                  <Text style={{ color: colors.danger, fontWeight: '800' }}>Supprimer</Text>
                </TouchableOpacity>
              </View>
            </View>
          </AppCard>
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={{ padding: 20 }}>
              <Text style={{ color: colors.textMuted, textAlign: 'center' }}>Aucun service pour le moment.</Text>
            </View>
          ) : null
        }
      />
    </ScreenWrapper>
  );
}
