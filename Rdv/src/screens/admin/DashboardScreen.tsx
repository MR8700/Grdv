import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, TouchableOpacity } from 'react-native';
import { DrawerActions } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../store/ThemeContext';
import { useAuth } from '../../store/AuthContext';
import { useAutoRefresh } from '../../hooks/useAutoRefresh';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { StatsCarousel } from '../../components/charts/StatsCarousel';
import { RdvBarChart } from '../../components/charts/RdvBarChart';
import { rdvApi } from '../../api/rendezVous.api';
import { utilisateursApi } from '../../api/utilisateurs.api';
import { PaginatedResponse } from '../../types/api.types';
import { RendezVous } from '../../types/models.types';
import { COLORS, REFRESH_INTERVALS } from '../../utils/constants';
 
function buildLast7Days() {
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    return {
      key: day.toISOString().slice(0, 10),
      label: day.toLocaleDateString('fr-FR', { weekday: 'short' }),
    };
  });
}

export function DashboardScreen({ navigation }: { navigation: any }) {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [stats, setStats] = useState({ rdvTotal: 0, rdvAujourdhui: 0, patients: 0, medecins: 0 });
  const [rdvData, setRdvData] = useState([
    { label: 'Lun', value: 0 },
    { label: 'Mar', value: 0 },
    { label: 'Mer', value: 0 },
    { label: 'Jeu', value: 0 },
    { label: 'Ven', value: 0 },
    { label: 'Sam', value: 0 },
    { label: 'Dim', value: 0 },
  ]);
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    try {
      const now = new Date();
      const dayStart = new Date(now);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(now);
      dayEnd.setHours(23, 59, 59, 999);

      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 6);
      weekStart.setHours(0, 0, 0, 0);

      const [rdvTotalRes, rdvTodayRes, rdvWeekRes, patientsRes, medecinsRes] = await Promise.all([
        rdvApi.getAll({ limit: 1 }),
        rdvApi.getAll({ date_debut: dayStart.toISOString(), date_fin: dayEnd.toISOString(), limit: 1 }),
        rdvApi.getAll({ date_debut: weekStart.toISOString(), date_fin: dayEnd.toISOString(), limit: 100 }),
        utilisateursApi.getAll({ type_user: 'patient', limit: 1 }),
        utilisateursApi.getAll({ type_user: 'medecin', limit: 1 }),
      ]);

      const weekPayload = rdvWeekRes.data as PaginatedResponse<RendezVous>;
      const weekDays = buildLast7Days();
      const chart = weekDays.map((day) => ({
        label: day.label,
        value: weekPayload.data.filter((rdv) => String(rdv.date_heure_rdv).startsWith(day.key)).length,
      }));

      setRdvData(chart);
      setStats({
        rdvTotal: rdvTotalRes.data.meta?.total ?? 0,
        rdvAujourdhui: rdvTodayRes.data.meta?.total ?? 0,
        patients: patientsRes.data.meta?.total ?? 0,
        medecins: medecinsRes.data.meta?.total ?? 0,
      });
    } catch {
      // keep previous values on backend errors
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);
  useAutoRefresh(fetchStats, REFRESH_INTERVALS.DASHBOARD);

  const statCards = useMemo(
    () => [
      {
        key: 'rdv_total',
        label: 'RDV total',
        value: stats.rdvTotal,
        icon: 'RDV',
        color: COLORS.primary,
        subtitle: 'Volume global des rendez-vous',
        trend: { value: 12, label: 'vs semaine derniere' },
        onPress: () => navigation.navigate('AuditLogs'),
      },
      {
        key: 'rdv_today',
        label: "Aujourd'hui",
        value: stats.rdvAujourdhui,
        icon: 'DAY',
        color: COLORS.accent,
        subtitle: 'Activite de la journee',
        trend: { value: 5, label: 'vs hier' },
        onPress: () => navigation.navigate('SystemJobs'),
      },
      {
        key: 'patients',
        label: 'Patients',
        value: stats.patients,
        icon: 'PAT',
        color: COLORS.success,
        subtitle: 'Comptes patients actifs',
        trend: { value: 3, label: 'nouveaux ce mois' },
        onPress: () => navigation.navigate('Utilisateurs'),
      },
      {
        key: 'medecins',
        label: 'Medecins',
        value: stats.medecins,
        icon: 'MED',
        color: COLORS.warning,
        subtitle: 'Corps medical enregistre',
        onPress: () => navigation.navigate('Utilisateurs'),
      },
    ],
    [navigation, stats]
  );

  const QUICK_ACTIONS = [
    { icon: '+', label: 'Nouvel utilisateur', screen: 'Utilisateurs' },
    { icon: 'ACL', label: 'Permissions', screen: 'Permissions' },
    { icon: 'SVC', label: 'Services', screen: 'Services' },
    { icon: 'LOG', label: 'Audit Logs', screen: 'AuditLogs' },
  ];

  return (
    <ScreenWrapper scroll onRefresh={fetchStats} refreshing={loading}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity
            onPress={() => navigation.dispatch(DrawerActions.toggleDrawer())}
            style={styles.menuButton}
          >
            <Ionicons name="menu" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerSubtitle}>Tableau de bord</Text>
            <Text style={styles.headerTitle}>Bonjour, {user?.prenom ?? ''}</Text>
            <Text style={styles.headerDate}>
              {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.content}>
        <StatsCarousel items={statCards} autoScrollMs={5000} />

        <View style={styles.chartSection}>
          <RdvBarChart data={rdvData} title="RDV cette semaine" />
        </View>

        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12 }}>Actions rapides</Text>
        <View style={styles.grid}>
          {QUICK_ACTIONS.map((a) => (
            <Pressable
              key={a.screen}
              onPress={() => navigation.navigate(a.screen)}
              style={({ pressed }) => [
                styles.actionCard,
                styles.gridItem,
                { backgroundColor: colors.surface, borderColor: colors.border, opacity: pressed ? 0.7 : 1 },
              ]}
            >
              <Text style={styles.actionIcon}>{a.icon}</Text>
              <Text numberOfLines={2} style={[styles.actionLabel, { color: colors.text }]}>
                {a.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  content: {
    marginTop: 20,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.75)',
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  gridItem: {
    width: '48%',
    marginBottom: 12,
  },
  chartSection: {
    marginBottom: 20,
  },
  header: {
    marginHorizontal: -16,
    marginTop: -16,
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 28,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  headerSubtitle: { color: '#fff', fontSize: 13, opacity: 0.8 },
  headerTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginTop: 4 },
  headerDate: { color: '#ffffffCC', fontSize: 13, marginTop: 4 },

  actionCard: {
    borderRadius: 14,
    minHeight: 108,
    paddingHorizontal: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  actionIcon: { fontSize: 28 },
  actionLabel: { fontSize: 13, fontWeight: '600', textAlign: 'center', marginTop: 6 },
});
