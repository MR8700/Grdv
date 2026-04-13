export interface ApiResponse<T = null> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id_user: number;
    login: string;
    nom: string;
    prenom: string;
    email?: string;
    photo_path?: string;
    type_user: 'patient' | 'medecin' | 'secretaire' | 'administrateur';
    statut: 'actif' | 'archive' | 'suspendu';
    date_creation?: string;
  };
}

export interface ApiError {
  success: false;
  message: string;
  code?: string;
  errors?: Array<{ field: string; message: string }>;
}
