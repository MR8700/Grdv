import React, { useCallback, useMemo } from 'react';
import { ActorDrawerNavigator } from './ActorDrawerNavigator';
import { useAuth } from '../store/AuthContext';
import { AgendaScreen } from '../screens/medecin/AgendaScreen';
import { DisponibilitesScreen } from '../screens/medecin/DisponibilitesScreen';
import { PatientsScreen } from '../screens/medecin/PatientsScreen';
import { StatsMedecinScreen } from '../screens/medecin/StatsMedecinScreen';
import { DelegationsScreen } from '../screens/medecin/DelegationsScreen';
import { ProfilScreen } from '../screens/shared/ProfilScreen';
import { SynchronisationScreen } from '../screens/shared/SynchronisationScreen';
import { ParametresScreen } from '../screens/shared/ParametresScreen';
import { DrawerMenuItem } from '../components/layout/DrawerContent';
import { RoleTabItem, RoleTabNavigator } from './RoleTabNavigator';

function MedecinTabs() {
  const { hasPermission, permissions } = useAuth();
  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<RoleTabItem[]>(() => [
    { key: 'Agenda', title: 'Agenda', icon: 'calendar', component: AgendaScreen, visible: true },
    { key: 'Disponibilites', title: 'Creneaux', icon: 'time', component: DisponibilitesScreen, visible: canAccess('voir_disponibilites') },
    { key: 'Patients', title: 'Patients', icon: 'people', component: PatientsScreen, visible: canAccess('voir_dossier_medical') },
    { key: 'StatsMedecin', title: 'Stats', icon: 'bar-chart', component: StatsMedecinScreen, visible: true },
    { key: 'Delegations', title: 'Delegations', icon: 'shield', component: DelegationsScreen, hidden: true },
    { key: 'Profil', title: 'Profil', icon: 'person', component: ProfilScreen, hidden: true },
    { key: 'Synchronisation', title: 'Sync', icon: 'construct', component: SynchronisationScreen, hidden: true },
    { key: 'Parametres', title: 'Reglages', icon: 'construct', component: ParametresScreen, hidden: true },
  ], [canAccess]);

  return <RoleTabNavigator items={items} />;
}

export function MedecinNavigator() {
  const { hasPermission, permissions } = useAuth();
  const canAccess = useCallback(
    (permission: string) => permissions.length === 0 || hasPermission(permission),
    [hasPermission, permissions]
  );

  const items = useMemo<DrawerMenuItem[]>(() => [
    { key: 'Agenda', label: 'Agenda', icon: 'calendar-outline', visible: true },
    { key: 'Disponibilites', label: 'Creneaux', icon: 'time-outline', visible: canAccess('voir_disponibilites') },
    { key: 'Patients', label: 'Patients', icon: 'people-outline', visible: canAccess('voir_dossier_medical') },
    { key: 'StatsMedecin', label: 'Statistiques', icon: 'bar-chart-outline', visible: true },
    { key: 'Delegations', label: 'Delegations', icon: 'shield-outline', visible: true },
    { key: 'Profil', label: 'Mon profil', icon: 'person-outline', visible: true },
    { key: 'Synchronisation', label: 'Synchronisation', icon: 'sync-outline', visible: true },
    { key: 'Parametres', label: 'Parametres', icon: 'settings-outline', visible: true },
  ], [canAccess]);

  return <ActorDrawerNavigator items={items} rootRouteName="MedecinTabs" rootComponent={MedecinTabs} />;
}
