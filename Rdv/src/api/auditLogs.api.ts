import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const auditApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.audit.base, { params }),
  getByUser: (id: number, params?: object) => client.get(API_ENDPOINTS.audit.byUser(id), { params }),
};