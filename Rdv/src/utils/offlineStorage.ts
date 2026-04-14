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
  expiresAt: string;
}

const KEYS = {
  QUEUE: '@clinique:offlineQueue',
  CACHE: '@clinique:apiGetCache',
};

const GET_CACHE_TTL_MS = 5 * 60 * 1000;
const MAX_CACHE_ENTRIES = 80;

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
    const now = Date.now();
    cache[key] = {
      key,
      payload,
      updatedAt: new Date(now).toISOString(),
      expiresAt: new Date(now + GET_CACHE_TTL_MS).toISOString(),
    };

    const entries = Object.values(cache)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, MAX_CACHE_ENTRIES);

    const trimmed = entries.reduce<Record<string, CachedGetEntry>>((acc, entry) => {
      acc[entry.key] = entry;
      return acc;
    }, {});
    await AsyncStorage.setItem(KEYS.CACHE, JSON.stringify(trimmed));
  },

  async getCachedGet(config: InternalAxiosRequestConfig): Promise<unknown | null> {
    const key = buildGetCacheKey(config);
    const raw = await AsyncStorage.getItem(KEYS.CACHE);
    const cache = safeParse<Record<string, CachedGetEntry>>(raw, {});
    const entry = cache[key];
    if (!entry) return null;

    const expiresAt = Date.parse(entry.expiresAt);
    if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
      delete cache[key];
      await AsyncStorage.setItem(KEYS.CACHE, JSON.stringify(cache));
      return null;
    }

    return entry.payload ?? null;
  },

  async invalidateGetCache(matcher?: string | RegExp) {
    const raw = await AsyncStorage.getItem(KEYS.CACHE);
    const cache = safeParse<Record<string, CachedGetEntry>>(raw, {});

    if (!matcher) {
      await AsyncStorage.removeItem(KEYS.CACHE);
      return;
    }

    const next = Object.entries(cache).reduce<Record<string, CachedGetEntry>>((acc, [key, entry]) => {
      const matches = typeof matcher === 'string' ? key.includes(matcher) : matcher.test(key);
      if (!matches) acc[key] = entry;
      return acc;
    }, {});

    await AsyncStorage.setItem(KEYS.CACHE, JSON.stringify(next));
  },
};

export type { QueuedMutation, HttpMethod };
