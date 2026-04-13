import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const utilisateursApi = {
  getAll: (params?: object) => client.get(API_ENDPOINTS.users.base, { params }),
  getOne: (id: number) => client.get(API_ENDPOINTS.users.one(id)),
  create: (data: object) => client.post(API_ENDPOINTS.users.base, data),
  update: (id: number, data: object) => client.put(API_ENDPOINTS.users.one(id), data),
  archive: (id: number) => client.delete(API_ENDPOINTS.users.one(id)),
  changePassword: (id: number, data: object) => client.patch(API_ENDPOINTS.users.password(id), data),
  updatePhoto: (id: number, formData: FormData, uploadId?: string) =>
    client.put(API_ENDPOINTS.users.photo(id), formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(uploadId ? { 'X-Upload-Id': uploadId } : {}),
      },
    }),
};
