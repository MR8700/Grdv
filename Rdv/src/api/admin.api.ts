import client from './client';
import { API_ENDPOINTS } from './endpoints';

export const adminApi = {
  getPermissionsMatrix: () => client.get(API_ENDPOINTS.admin.permissionsMatrix),
  updateRolePermissions: (roleId: number, permissionIds: number[]) =>
    client.put(API_ENDPOINTS.admin.updateRolePermissions(roleId), {
      permission_ids: permissionIds,
    }),
  requestImpersonation: (targetUserId: number, justification: string) =>
    client.post(API_ENDPOINTS.admin.requestImpersonation, {
      target_user_id: targetUserId,
      justification,
    }),
  forceImpersonation: (targetUserId: number, justification: string) =>
    client.post(API_ENDPOINTS.admin.forceImpersonation, {
      target_user_id: targetUserId,
      justification,
    }),
};

