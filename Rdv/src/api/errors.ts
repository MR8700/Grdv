import axios from 'axios';

interface ApiErrorShape {
  message?: string;
  code?: string;
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

export const isNetworkError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  return !error.response || error.code === 'ERR_NETWORK' || error.code === 'ECONNABORTED';
};

export const isBackendUnavailableError = (error: unknown): boolean => {
  if (!axios.isAxiosError(error)) return false;
  if (isNetworkError(error)) return true;

  const status = error.response?.status ?? 0;
  return status >= 502 && status <= 504;
};

export const getApiErrorMessage = (error: unknown, fallback = 'Une erreur est survenue') => {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (message) return message;

    if (error.code === 'ECONNABORTED') {
      return 'Le serveur met trop de temps à répondre.';
    }

    if (isNetworkError(error)) {
      return 'Serveur indisponible. Vérifiez la connexion backend.';
    }
  }

  const asApiError = error as ApiErrorShape;
  return asApiError?.message || fallback;
};

