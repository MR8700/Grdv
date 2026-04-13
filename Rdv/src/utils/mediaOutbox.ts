import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE_URL, API_TIMEOUT } from './constants';
import { isNetworkError } from '../api/errors';
import { Storage } from './storage';

type UploadMethod = 'post' | 'put' | 'patch';
type UploadStatus = 'pending' | 'failed';

export interface MediaOutboxItem {
  id: string;
  uploadId: string;
  endpoint: string;
  method: UploadMethod;
  fieldName: string;
  mime: string;
  fileName: string;
  localFilePath: string;
  entityId: string;
  entityKey: string;
  createdAt: string;
  retries: number;
  status: UploadStatus;
  errorMessage?: string;
}

interface QueueMediaUploadInput {
  sourceUri: string;
  endpoint: string;
  method?: UploadMethod;
  fieldName: string;
  mime: string;
  fileName: string;
  entityId?: string | number;
  entityKey: string;
}

interface MediaSyncResult {
  synced: number;
  failed: number;
}

const KEY = '@clinique:mediaOutbox';
const MAX_RETRIES = 3;

const safeParse = <T>(raw: string | null, fallback: T): T => {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
};

const buildId = () => `${Date.now()}-${Math.floor(Math.random() * 100000)}`;
export const buildUploadId = () => `upload-${buildId()}`;

const copyToPersistentStorage = async (sourceUri: string, _mime: string) => {
  // In bare React Native without Expo FileSystem, keep source URI as-is.
  return sourceUri;
};

const readQueue = async (): Promise<MediaOutboxItem[]> => {
  const raw = await AsyncStorage.getItem(KEY);
  return safeParse(raw, []);
};

const writeQueue = async (items: MediaOutboxItem[]) => {
  await AsyncStorage.setItem(KEY, JSON.stringify(items));
};

const removeLocalFileSafe = async (_uri: string) => {
  // No-op in CLI mode without dedicated filesystem library.
};

export const MediaOutbox = {
  buildUploadId,

  async getAll() {
    return readQueue();
  },

  async getLatestForEntity(entityKey: string) {
    const queue = await readQueue();
    const items = queue.filter((item) => item.entityKey === entityKey);
    if (items.length === 0) return null;
    items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : 1));
    return items[0];
  },

  async clearEntity(entityKey: string) {
    const queue = await readQueue();
    const toDelete = queue.filter((item) => item.entityKey === entityKey);
    const keep = queue.filter((item) => item.entityKey !== entityKey);
    for (const item of toDelete) {
      await removeLocalFileSafe(item.localFilePath);
    }
    await writeQueue(keep);
  },

  async queueUpload(input: QueueMediaUploadInput): Promise<MediaOutboxItem> {
    const queue = await readQueue();
    const localFilePath = await copyToPersistentStorage(input.sourceUri, input.mime);

    const remaining = queue.filter((item) => item.entityKey !== input.entityKey);
    const replaced = queue.filter((item) => item.entityKey === input.entityKey);
    for (const item of replaced) {
      await removeLocalFileSafe(item.localFilePath);
    }

    const item: MediaOutboxItem = {
      id: buildId(),
      uploadId: buildUploadId(),
      endpoint: input.endpoint,
      method: input.method || 'put',
      fieldName: input.fieldName,
      mime: input.mime,
      fileName: input.fileName,
      localFilePath,
      entityId: String(input.entityId ?? input.entityKey),
      entityKey: input.entityKey,
      createdAt: new Date().toISOString(),
      retries: 0,
      status: 'pending',
    };

    remaining.push(item);
    await writeQueue(remaining);
    return item;
  },

  async flush(): Promise<MediaSyncResult> {
    const queue = await readQueue();
    if (queue.length === 0) return { synced: 0, failed: 0 };

    const pending = [...queue];
    let synced = 0;
    let failed = 0;

    for (let i = 0; i < pending.length; i += 1) {
      const item = pending[i];

      if (item.status === 'failed') {
        continue;
      }

      try {
        const token = await Storage.getAccessToken();
        const form = new FormData();
        form.append(item.fieldName, {
          uri: item.localFilePath,
          name: item.fileName,
          type: item.mime,
        } as any);

        await axios.request({
          baseURL: API_BASE_URL,
          timeout: API_TIMEOUT,
          method: item.method,
          url: item.endpoint,
          data: form,
          headers: {
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            'Content-Type': 'multipart/form-data',
            'X-Upload-Id': item.uploadId,
          },
        });

        await removeLocalFileSafe(item.localFilePath);
        pending.splice(i, 1);
        i -= 1;
        synced += 1;
      } catch (error: any) {
        if (isNetworkError(error)) {
          break;
        }

        const status = error?.response?.status as number | undefined;
        if (status && status >= 400 && status < 500) {
          item.status = 'failed';
          item.errorMessage = error?.response?.data?.message || 'Upload invalide.';
          failed += 1;
          continue;
        }

        item.retries += 1;
        item.errorMessage = error?.response?.data?.message || error?.message || 'Erreur upload.';
        if (item.retries >= MAX_RETRIES) {
          item.status = 'failed';
          failed += 1;
        }
      }
    }

    await writeQueue(pending);
    return { synced, failed };
  },
};
