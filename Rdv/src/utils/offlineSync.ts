import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './constants';
import { isNetworkError } from '../api/errors';
import { Storage } from './storage';
import { OfflineStorage } from './offlineStorage';

const MAX_ATTEMPTS = 3;

const syncClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

export async function flushPendingMutations(): Promise<number> {
  const queue = await OfflineStorage.getQueue();
  if (queue.length === 0) return 0;

  const pending = [...queue];
  let synced = 0;

  for (let i = 0; i < pending.length; i += 1) {
    const item = pending[i];

    try {
      const token = await Storage.getAccessToken();
      const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

      await syncClient.request({
        method: item.method,
        url: item.url,
        data: item.data,
        params: item.params,
        headers: {
          ...item.headers,
          ...authHeader,
        },
      });

      pending.splice(i, 1);
      i -= 1;
      synced += 1;
      continue;
    } catch (error) {
      if (isNetworkError(error)) {
        break;
      }

      item.attempts += 1;
      if (item.attempts >= MAX_ATTEMPTS) {
        pending.splice(i, 1);
        i -= 1;
      }
    }
  }

  await OfflineStorage.setQueue(pending);
  return synced;
}

export async function getPendingMutationsCount(): Promise<number> {
  const queue = await OfflineStorage.getQueue();
  return queue.length;
}