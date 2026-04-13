import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const servicesApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.services.base, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.services.one(id)),
  create: (data: object) => client.post(API_ENDPOINTS.services.base, data),
  update: (id: number, data: object) => client.put(API_ENDPOINTS.services.one(id), data),
  remove: (id: number) => client.delete(API_ENDPOINTS.services.one(id)),
};