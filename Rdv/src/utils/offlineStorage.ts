import AsyncStorage from '@react-native-async-storage/async-storage';
import { InternalAxiosRequestConfig } from 'axios';

type HttpMethod = 'post' | 'put' | 'patch' | 'delete';

interface QueuedMutation {
  id: string;
  method: HttpMethod;
  url: string;
  data?: unknown;
  params?: unknown;
  headers?: Record<string, string>;
  createdAt: string;
  attempts: number;
}

interface CachedGetEntry {
  key: string;
  payload: unknown;
  updatedAt: string;
}

const KEYS = {
  QUEUE: '@clinique:offlineQueue',
  CACHE: '@clinique:apiGetCache',
};

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const buildGetCacheKey = (config: InternalAxiosRequestConfig) => {
  const baseURL = String(config.baseURL || '');
  const url = String(config.url || '');
  const params = JSON.stringify(config.params || {});
  return `GET:${baseURL}${url}?${params}`;
};

export const OfflineStorage = {
  buildGetCacheKey,

  async getQueue(): Promise<QueuedMutation[]> {
    const raw = await AsyncStorage.getItem(KEYS.QUEUE);
    return safeParse<QueuedMutation[]>(raw, []);
  },

  async setQueue(queue: QueuedMutation[]) {
    await AsyncStorage.setItem(KEYS.QUEUE, JSON.stringify(queue));
  },

  async enqueueMutation(input: Omit<QueuedMutation, 'id' | 'createdAt' | 'attempts'>) {
    const queue = await this.getQueue();
    const item: QueuedMutation = {
      ...input,
      id: `${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };
    queue.push(item);
    await this.setQueue(queue);
    return item;
  },

  async cacheGet(config: InternalAxiosRequestConfig, payload: unknown) {
    const key = buildGetCacheKey(config);
    const raw = await AsyncStorage.getItem(KEYS.CACHE);
    const cache = safeParse<Record<string, CachedGetEntry>>(raw, {});
    cache[key] = { key, payload, updatedAt: new Date().toISOString() };
    await AsyncStorage.setItem(KEYS.CACHE, JSON.stringify(cache));
  },

  async getCachedGet(config: InternalAxiosRequestConfig): Promise<unknown | null> {
    const key = buildGetCacheKey(config);
    const raw = await AsyncStorage.getItem(KEYS.CACHE);
    const cache = safeParse<Record<string, CachedGetEntry>>(raw, {});
    return cache[key]?.payload ?? null;
  },
};

export type { QueuedMutation, HttpMethod };