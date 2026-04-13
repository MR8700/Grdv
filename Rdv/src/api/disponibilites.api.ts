import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const dispoApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.disponibilites.base, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.disponibilites.one(id)),
  create: (data: object) => client.post(API_ENDPOINTS.disponibilites.base, data),
  update: (id: number, data: object) => client.put(API_ENDPOINTS.disponibilites.one(id), data),
  remove: (id: number) => client.delete(API_ENDPOINTS.disponibilites.one(id)),
};