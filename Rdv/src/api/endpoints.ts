const usersBase = '/utilisateurs';
const doctorsBase = '/medecins';
const patientsBase = '/patients';
const servicesBase = '/services';
const appointmentsBase = '/rendez-vous';
const availabilityBase = '/disponibilites';
const notificationsBase = '/notifications';
const jobsBase = '/system-jobs';
const auditBase = '/audit-logs';
const adminBase = '/administrateurs';

export const API_ENDPOINTS = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    refresh: '/auth/refresh',
    logout: '/auth/logout',
    me: '/auth/me',
  },
  users: {
    base: usersBase,
    one: (id: number) => `${usersBase}/${id}`,
    password: (id: number) => `${usersBase}/${id}/password`,
    photo: (id: number) => `${usersBase}/${id}/photo`,
  },
  doctors: {
    base: doctorsBase,
    one: (id: number) => `${doctorsBase}/${id}`,
    disponibilites: (id: number) => `${doctorsBase}/${id}/disponibilites`,
    plannings: (id: number) => `${doctorsBase}/${id}/plannings`,
    delegations: (id: number) => `${doctorsBase}/${id}/delegations`,
    updateDelegation: (id: number, secretaryId: number) => `${doctorsBase}/${id}/delegations/${secretaryId}`,
  },
  patients: {
    base: patientsBase,
    one: (id: number) => `${patientsBase}/${id}`,
    appointments: (id: number) => `${patientsBase}/${id}/rendez-vous`,
  },
  clinique: {
    base: '/clinique',
    logo: '/clinique/logo',
  },
  services: {
    base: servicesBase,
    one: (id: number) => `${servicesBase}/${id}`,
  },
  disponibilites: {
    base: availabilityBase,
    one: (id: number) => `${availabilityBase}/${id}`,
  },
  appointments: {
    base: appointmentsBase,
    one: (id: number) => `${appointmentsBase}/${id}`,
    statut: (id: number) => `${appointmentsBase}/${id}/statut`,
  },
  notifications: {
    base: notificationsBase,
    one: (id: number) => `${notificationsBase}/${id}`,
    markRead: (id: number) => `${notificationsBase}/${id}/lu`,
    markAllRead: `${notificationsBase}/lu-tout`,
    delete: (id: number) => `${notificationsBase}/${id}`,
  },
  audit: {
    base: auditBase,
    byUser: (id: number) => `${auditBase}/user/${id}`,
  },
  systemJobs: {
    base: jobsBase,
    one: (id: number) => `${jobsBase}/${id}`,
    runManual: (taskType: string) => `${jobsBase}/run/${taskType}`,
  },
  admin: {
    base: adminBase,
    permissionsMatrix: `${adminBase}/permissions/matrix`,
    updateRolePermissions: (roleId: number) => `${adminBase}/permissions/${roleId}`,
    requestImpersonation: `${adminBase}/impersonation/request`,
    forceImpersonation: `${adminBase}/impersonation/force`,
  },
} as const;
