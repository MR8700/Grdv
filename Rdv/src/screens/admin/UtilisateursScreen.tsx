import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { utilisateursApi } from '../../api/utilisateurs.api';
import { UtilisateurItem } from '../../components/admin/UtilisateurItem';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppEmpty } from '../../components/ui/AppEmpty';
import { AppHeader } from '../../components/ui/AppHeader';
import { AppInput } from '../../components/ui/AppInput';
import { CardSkeleton } from '../../components/ui/AppLoader';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { usePaginatedApi } from '../../hooks/useApi';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';
import { Utilisateur } from '../../types/models.types';
import { REFRESH_INTERVALS } from '../../utils/constants';

const FILTERS = [
  { label: 'Tous', value: undefined },
  { label: 'Admin', value: 'admin' },
  { label: 'Medecin', value: 'medecin' },
  { label: 'Patient', value: 'patient' },
  { label: 'Secretaire', value: 'secretaire' },
];

export function UtilisateursScreen({ navigation }: { navigation: any }) {
  const { hasPermission } = useAuth();
  const { colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(undefined);

  const loadUsers = useCallback(
    async (p: Record<string, any>) => {
      const response = await utilisateursApi.getAll({
        ...p,
        type_user: filterType,
      });
      return (response.data.data ?? []) as Utilisateur[];
    },
    [filterType]
  );

  const { items, loading, refresh, loadMore, hasMore } = usePaginatedApi<Utilisateur>({ fetcher: loadUsers });

  useAutoRefresh(refresh, REFRESH_INTERVALS.DASHBOARD, hasPermission('voir_utilisateurs'));

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;

    return items.filter((u) => `${u.nom} ${u.prenom} ${u.login}`.toLowerCase().includes(query));
  }, [items, search]);

  React.useEffect(() => {
    refresh();
  }, [filterType, refresh]);

  return (
    <ScreenWrapper scroll={false}>
      <AppHeader
        title="Utilisateurs"
        subtitle={`${items.length} compte(s)`}
        rightActions={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PdfExportButton
              title="Export utilisateurs"
              rows={filtered}
              filters={{
                Recherche: search || 'Aucune',
                Type: filterType || 'Tous',
              }}
              columns={[
                { key: 'id', label: 'ID', value: (u) => u.id_user },
                { key: 'nom', label: 'Nom', value: (u) => u.nom || '' },
                { key: 'prenom', label: 'Prenom', value: (u) => u.prenom || '' },
                { key: 'login', label: 'Login', value: (u) => u.login || '' },
                { key: 'email', label: 'Email', value: (u) => u.email || '' },
                { key: 'type', label: 'Type', value: (u) => u.type_user || '' },
                { key: 'statut', label: 'Statut', value: (u) => u.statut || '' },
              ]}
            />

            <TouchableOpacity
              disabled={!hasPermission('creer_utilisateur')}
              onPress={() => navigation.navigate('UtilisateurDetail', { id_user: undefined })}
              style={{
                backgroundColor: '#ffffff33',
                borderRadius: 8,
                padding: 8,
                opacity: hasPermission('creer_utilisateur') ? 1 : 0.45,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 18 }}>+</Text>
            </TouchableOpacity>
          </View>
        }
      />

      <View style={{ marginTop: 10 }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: 16,
            gap: 10,
          }}
        >
          {FILTERS.map((f) => {
            const active = f.value === filterType;

            return (
              <TouchableOpacity
                key={f.label}
                onPress={() => setFilterType(f.value)}
                style={{
                  paddingVertical: 8,
                  paddingHorizontal: 14,
                  borderRadius: 20,
                  backgroundColor: active ? colors.primary : '#ffffff22',
                }}
              >
                <Text
                  style={{
                    color: active ? '#fff' : '#ddd',
                    fontWeight: '600',
                  }}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <AppInput
          label="Recherche"
          value={search}
          onChangeText={setSearch}
          placeholder="Nom, prenom ou login"
        />
        <TouchableOpacity
          onPress={refresh}
          style={{
            backgroundColor: colors.primary,
            padding: 10,
            borderRadius: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700' }}>Rafraichir</Text>
        </TouchableOpacity>
      </View>

      {loading && items.length === 0 ? (
        <View style={{ paddingHorizontal: 16, gap: 12, marginTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={filtered}
          keyExtractor={(u) => String(u.id_user)}
          contentContainerStyle={{
            paddingHorizontal: 16,
            paddingTop: 12,
            paddingBottom: 32,
            flexGrow: 1,
          }}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          ListEmptyComponent={<AppEmpty title="Aucun utilisateur" subtitle="Ajoutez des comptes via le bouton +" />}
          renderItem={({ item }) => (
            <UtilisateurItem
              utilisateur={item}
              onPress={(id) => navigation.navigate('UtilisateurDetail', { id_user: id })}
            />
          )}
        />
      )}
    </ScreenWrapper>
  );
}
