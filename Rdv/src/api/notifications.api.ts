import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const notificationsApi = {
  getMine: (params?: object) =>
    client.get(API_ENDPOINTS.notifications.base, { params }),

  markAsRead: (id: number) =>
    client.patch(API_ENDPOINTS.notifications.markRead(id)),

  markAllRead: () =>
    client.patch(API_ENDPOINTS.notifications.markAllRead),

  deleteOne: (id: number) =>
    client.delete(API_ENDPOINTS.notifications.delete(id)),

  create: (data: object) =>
    client.post(API_ENDPOINTS.notifications.base, data),
};