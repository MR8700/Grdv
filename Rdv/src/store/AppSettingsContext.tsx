import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppState, AppStateStatus, Modal, Pressable, Text, View } from 'react-native';
import { Storage } from '../utils/storage';
import { useTheme } from './ThemeContext';
import { useAuth } from './AuthContext';
import { Toast } from '../components/ui/AppAlert';
import { TYPE_USER_LABELS } from '../utils/constants';
import { AppButton } from '../components/ui/AppButton';
import { authenticateBiometric, getBiometricStatus } from '../utils/biometrics';

type RoleKey = 'patient' | 'medecin' | 'secretaire' | 'administrateur';

export const INACTIVITY_OPTIONS = [5, 10, 15, 30, 45, 60] as const;

interface RoleSettings {
  notifications: boolean;
  exportEnabled: boolean;
  syncOnWifiOnly: boolean;
}

interface AppSettingsState {
  biometricLockEnabled: boolean;
  inactivityMinutes: number;
  warnBeforeLock: boolean;
  rolePreferences: Record<RoleKey, RoleSettings>;
}

interface AppSettingsContextValue extends AppSettingsState {
  currentRole: RoleKey;
  lockVisible: boolean;
  biometricAvailable: boolean;
  biometricLabel: string;
  setBiometricLockEnabled: (value: boolean) => Promise<void>;
  setInactivityMinutes: (minutes: number) => void;
  setWarnBeforeLock: (value: boolean) => void;
  updateRolePreferences: (role: RoleKey, patch: Partial<RoleSettings>) => void;
  registerActivity: () => void;
  unlockApp: () => Promise<void>;
}

const defaultRoleSettings: RoleSettings = {
  notifications: true,
  exportEnabled: true,
  syncOnWifiOnly: false,
};

const defaultSettings: AppSettingsState = {
  biometricLockEnabled: false,
  inactivityMinutes: 10,
  warnBeforeLock: true,
  rolePreferences: {
    patient: { ...defaultRoleSettings, exportEnabled: false },
    medecin: { ...defaultRoleSettings },
    secretaire: { ...defaultRoleSettings },
    administrateur: { ...defaultRoleSettings },
  },
};

const AppSettingsContext = createContext<AppSettingsContextValue | undefined>(undefined);

