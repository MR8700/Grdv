import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const cliniqueApi = {
  get: () => client.get(API_ENDPOINTS.clinique.base),
  update: (data: object) => client.put(API_ENDPOINTS.clinique.base, data),
  updateLogo: (formData: FormData, uploadId?: string) =>
    client.put(API_ENDPOINTS.clinique.logo, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        ...(uploadId ? { 'X-Upload-Id': uploadId } : {}),
      },
    }),
};
