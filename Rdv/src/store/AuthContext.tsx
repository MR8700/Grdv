import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  ReactNode,
} from 'react';
import { authApi, RegisterPayload } from '../api/auth.api';
import { isBackendUnavailableError } from '../api/errors';
import { Utilisateur } from '../types/models.types';
import { Storage } from '../utils/storage';
import { utilisateursApi } from '../api/utilisateurs.api';

interface AuthSession {
  user: Utilisateur;
  accessToken: string;
  refreshToken: string;
}

interface AuthState {
  user: Utilisateur | null;
  accessToken: string | null;
  refreshToken: string | null;
  actorSession: AuthSession | null;
  loading: boolean;
  isLoggedIn: boolean;
  isRefreshing: boolean;
}

interface AuthContextValue extends AuthState {
  permissions: string[];
  isImpersonating: boolean;
  login: (loginInput: string, password: string) => Promise<void>;
  register: (payload: RegisterPayload & {
    photo?: { uri: string; type: string; name: string };
  }) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<Utilisateur>) => void;
  refreshTokens: () => Promise<boolean>;
  reloadMe: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  startImpersonation: (targetSession: AuthSession) => Promise<void>;
  stopImpersonation: () => Promise<void>;
}

type AuthAction =
  | { type: 'LOGIN'; payload: AuthSession }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_REFRESHING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: Partial<Utilisateur> }
  | { type: 'SET_TOKENS'; payload: { accessToken: string; refreshToken: string } }
  | { type: 'START_IMPERSONATION'; payload: { actorSession: AuthSession; targetSession: AuthSession } }
  | { type: 'STOP_IMPERSONATION' };

const initialState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  actorSession: null,
  loading: true,
  isLoggedIn: false,
  isRefreshing: false,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN':
      return {
        ...state,
        ...action.payload,
        isLoggedIn: true,
        isRefreshing: false,
        loading: false,
      };
    case 'LOGOUT':
      return { ...initialState, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_REFRESHING':
      return { ...state, isRefreshing: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: state.user ? { ...state.user, ...action.payload } : null };
    case 'SET_TOKENS':
      return { ...state, ...action.payload, isRefreshing: false };
    case 'START_IMPERSONATION':
      return {
        ...state,
        actorSession: action.payload.actorSession,
        ...action.payload.targetSession,
      };
    case 'STOP_IMPERSONATION':
      if (!state.actorSession) return state;
      return {
        ...state,
        ...state.actorSession,
        actorSession: null,
        isLoggedIn: true,
        isRefreshing: false,
        loading: false,
      };
    default:
      return state;
  }
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function normalizeSessionUser(user: AuthSession['user']): Utilisateur {
  return {
    ...user,
    date_creation: user.date_creation ?? new Date().toISOString(),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null);

  const permissions = useMemo(
    () => state.user?.effective_permissions || state.user?.role?.permissions?.map((p) => p.nom_permission) || [],
    [state.user]
  );

  const persistSession = useCallback(async (session: AuthSession) => {
    await Storage.setTokens(session.accessToken, session.refreshToken);
    await Storage.setUser(session.user);
  }, []);

  const reloadMe = useCallback(async () => {
    try {
      const response = await authApi.me();
      const currentUser = response.data.data as Utilisateur;
      dispatch({ type: 'UPDATE_USER', payload: currentUser });
      await Storage.setUser(currentUser);
    } catch {
      // Ignore hydration failure and keep the current local session.
    }
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const [accessToken, refreshToken, user] = await Promise.all([
          Storage.getAccessToken(),
          Storage.getRefreshToken(),
          Storage.getUser(),
        ]);
        if (accessToken && refreshToken && user) {
          dispatch({ type: 'LOGIN', payload: { user, accessToken, refreshToken } });
          await reloadMe();
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    })();
  }, [reloadMe]);

  const logout = useCallback(async () => {
    try { await authApi.logout(); } catch {}
    await Storage.clear();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const refreshTokens = useCallback(async (): Promise<boolean> => {
    const token = state.refreshToken;
    if (!token) return false;

    if (refreshPromiseRef.current) return refreshPromiseRef.current;

    const promise = (async () => {
      dispatch({ type: 'SET_REFRESHING', payload: true });
      try {
        const res = await authApi.refresh(token);
        const { accessToken, refreshToken } = res.data.data;
        await Storage.setTokens(accessToken, refreshToken ?? token);
        dispatch({ type: 'SET_TOKENS', payload: { accessToken, refreshToken: refreshToken ?? token } });
        await reloadMe();
        return true;
      } catch (err) {
        if (!isBackendUnavailableError(err)) await logout();
        return false;
      } finally {
        dispatch({ type: 'SET_REFRESHING', payload: false });
        refreshPromiseRef.current = null;
      }
    })();

    refreshPromiseRef.current = promise;
    return promise;
  }, [logout, reloadMe, state.refreshToken]);

  const login = useCallback(async (loginInput: string, password: string) => {
    const res = await authApi.login(loginInput, password);
    const session: AuthSession = {
      ...res.data.data,
      user: normalizeSessionUser(res.data.data.user as Utilisateur),
    };
    await persistSession(session);
    dispatch({ type: 'LOGIN', payload: session });
    await reloadMe();
  }, [persistSession, reloadMe]);

  const register = useCallback(async (payload: RegisterPayload & {
    photo?: { uri: string; type: string; name: string };
  }) => {
    const { photo, ...registerPayload } = payload;
    const res = await authApi.register(registerPayload);
    const session: AuthSession = {
      ...res.data.data,
      user: normalizeSessionUser(res.data.data.user as Utilisateur),
    };
    await persistSession(session);
    dispatch({ type: 'LOGIN', payload: session });
    if (photo?.uri) {
      const formData = new FormData();
      formData.append('photo', {
        uri: photo.uri,
        type: photo.type,
        name: photo.name,
      } as never);
      await utilisateursApi.updatePhoto(session.user.id_user, formData);
    }
    await reloadMe();
  }, [persistSession, reloadMe]);

  const updateUser = useCallback((data: Partial<Utilisateur>) => {
    dispatch({ type: 'UPDATE_USER', payload: data });
  }, []);

  const hasPermission = useCallback((permission: string) => permissions.includes(permission), [permissions]);

  const startImpersonation = useCallback(async (targetSession: AuthSession) => {
    if (!state.user || !state.accessToken || !state.refreshToken) return;
    const actorSession: AuthSession = { user: state.user, accessToken: state.accessToken, refreshToken: state.refreshToken };
    await persistSession(targetSession);
    dispatch({ type: 'START_IMPERSONATION', payload: { actorSession, targetSession } });
    await reloadMe();
  }, [persistSession, reloadMe, state.user, state.accessToken, state.refreshToken]);

  const stopImpersonation = useCallback(async () => {
    if (!state.actorSession) return;
    await persistSession(state.actorSession);
    dispatch({ type: 'STOP_IMPERSONATION' });
    await reloadMe();
  }, [persistSession, reloadMe, state.actorSession]);

  const value = useMemo(() => ({
    ...state,
    permissions,
    isImpersonating: Boolean(state.actorSession),
    login,
    register,
    logout,
    updateUser,
    refreshTokens,
    reloadMe,
    hasPermission,
    startImpersonation,
    stopImpersonation,
  }), [
    state,
    permissions,
    login,
    register,
    logout,
    updateUser,
    refreshTokens,
    reloadMe,
    hasPermission,
    startImpersonation,
    stopImpersonation,
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
