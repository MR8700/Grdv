import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  ACCESS_TOKEN: '@clinique:accessToken',
  REFRESH_TOKEN: '@clinique:refreshToken',
  USER: '@clinique:user',
  THEME: '@clinique:theme',
  APP_SETTINGS: '@clinique:appSettings',
};

export const Storage = {
  setTokens: async (access: string, refresh?: string | null) => {
    const entries: Array<[string, string]> = [[KEYS.ACCESS_TOKEN, access]];

    if (typeof refresh === 'string' && refresh.length > 0) {
      entries.push([KEYS.REFRESH_TOKEN, refresh]);
    }

    await AsyncStorage.multiSet(entries);
  },
  getAccessToken: () => AsyncStorage.getItem(KEYS.ACCESS_TOKEN),
  getRefreshToken: () => AsyncStorage.getItem(KEYS.REFRESH_TOKEN),
  setUser: (user: object) => AsyncStorage.setItem(KEYS.USER, JSON.stringify(user)),
  getUser: async () => {
    const raw = await AsyncStorage.getItem(KEYS.USER);
    return raw ? JSON.parse(raw) : null;
  },
  setTheme: (theme: 'light' | 'dark') => AsyncStorage.setItem(KEYS.THEME, theme),
  getTheme: () => AsyncStorage.getItem(KEYS.THEME),
  setAppSettings: (settings: object) => AsyncStorage.setItem(KEYS.APP_SETTINGS, JSON.stringify(settings)),
  getAppSettings: async <T = unknown>() => {
    const raw = await AsyncStorage.getItem(KEYS.APP_SETTINGS);
    return raw ? (JSON.parse(raw) as T) : null;
  },
  clear: () => AsyncStorage.multiRemove(Object.values(KEYS)),
};

