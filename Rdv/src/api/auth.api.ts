import client from './client';
import { ApiResponse, LoginResponse } from '../types/api.types';
import { API_ENDPOINTS } from './endpoints';
import { GroupeSanguin, TypeUser } from '../types/models.types';

export interface RegisterPayload {
  login: string;
  password: string;
  nom: string;
  prenom: string;
  email?: string;
  type_user: Extract<TypeUser, 'patient' | 'medecin' | 'secretaire'>;
  code_rpps?: string;
  specialite_principale?: string;
  id_service_affecte?: number;
  id_services_affectes?: number[];
  num_secu_sociale?: string;
  groupe_sanguin?: GroupeSanguin;
}

export const authApi = {
  login: (login: string, password: string) =>
    client.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.auth.login, { login, password }),
  register: (payload: RegisterPayload) =>
    client.post<ApiResponse<LoginResponse>>(API_ENDPOINTS.auth.register, payload),
  refresh: (refreshToken: string) =>
    client.post<ApiResponse<{ accessToken: string; refreshToken?: string }>>(API_ENDPOINTS.auth.refresh, { refreshToken }),
  logout: () => client.post<ApiResponse<null>>(API_ENDPOINTS.auth.logout),
  me: () => client.get<ApiResponse<LoginResponse['user']>>(API_ENDPOINTS.auth.me),
};
