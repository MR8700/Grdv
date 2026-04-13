import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const patientsApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.patients.base, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.patients.one(id)),
  getRendezVous: (id: number, params?: object) => client.get(API_ENDPOINTS.patients.appointments(id), { params }),
  update: (id: number, data: object) => client.put(API_ENDPOINTS.patients.one(id), data),
};