import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const rdvApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.appointments.base, { params }),
  getArchives: (params?: object) => client.get(API_ENDPOINTS.appointments.archives, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.appointments.one(id)),
  create: (data: object) => client.post(API_ENDPOINTS.appointments.base, data),
  updateStatut: (id: number, data: object) => client.patch(API_ENDPOINTS.appointments.statut(id), data),
  cancel: (id: number, data: object) => client.delete(API_ENDPOINTS.appointments.one(id), { data }),
  resetArchiveDelay: (id: number) => client.patch(API_ENDPOINTS.appointments.resetArchive(id)),
  permanentDelete: (id: number) => client.delete(API_ENDPOINTS.appointments.permanentDelete(id)),
};
