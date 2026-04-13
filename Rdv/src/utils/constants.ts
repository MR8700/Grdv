import { StatutJob, StatutRdv, StatutUser, TypeNotification, TypeUser } from '../types/models.types';

type EnvSource = {
  API_BASE_URL?: string;
  REACT_NATIVE_API_BASE_URL?: string;
  EXPO_PUBLIC_API_BASE_URL?: string;
  API_ORIGIN?: string;
  REACT_NATIVE_API_ORIGIN?: string;
  EXPO_PUBLIC_API_ORIGIN?: string;
  FRONTEND_ONLY_MODE?: string;
  REACT_NATIVE_FRONTEND_ONLY?: string;
  EXPO_PUBLIC_FRONTEND_ONLY?: string;
};

const runtimeEnv: EnvSource =
  typeof globalThis !== 'undefined' && 'process' in globalThis
    ? (((globalThis as typeof globalThis & { process?: { env?: EnvSource } }).process?.env ?? {}) as EnvSource)
    : {};

export const TYPE_USER: Record<string, TypeUser> = {
  PATIENT: 'patient',
  MEDECIN: 'medecin',
  SECRETAIRE: 'secretaire',
  ADMINISTRATEUR: 'administrateur',
};

export const STATUT_USER: Record<string, StatutUser> = {
  ACTIF: 'actif',
  ARCHIVE: 'archive',
  SUSPENDU: 'suspendu',
};

export const STATUT_RDV: Record<string, StatutRdv> = {
  EN_ATTENTE: 'en_attente',
  CONFIRME: 'confirme',
  REFUSE: 'refuse',
  ANNULE: 'annule',
  ARCHIVE: 'archive',
};

export const TYPE_NOTIFICATION: Record<string, TypeNotification> = {
  RAPPEL: 'rappel',
  URGENCE: 'urgence',
  INFORMATION: 'information',
};

export const STATUT_JOB: Record<string, StatutJob> = {
  ATTENTE: 'attente',
  SUCCES: 'succes',
  ECHEC: 'echec',
};

export const RDV_STATUT_COLORS: Record<StatutRdv, { bg: string; text: string; border: string }> = {
  en_attente: { bg: '#FFF7E6', text: '#9A6700', border: '#E6A700' },
  confirme: { bg: '#EAF8F2', text: '#126548', border: '#2DA56D' },
  refuse: { bg: '#FDEDED', text: '#A63A3A', border: '#E26868' },
  annule: { bg: '#F4F6F8', text: '#5F6B7A', border: '#CAD3DD' },
  archive: { bg: '#EBF3FB', text: '#245B9F', border: '#73A7E6' },
};

export const STATUT_RDV_LABELS: Record<StatutRdv, string> = {
  en_attente: 'En attente',
  confirme: 'Confirmé',
  refuse: 'Refusé',
  annule: 'Annulé',
  archive: 'Archivé',
};

export const TYPE_USER_LABELS: Record<TypeUser, string> = {
  patient: 'Patient',
  medecin: 'Médecin',
  secretaire: 'Secrétaire',
  administrateur: 'Administrateur',
};

export const NOTIF_COLORS: Record<TypeNotification, { bg: string; text: string }> = {
  rappel: { bg: '#EEF4FF', text: '#285EA8' },
  urgence: { bg: '#FDEDED', text: '#C24141' },
  information: { bg: '#EEF8F2', text: '#1E7B53' },
};

export const COLORS = {
  primary: '#1C6E8C',
  secondary: '#164E63',
  accent: '#D97706',
  success: '#1F8A5B',
  warning: '#C78A19',
  danger: '#D65A5A',
  info: '#3F7CAC',
  light: '#F6F8FB',
  dark: '#102433',
  gray100: '#EEF2F6',
  gray200: '#D9E2EC',
  gray400: '#93A4B6',
  gray600: '#526375',
  gray800: '#243746',
  white: '#FFFFFF',
  black: '#000000',
};

const normalizeUrl = (url?: string | null) => String(url || '').trim().replace(/\/+$/, '');

export const API_BASE_URL = normalizeUrl(
  runtimeEnv.API_BASE_URL ||
    runtimeEnv.REACT_NATIVE_API_BASE_URL ||
    runtimeEnv.EXPO_PUBLIC_API_BASE_URL ||
    'http://10.0.2.2:3000/api/v1'
);

export const API_ORIGIN = normalizeUrl(
  runtimeEnv.API_ORIGIN ||
    runtimeEnv.REACT_NATIVE_API_ORIGIN ||
    runtimeEnv.EXPO_PUBLIC_API_ORIGIN ||
    API_BASE_URL.replace(/\/api\/v1$/, '')
);

export const FRONTEND_ONLY_MODE =
  String(
    runtimeEnv.FRONTEND_ONLY_MODE ||
      runtimeEnv.REACT_NATIVE_FRONTEND_ONLY ||
      runtimeEnv.EXPO_PUBLIC_FRONTEND_ONLY ||
      'false'
  ).toLowerCase() === 'true';

export const API_TIMEOUT = 8000;

export const REFRESH_INTERVALS = {
  DASHBOARD: 30_000,
  AGENDA: 60_000,
  NOTIFICATIONS: 20_000,
  DISPONIBILITES: 60_000,
};
