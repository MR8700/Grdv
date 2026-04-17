import React, { useCallback, useMemo, useState, useEffect } from 'react';
import { FlatList, Text, TouchableOpacity, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
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
  { label: 'Admin', value: 'administrateur' },
  { label: 'Medecin', value: 'medecin' },
  { label: 'Patient', value: 'patient' },
  { label: 'Secretaire', value: 'secretaire' },
];

export function UtilisateursScreen({ navigation }: { navigation: any }) {
  const { hasPermission } = useAuth();
  const { colors } = useTheme();

  const canView = hasPermission('voir_utilisateurs');
  const canCreate = hasPermission('creer_utilisateur');

  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>();

  // 🔎 Debounce recherche
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  // 🔁 Fetch users
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

  const { items, loading, refresh, loadMore, hasMore } =
    usePaginatedApi<Utilisateur>({ fetcher: loadUsers });

  useAutoRefresh(refresh, REFRESH_INTERVALS.DASHBOARD, canView);

  // 🔍 Filtrage optimisé
  const filtered = useMemo(() => {
    const query = debouncedSearch.trim().toLowerCase();
    if (!query) return items;

    return items.filter((u) =>
      `${u.nom} ${u.prenom} ${u.login}`
        .toLowerCase()
        .includes(query)
    );
  }, [items, debouncedSearch]);

  useEffect(() => {
    refresh();
  }, [filterType, refresh]);

  const renderItem = useCallback(
    ({ item }: { item: Utilisateur }) => (
      <UtilisateurItem
        utilisateur={item}
        onPress={(id) =>
          navigation.navigate('UtilisateurDetail', { id_user: id })
        }
      />
    ),
    [navigation]
  );

  if (!canView) {
    return (
      <ScreenWrapper>
        <AppHeader title="Utilisateurs" subtitle="Accès refusé" />
        <Text style={{ color: colors.textMuted }}>Accès refusé</Text>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper>
      <AppHeader
        title="Utilisateurs"
        subtitle={`${filtered.length} compte(s)`}
        rightActions={
          <PdfExportButton
            title="Export utilisateurs"
            rows={filtered}
            filters={{
              Recherche: debouncedSearch || 'Aucune',
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
        }
      />

      {/* 🎯 Filtres */}
      <View style={{ flexDirection: 'row', paddingHorizontal: 16, marginTop: 10 }}>
        {FILTERS.map((f) => {
          const active = f.value === filterType;

          return (
            <TouchableOpacity
              key={f.label}
              onPress={() => setFilterType(f.value)}
              style={{
                marginRight: 8,
                paddingVertical: 6,
                paddingHorizontal: 12,
                borderRadius: 20,
                backgroundColor: active ? colors.primary : '#ffffff22',
              }}
            >
              <Text style={{ color: active ? '#fff' : '#ddd' }}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 🔎 Recherche */}
      <View style={{ paddingHorizontal: 16, marginTop: 10 }}>
        <AppInput
          label="Recherche"
          value={search}
          onChangeText={setSearch}
          placeholder="Nom, prenom ou login"
        />
      </View>

      {/* 📋 Liste */}
      {loading && items.length === 0 ? (
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {[1, 2, 3].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(u) => String(u.id_user)}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          refreshing={loading}
          onRefresh={refresh}
          onEndReached={hasMore ? loadMore : undefined}
          onEndReachedThreshold={0.3}
          removeClippedSubviews
          windowSize={5}
          ListEmptyComponent={
            <AppEmpty
              title="Aucun utilisateur"
              subtitle="Aucun résultat trouvé"
            />
          }
        />
      )}

      {/* ➕ FAB */}
      <TouchableOpacity
        disabled={!canCreate}
        onPress={() =>
          navigation.navigate('UtilisateurDetail', { id_user: undefined })
        }
        style={{
          position: 'absolute',
          right: 20,
          bottom: 90,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          opacity: canCreate ? 1 : 0.4,
        }}
      >
        <Ionicons name="add" size={26} color="#fff" />
      </TouchableOpacity>
    </ScreenWrapper>
  );
}