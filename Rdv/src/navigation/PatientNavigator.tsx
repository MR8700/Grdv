import React, { useCallback, useMemo } from 'react';
import { useAuth } from '../store/AuthContext';
import { useNotifContext } from '../store/NotifContext';
import { ActorDrawerNavigator } from './ActorDrawerNavigator';
import { HomePatientScreen } from '../screens/patient/HomePatientScreen';
import { PriseRdvScreen } from '../screens/patient/PriseRdvScreen';
import { MesRdvScreen } from '../screens/patient/MesRdvScreen';
import { MonDossierScreen } from '../screens/patient/MonDossierScreen';
import { NotificationsScreen } from '../screens/shared/NotificationsScreen';
import { ProfilScreen } from '../screens/shared/ProfilScreen';
import { SynchronisationScreen } from '../screens/shared/SynchronisationScreen';
import { ParametresScreen } from '../screens/shared/ParametresScreen';
import { DrawerMenuItem } from '../components/layout/DrawerContent';
import { RoleTabItem, RoleTabNavigator } from './RoleTabNavigator';

function PatientTabs() {
  const { hasPermission, permissions } = useAuth();
  const { unreadCount } = useNotifContext();
  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<RoleTabItem[]>(() => [
    { key: 'Accueil', title: 'Accueil', icon: 'home', component: HomePatientScreen, visible: true },
    { key: 'PriseRdv', title: 'Prendre RDV', icon: 'calendar', component: PriseRdvScreen, visible: canAccess('creer_rdv') },
    { key: 'MesRdv', title: 'Mes RDV', icon: 'clipboard', component: MesRdvScreen, visible: canAccess('voir_rdv') },
    { key: 'Notifications', title: 'Notifications', icon: 'notifications', component: NotificationsScreen, badge: unreadCount, visible: true },
    { key: 'MonDossier', title: 'Dossier', icon: 'folder', component: MonDossierScreen, hidden: true },
    { key: 'Profil', title: 'Profil', icon: 'person', component: ProfilScreen, hidden: true },
    { key: 'Synchronisation', title: 'Synchro', icon: 'construct', component: SynchronisationScreen, hidden: true },
    { key: 'Parametres', title: 'Réglages', icon: 'construct', component: ParametresScreen, hidden: true },
  ], [canAccess, unreadCount]);

  return <RoleTabNavigator items={items} />;
}

export function PatientNavigator() {
  const { hasPermission, permissions } = useAuth();
  const { unreadCount } = useNotifContext();
  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<DrawerMenuItem[]>(() => [
    { key: 'Accueil', label: 'Accueil', icon: 'home-outline', visible: true },
    { key: 'PriseRdv', label: 'Prendre RDV', icon: 'calendar-outline', visible: canAccess('creer_rdv') },
    { key: 'MesRdv', label: 'Mes RDV', icon: 'clipboard-outline', visible: canAccess('voir_rdv') },
    { key: 'Notifications', label: 'Notifications', icon: 'notifications-outline', badge: unreadCount, visible: true },
    { key: 'MonDossier', label: 'Mon dossier', icon: 'folder-outline', visible: true },
    { key: 'Profil', label: 'Mon profil', icon: 'person-outline', visible: true },
    { key: 'Synchronisation', label: 'Synchronisation', icon: 'sync-outline', visible: true },
    { key: 'Parametres', label: 'Paramètres', icon: 'settings-outline', visible: true },
  ], [canAccess, unreadCount]);

  return <ActorDrawerNavigator items={items} rootRouteName="PatientTabs" rootComponent={PatientTabs} />;
}
