import axios, { AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { getApiErrorMessage, isNetworkError } from './errors';
import { Storage } from '../utils/storage';
import { API_BASE_URL, API_TIMEOUT } from '../utils/constants';
import { OfflineStorage } from '../utils/offlineStorage';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

type RetryableConfig = InternalAxiosRequestConfig & { _retry?: boolean };

const isWriteMethod = (method?: string) => {
  const value = String(method || '').toLowerCase();
  return value === 'post' || value === 'put' || value === 'patch' || value === 'delete';
};

const isFormDataPayload = (value: unknown) => {
  if (!value) return false;
  if (typeof FormData !== 'undefined' && value instanceof FormData) return true;
  return Object.prototype.toString.call(value) === '[object FormData]';
};

const parseBody = (raw: unknown) => {
  if (!raw) return undefined;
  if (typeof raw === 'string') {
    try {
      return JSON.parse(raw);
    } catch {
      return raw;
    }
  }
  return raw;
};

const queuedResponse = (config: InternalAxiosRequestConfig): AxiosResponse => ({
  data: {
    success: true,
    queued: true,
    message: 'Action enregistree hors ligne. Synchronisation automatique au retour du reseau.',
    data: parseBody(config.data) ?? null,
  },
  status: 202,
  statusText: 'Accepted',
  headers: {},
  config,
});

client.interceptors.request.use(async (config) => {
  const token = await Storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: string) => void; reject: (e: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
      return;
    }

    if (token) {
      resolve(token);
      return;
    }

    reject(new Error('Token refresh failed'));
  });

  failedQueue = [];
};

client.interceptors.response.use(
  async (response) => {
    const method = String(response.config.method || 'get').toLowerCase();
    if (method === 'get') {
      await OfflineStorage.cacheGet(response.config, response.data);
    } else if (isWriteMethod(method)) {
      const url = String(response.config.url || '');
      if (url) {
        await OfflineStorage.invalidateGetCache(url);
      }
    }
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as RetryableConfig | undefined;

    if (original && isNetworkError(error)) {
      const method = String(original.method || 'get').toLowerCase();

      if (method === 'get') {
        const cached = await OfflineStorage.getCachedGet(original);
        if (cached) {
          return {
            data: cached,
            status: 200,
            statusText: 'OK (cache)',
            headers: {},
            config: original,
          } as AxiosResponse;
        }
      }

      if (isWriteMethod(method)) {
        if (isFormDataPayload(original.data)) {
          error.message = 'Hors ligne: upload fichier impossible. Reessayez une fois connecte.';
          return Promise.reject(error);
        }

        await OfflineStorage.enqueueMutation({
          method: method as 'post' | 'put' | 'patch' | 'delete',
          url: String(original.url || ''),
          data: parseBody(original.data),
          params: original.params,
          headers: { 'Content-Type': 'application/json' },
        });

        const { Toast } = require('../components/ui/AppAlert');
        Toast.warning('Mode hors ligne', 'Action sauvegardee localement et en attente de synchronisation.');

        return queuedResponse(original);
      }
    }

    if (!original || error.response?.status !== 401 || original._retry) {
      if (isNetworkError(error)) {
        error.message = getApiErrorMessage(error);
      }
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (original.headers) {
          original.headers.Authorization = `Bearer ${token}`;
        }
        return client(original);
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await Storage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('Missing refresh token');
      }

      const response = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
      const newAccessToken = response?.data?.data?.accessToken as string | undefined;
      const newRefreshToken = (response?.data?.data?.refreshToken as string | undefined) ?? refreshToken;

      if (!newAccessToken) {
        throw new Error('Invalid refresh payload');
      }

      await Storage.setTokens(newAccessToken, newRefreshToken);
      processQueue(null, newAccessToken);

      if (original.headers) {
        original.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return client(original);
    } catch (refreshError) {
      processQueue(refreshError, null);
      if (!isNetworkError(refreshError)) {
        await Storage.clear();
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default client;
