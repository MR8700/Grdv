import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { TYPE_USER } from '../../utils/constants';

interface UtilisateurFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  filterType: string | undefined;
  onFilterChange: (value: string | undefined) => void;
  onRefresh: () => void;
}

export function UtilisateurFilters({
  search,
  onSearchChange,
  filterType,
  onFilterChange,
  onRefresh,
}: UtilisateurFiltersProps) {
  const { colors } = useTheme();

  const FILTERS = [
    { label: 'Tous', value: undefined },
    { label: 'Admin', value: TYPE_USER.ADMINISTRATEUR },
    { label: 'Médecin', value: TYPE_USER.MEDECIN },
    { label: 'Patient', value: TYPE_USER.PATIENT },
    { label: 'Sécrétaire', value: TYPE_USER.SECRETAIRE },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Search Input */}
      <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          value={search}
          onChangeText={onSearchChange}
          placeholder="Rechercher un utilisateur"
          placeholderTextColor={colors.textLight}
          style={[styles.searchInput, { color: colors.text }]}
        />
      </View>

      {/* Filter Buttons */}
      <View style={styles.filtersContainer}>
        {FILTERS.map((f) => {
          const isActive = filterType === f.value;
          return (
            <TouchableOpacity
              key={String(f.value)}
              onPress={() => {
                onFilterChange(f.value);
                onRefresh();
              }}
              style={[
                styles.filterButton,
                {
                  backgroundColor: isActive ? colors.primary : colors.surface,
                  borderColor: isActive ? colors.primary : colors.border,
                },
              ]}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterLabel, { color: isActive ? '#fff' : colors.textMuted }]}>
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    height: 44,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  filtersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterButton: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
});