function normalizeRole(input?: string | null): RoleKey {
  const value = String(input || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  if (value.includes('medecin')) return 'medecin';
  if (value.includes('secretaire')) return 'secretaire';
  if (value.includes('admin')) return 'administrateur';
  return 'patient';
}

function formatBiometricLabel(type: string | null) {
  const value = String(type || '').toLowerCase();
  if (value.includes('face')) return 'Face ID';
  if (value.includes('touch')) return 'Touch ID';
  if (value.includes('finger')) return 'Empreinte';
  return 'Biometrie';
}

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { user, isLoggedIn } = useAuth();

  const [settings, setSettings] = useState<AppSettingsState>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const [lockVisible, setLockVisible] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biometrie');

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActivityRef = useRef(Date.now());
  const lastWarningRef = useRef<number | null>(null);
  const relockOnActiveRef = useRef(false);
  const unlockInFlightRef = useRef(false);
  const autoPromptedRef = useRef(false);

  const currentRole = useMemo<RoleKey>(() => normalizeRole(user?.type_user || user?.role?.nom_role), [user]);

  useEffect(() => {
    (async () => {
      const saved = await Storage.getAppSettings<Partial<AppSettingsState>>();
      setSettings((prev) => ({
        ...prev,
        ...saved,
        rolePreferences: {
          ...prev.rolePreferences,
          ...(saved?.rolePreferences || {}),
        },
      }));
      setHydrated(true);
    })();
  }, []);

  useEffect(() => {
    if (hydrated) Storage.setAppSettings(settings);
  }, [settings, hydrated]);

  useEffect(() => {
    let mounted = true;

    const refreshBiometricStatus = async () => {
      const status = await getBiometricStatus();
      if (!mounted) return;
      setBiometricAvailable(status.available);
      setBiometricLabel(formatBiometricLabel(status.biometryType));

      if (!status.available && settings.biometricLockEnabled) {
        setSettings((prev) => ({ ...prev, biometricLockEnabled: false }));
      }
    };

    refreshBiometricStatus();
    return () => {
      mounted = false;
    };
  }, [settings.biometricLockEnabled]);

  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastWarningRef.current = null;
  }, []);

  const showLock = useCallback(() => {
    autoPromptedRef.current = false;
    setLockVisible(true);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prev !== 'active') {
        if (relockOnActiveRef.current && settings.biometricLockEnabled && isLoggedIn) {
          showLock();
          return;
        }
        registerActivity();
      }

      if ((nextState === 'inactive' || nextState === 'background') && settings.biometricLockEnabled && isLoggedIn) {
        relockOnActiveRef.current = true;
        showLock();
      }
    });

    return () => sub.remove();
  }, [isLoggedIn, registerActivity, settings.biometricLockEnabled, showLock]);

  useEffect(() => {
    if (!hydrated || !settings.biometricLockEnabled || !isLoggedIn) return;

    const interval = setInterval(() => {
      if (appStateRef.current !== 'active' || lockVisible) return;

      const now = Date.now();
      const idle = now - lastActivityRef.current;
      const lockTime = settings.inactivityMinutes * 60000;
      const warnTime = Math.max(lockTime - 60000, 0);

      if (settings.warnBeforeLock && idle >= warnTime && idle < lockTime && lastWarningRef.current !== lockTime) {
        lastWarningRef.current = lockTime;
        Toast.warning('Verrouillage imminent', 'Moins d une minute restante avant le verrouillage.');
      }

      if (idle >= lockTime) {
        relockOnActiveRef.current = true;
        showLock();
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [hydrated, isLoggedIn, lockVisible, settings.biometricLockEnabled, settings.inactivityMinutes, settings.warnBeforeLock, showLock]);

  const unlockApp = useCallback(async () => {
    if (!settings.biometricLockEnabled) {
      relockOnActiveRef.current = false;
      setLockVisible(false);
      registerActivity();
      return;
    }

    if (unlockInFlightRef.current) return;

    unlockInFlightRef.current = true;
    setAuthLoading(true);

    const result = await authenticateBiometric(`Deverrouiller la session ${currentRole}`);

    if (result.success) {
      relockOnActiveRef.current = false;
      registerActivity();
      setLockVisible(false);
      Toast.success('Deverrouille', 'Acces autorise.');
    } else {
      Toast.error('Echec', result.error || 'Authentification refusee.');
    }

    setAuthLoading(false);
    unlockInFlightRef.current = false;
  }, [currentRole, registerActivity, settings.biometricLockEnabled]);

  useEffect(() => {
    if (!lockVisible || authLoading || autoPromptedRef.current) return;
    if (!settings.biometricLockEnabled || !biometricAvailable) return;
    if (appStateRef.current !== 'active') return;

    autoPromptedRef.current = true;
    unlockApp();
  }, [authLoading, biometricAvailable, lockVisible, settings.biometricLockEnabled, unlockApp]);

  const setBiometricLockEnabled = useCallback(
    async (value: boolean) => {
      if (!value) {
        setSettings((prev) => ({ ...prev, biometricLockEnabled: false }));
        setLockVisible(false);
        relockOnActiveRef.current = false;
        Toast.info('Biometrie', 'Verrouillage biometrique desactive.', 1500);
        return;
      }

      const status = await getBiometricStatus();
      setBiometricAvailable(status.available);
      setBiometricLabel(formatBiometricLabel(status.biometryType));

      if (!status.available) {
        Toast.error('Biometrie indisponible', status.reason || 'Aucun capteur compatible n est disponible.');
        return;
      }

      setAuthLoading(true);
      const result = await authenticateBiometric('Confirmer l activation du verrouillage biometrique');
      setAuthLoading(false);

      if (!result.success) {
        Toast.error('Activation annulee', result.error || 'Validation biometrique impossible.');
        return;
      }

      setSettings((prev) => ({ ...prev, biometricLockEnabled: true }));
      registerActivity();
      Toast.success('Biometrie activee', `${formatBiometricLabel(status.biometryType)} sera demandee au verrouillage.`);
    },
    [registerActivity]
  );

  const value = useMemo(
    () => ({
      ...settings,
      currentRole,
      lockVisible,
      biometricAvailable,
      biometricLabel,
      setBiometricLockEnabled,
      setInactivityMinutes: (m: number) => setSettings((p) => ({ ...p, inactivityMinutes: m })),
      setWarnBeforeLock: (v: boolean) => setSettings((p) => ({ ...p, warnBeforeLock: v })),
      updateRolePreferences: (role: RoleKey, patch: Partial<RoleSettings>) =>
        setSettings((p) => ({
          ...p,
          rolePreferences: {
            ...p.rolePreferences,
            [role]: { ...p.rolePreferences[role], ...patch },
          },
        })),
      registerActivity,
      unlockApp,
    }),
    [settings, currentRole, lockVisible, biometricAvailable, biometricLabel, setBiometricLockEnabled, registerActivity, unlockApp]
  );

  const roleLabel = TYPE_USER_LABELS[currentRole] ?? currentRole;

  return (
    <AppSettingsContext.Provider value={value}>
      <View style={{ flex: 1 }} onTouchStart={registerActivity}>
        {children}
      </View>

      <Modal visible={lockVisible} transparent animationType="fade">
        <View
          style={{
            flex: 1,
            backgroundColor: 'rgba(0,0,0,0.75)',
            justifyContent: 'center',
            alignItems: 'center',
            padding: 20,
          }}
        >
          <View
            style={{
              width: '100%',
              maxWidth: 400,
              backgroundColor: colors.surface,
              borderRadius: 20,
              padding: 20,
              gap: 15,
            }}
          >
            <Text style={{ fontSize: 18, fontWeight: '800', textAlign: 'center', color: colors.text }}>
              Application verrouillee
            </Text>

            <Text style={{ textAlign: 'center', color: colors.textMuted }}>
              Session {roleLabel.toLowerCase()} securisee
            </Text>

            <Text style={{ textAlign: 'center', color: colors.textMuted }}>
              Verification requise via {biometricLabel}.
            </Text>

            <AppButton
              label={authLoading ? 'Verification...' : 'Deverrouiller'}
              fullWidth
              onPress={unlockApp}
              loading={authLoading}
            />

            <Pressable onPress={unlockApp} disabled={authLoading}>
              <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '700', opacity: authLoading ? 0.6 : 1 }}>
                Reessayer
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AppSettingsContext.Provider>
  );
}

export const useAppSettings = () => {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) throw new Error('useAppSettings must be used within provider');
  return ctx;
};
