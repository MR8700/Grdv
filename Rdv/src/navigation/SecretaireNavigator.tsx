import React, { useCallback, useMemo } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNotifContext } from '../store/NotifContext';
import { ActorDrawerNavigator } from './ActorDrawerNavigator';
import { GestionRdvScreen } from '../screens/secretaire/GestionRdvScreen';
import { PatientsScreen } from '../screens/secretaire/PatientsScreen';
import { ArchivesRdvScreen } from '../screens/shared/ArchivesRdvScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ProfilScreen } from '../screens/shared/ProfilScreen';
import { SynchronisationScreen } from '../screens/shared/SynchronisationScreen';
import { ParametresScreen } from '../screens/shared/ParametresScreen';
import { DrawerMenuItem } from '../components/layout/DrawerContent';
import { RoleTabItem, RoleTabNavigator } from './RoleTabNavigator';

function SecretaireTabs() {
  const { hasPermission, permissions } = useAuth();
  const { unreadCount } = useNotifContext();
  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<RoleTabItem[]>(() => [
    { key: 'GestionRdv', title: 'RDV', icon: 'calendar', component: GestionRdvScreen, visible: canAccess('voir_rdv') },
    { key: 'Patients', title: 'Patients', icon: 'people', component: PatientsScreen, visible: canAccess('voir_utilisateurs') },
    { key: 'Notifications', title: 'Notifications', icon: 'notifications', component: NotificationsScreen, badge: unreadCount, visible: true },
    { key: 'Archives', title: 'Archives', icon: 'archive', component: ArchivesRdvScreen, hidden: true },
    { key: 'Profil', title: 'Profil', icon: 'person', component: ProfilScreen, visible: true },
    { key: 'Synchronisation', title: 'Synchro', icon: 'construct', component: SynchronisationScreen, hidden: true },
    { key: 'Parametres', title: 'Reglages', icon: 'construct', component: ParametresScreen, hidden: true },
  ], [canAccess, unreadCount]);

  return <RoleTabNavigator items={items} />;
}

export function SecretaireNavigator() {
  const { hasPermission, permissions } = useAuth();
  const { unreadCount } = useNotifContext();
  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<DrawerMenuItem[]>(() => [
    { key: 'GestionRdv', label: 'Rendez-vous', icon: 'calendar-outline', visible: canAccess('voir_rdv') },
    { key: 'Patients', label: 'Patients', icon: 'people-outline', visible: canAccess('voir_utilisateurs') },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', badge: unreadCount, visible: true },
    { key: 'Archives', label: 'Archives', icon: 'archive-outline', visible: true },
    { key: 'Profil', label: 'Mon profil', icon: 'person-outline', visible: true },
    { key: 'Synchronisation', label: 'Synchronisation', icon: 'sync-outline', visible: true },
    { key: 'Parametres', label: 'Parametres', icon: 'settings-outline', visible: true },
  ], [canAccess, unreadCount]);

  return <ActorDrawerNavigator items={items} rootRouteName="SecretaireTabs" rootComponent={SecretaireTabs} />;
}
