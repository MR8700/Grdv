import React, { useCallback, useMemo } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../store/AuthContext';
import { DrawerMenuItem } from '../components/layout/DrawerContent';
import { ActorDrawerNavigator } from './ActorDrawerNavigator';
import { RoleTabItem, RoleTabNavigator } from './RoleTabNavigator';

import { DashboardScreen } from '../screens/admin/DashboardScreen';
import { UtilisateursScreen } from '../screens/admin/UtilisateursScreen';
import { UtilisateurDetailScreen } from '../screens/admin/UtilisateurDetailScreen';
import { PermissionsScreen } from '../screens/admin/PermissionsScreen';
import { ServicesScreen } from '../screens/admin/ServicesScreen';
import { CliniqueScreen } from '../screens/admin/CliniqueScreen';
import { AuditLogsScreen } from '../screens/admin/AuditLogsScreen';
import { SystemJobsScreen } from '../screens/admin/SystemJobsScreen';
import { ProfilScreen } from '../screens/shared/ProfilScreen';
import { ParametresScreen } from '../screens/shared/ParametresScreen';
import { SynchronisationScreen } from '../screens/shared/SynchronisationScreen';

const Stack = createNativeStackNavigator();

function AdminTabs() {
  const items = useMemo<RoleTabItem[]>(() => [
    { key: 'Dashboard', title: 'Dashboard', icon: 'grid', component: DashboardScreen, visible: true },
    { key: 'Utilisateurs', title: 'Utilisateurs', icon: 'people', component: UtilisateursScreen, visible: true },
    { key: 'Services', title: 'Services', icon: 'medkit', component: ServicesScreen, visible: true },
    { key: 'SystemJobs', title: 'Jobs', icon: 'construct', component: SystemJobsScreen, visible: true },
    { key: 'Permissions', title: 'Permissions', icon: 'shield', component: PermissionsScreen, hidden: true },
    { key: 'Clinique', title: 'Clinique', icon: 'business', component: CliniqueScreen, hidden: true },
    { key: 'AuditLogs', title: 'Audit', icon: 'clipboard', component: AuditLogsScreen, hidden: true },
    { key: 'Profil', title: 'Profil', icon: 'person', component: ProfilScreen, hidden: true },
    { key: 'Synchronisation', title: 'Sync', icon: 'construct', component: SynchronisationScreen, hidden: true },
    { key: 'Parametres', title: 'Reglages', icon: 'construct', component: ParametresScreen, hidden: true },
  ], []);

  return <RoleTabNavigator items={items} />;
}

function AdminDrawer() {
  const { hasPermission, permissions } = useAuth();

  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<DrawerMenuItem[]>(
    () => [
      { key: 'Dashboard', label: 'Tableau de bord', icon: 'grid-outline', visible: true },
      { key: 'Utilisateurs', label: 'Utilisateurs', icon: 'people-outline', visible: canAccess('voir_utilisateurs') },
      { key: 'Permissions', label: 'Permissions', icon: 'shield-outline', visible: canAccess('attribuer_permissions') },
      { key: 'Services', label: 'Services', icon: 'medkit-outline', visible: canAccess('gerer_services') },
      { key: 'Clinique', label: 'Clinique', icon: 'business-outline', visible: canAccess('gerer_clinique') },
      { key: 'AuditLogs', label: 'Audit production', icon: 'document-text-outline', visible: canAccess('voir_audit_logs') },
      { key: 'SystemJobs', label: 'Jobs systeme', icon: 'construct-outline', visible: true },
      { key: 'Profil', label: 'Mon profil', icon: 'person-outline', visible: true },
      { key: 'Synchronisation', label: 'Synchronisation', icon: 'sync-outline', visible: true },
      { key: 'Parametres', label: 'Parametres', icon: 'settings-outline', visible: true },
    ],
    [canAccess]
  );

  return <ActorDrawerNavigator items={items} rootRouteName="AdminTabs" rootComponent={AdminTabs} />;
}

export function AdminNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="AdminDrawer" component={AdminDrawer} />
      <Stack.Screen name="UtilisateurDetail" component={UtilisateurDetailScreen} />
    </Stack.Navigator>
  );
}
