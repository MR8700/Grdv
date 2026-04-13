export type TypeUser = 'patient' | 'medecin' | 'secretaire' | 'administrateur';
export type StatutUser = 'actif' | 'archive' | 'suspendu';
export type StatutRdv = 'en_attente' | 'confirme' | 'refuse' | 'annule' | 'archive';
export type TypeNotification = 'rappel' | 'urgence' | 'information';
export type StatutJob = 'attente' | 'succes' | 'echec';
export type GroupeSanguin = 'A+' | 'A-' | 'B+' | 'B-' | 'O+' | 'O-' | 'AB+' | 'AB-';

export interface Role {
  id_role: number;
  nom_role: string;
  description?: string;
  permissions?: Permission[];
}

export interface Permission {
  id_permission: number;
  nom_permission: string;
  description?: string;
}

export interface Utilisateur {
  id_user: number;
  login: string;
  nom: string;
  prenom: string;
  email?: string;
  photo_path?: string;
  type_user: TypeUser;
  statut: StatutUser;
  id_role?: number;
  date_creation?: string;
  date_archivage?: string;
  effective_permissions?: string[];
  delegated_permissions?: string[];
  role?: Role;
  profil_medecin?: Medecin;
  profil_patient?: Patient;
  profil_secretaire?: Secretaire;
  profil_administrateur?: Administrateur;
}

export interface Medecin {
  id_user: number;
  code_rpps: string;
  specialite_principale?: string;
  utilisateur?: Utilisateur;
}

export interface Patient {
  id_user: number;
  num_secu_sociale?: string;
  groupe_sanguin?: GroupeSanguin;
  id_dossier_medical?: string;
  utilisateur?: Utilisateur;
}

export interface Secretaire {
  id_user: number;
  id_service_affecte?: number;
  id_services_affectes?: number[];
  utilisateur?: Utilisateur;
  service_affecte?: Service;
  services_affectes?: Service[];
}

export interface Administrateur {
  id_user: number;
  niveau_acces: number;
  utilisateur?: Utilisateur;
}

export interface Clinique {
  id_clinique: number;
  nom: string;
  adresse?: string;
  logo_path?: string;
  site_web?: string;
  services?: Service[];
}

export interface Service {
  id_service: number;
  nom_service: string;
  image_path?: string;
  description?: string;
  id_clinique?: number;
  clinique?: Clinique;
}

export interface Planning {
  id_planning: number;
  id_medecin: number;
  id_service?: number;
  derniere_maj: string;
  medecin?: Medecin;
  service?: Service;
}

export interface Disponibilite {
  id_dispo: number;
  id_medecin: number;
  id_service?: number;
  date_heure_debut: string;
  date_heure_fin: string;
  capacite_max: number;
  est_libre: boolean;
  medecin?: Medecin;
  service?: Service;
}

export interface RendezVous {
  id_rdv: number;
  id_planning?: number;
  id_patient?: number;
  id_medecin?: number;
  id_dispo: number;
  date_heure_rdv: string;
  statut_rdv: StatutRdv;
  motif?: string;
  date_enregistrement: string;
  patient?: Patient;
  medecin?: Medecin;
  disponibilite?: Disponibilite;
}

export interface Notification {
  id_notif: number;
  id_user: number;
  id_rdv?: number;
  type_notification: TypeNotification;
  message: string;
  lu: boolean;
  date_envoi: string;
}

export interface AuditLog {
  id_log: number;
  horodatage: string;
  id_user?: number;
  action_type?: string;
  table_nom?: string;
  description_details?: Record<string, unknown>;
  adresse_ip?: string;
  utilisateur?: Utilisateur;
}

export interface SystemJob {
  id_job: number;
  type_tache?: string;
  parametres?: Record<string, unknown>;
  statut: StatutJob;
  date_execution_prevue?: string;
  nombre_tentatives: number;
}

export interface AuthFormData {
  login: string;
  password: string;
  nom?: string;
  prenom?: string;
  email?: string;
  confirmPassword?: string;
  photo_path?: string;
  type_user?: TypeUser;
  code_rpps?: string;
  specialite_principale?: string;
  id_service_affecte?: string;
  id_services_affectes?: string[];
  num_secu_sociale?: string;
  groupe_sanguin?: GroupeSanguin;
  photo_asset?: {
    uri: string;
    type: string;
    name: string;
  };
}
