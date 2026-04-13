import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const notificationsApi = {
  getMine: (params?: object) => client.get(API_ENDPOINTS.notifications.base, { params }),
  markAsRead: (id: number) => client.patch(API_ENDPOINTS.notifications.markRead(id)),
  markAllRead: () => client.patch(API_ENDPOINTS.notifications.markAllRead),
  create: (data: object) => client.post(API_ENDPOINTS.notifications.base, data),
};