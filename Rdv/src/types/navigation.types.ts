export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;
  Register: undefined;
};

export type AdminDrawerParamList = {
  Dashboard: undefined;
  Utilisateurs: undefined;
  Permissions: undefined;
  Services: undefined;
  Clinique: undefined;
  AuditLogs: undefined;
  SystemJobs: undefined;
  Profil: undefined;
  Synchronisation: undefined;
  Parametres: undefined;
};

export type MedecinTabParamList = {
  Agenda: undefined;
  Disponibilites: undefined;
  Patients: undefined;
  StatsMedecin: undefined;
  Profil: undefined;
  Synchronisation: undefined;
};

export type PatientTabParamList = {
  Accueil: undefined;
  PriseRdv: { medecinId?: number } | undefined;
  MesRdv: undefined;
  Notifications: undefined;
  MonDossier: undefined;
  Profil: undefined;
  Synchronisation: undefined;
};

export type SecretaireTabParamList = {
  GestionRdv: undefined;
  Patients: undefined;
  Notifications: undefined;
  Profil: undefined;
  Synchronisation: undefined;
};

export type AdminStackParamList = AdminDrawerParamList & {
  UtilisateurDetail: { id_user: number };
  PatientDossier: { id_user: number };
};

