import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const systemJobsApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.systemJobs.base, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.systemJobs.one(id)),
  runManual: (type_tache: string) => client.post(API_ENDPOINTS.systemJobs.runManual(type_tache)),
  remove: (id: number) => client.delete(API_ENDPOINTS.systemJobs.one(id)),
};