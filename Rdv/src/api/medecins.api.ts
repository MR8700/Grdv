import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const medecinsApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.doctors.base, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.doctors.one(id)),
  getDisponibilites: (id: number, params?: object) => client.get(API_ENDPOINTS.doctors.disponibilites(id), { params }),
  getPlannings: (id: number) => client.get(API_ENDPOINTS.doctors.plannings(id)),
  getDelegations: (id: number) => client.get(API_ENDPOINTS.doctors.delegations(id)),
  updateDelegation: (id: number, secretaryId: number, permissionIds: number[]) =>
    client.put(API_ENDPOINTS.doctors.updateDelegation(id, secretaryId), { permission_ids: permissionIds }),
  update: (id: number, data: object) => client.put(API_ENDPOINTS.doctors.one(id), data),
};
