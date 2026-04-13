import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { AppAvatar } from '../ui/AppAvatar';
import { formatNom } from '../../utils/formatters';
import { TYPE_USER_LABELS } from '../../utils/constants';
import { Utilisateur } from '../../types/models.types';

const STATUT_COLORS: Record<string, { bg: string; text: string }> = {
  actif: { bg: '#ECFDF5', text: '#065F46' },
  archive: { bg: '#F9FAFB', text: '#6B7280' },
  suspendu: { bg: '#FEF2F2', text: '#991B1B' },
};

interface UtilisateurItemProps {
  utilisateur: Utilisateur;
  onPress: (id: number) => void;
}

export function UtilisateurItem({ utilisateur: u, onPress }: UtilisateurItemProps) {
  const { colors } = useTheme();
  const sc = STATUT_COLORS[u.statut] || { bg: colors.surfaceAlt, text: colors.text };

  return (
    <TouchableOpacity
      onPress={() => onPress(u.id_user)}
      style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border, shadowColor: colors.shadow }]}
      activeOpacity={0.7}
    >
      <AppAvatar nom={u.nom} prenom={u.prenom} photoPath={u.photo_path} size={48} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{formatNom(u.nom, u.prenom)}</Text>
        <Text style={[styles.username, { color: colors.textMuted }]}>
          @{u.login} · {TYPE_USER_LABELS[u.type_user]}
        </Text>
      </View>

      <View style={[styles.statutBadge, { backgroundColor: sc.bg }]}>
        <Text style={[styles.statutText, { color: sc.text }]}>{u.statut}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    marginBottom: 10,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2, // Android shadow
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  username: {
    fontSize: 12,
    marginTop: 2,
  },
  statutBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statutText: {
    fontSize: 11,
    fontWeight: '600',
  },
});