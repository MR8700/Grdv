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
import { authenticateBiometric } from '../utils/biometrics';

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
  setBiometricLockEnabled: (value: boolean) => void;
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

export function AppSettingsProvider({ children }: { children: ReactNode }) {
  const { colors } = useTheme();
  const { user } = useAuth();

  const [settings, setSettings] = useState<AppSettingsState>(defaultSettings);
  const [hydrated, setHydrated] = useState(false);
  const [lockVisible, setLockVisible] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);

  const appStateRef = useRef<AppStateStatus>(AppState.currentState);
  const lastActivityRef = useRef(Date.now());
  const lastWarningRef = useRef<number | null>(null);

  const currentRole = useMemo<RoleKey>(
    () => normalizeRole(user?.type_user || user?.role?.nom_role),
    [user]
  );

  // 🔁 LOAD
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

  // 💾 SAVE
  useEffect(() => {
    if (hydrated) Storage.setAppSettings(settings);
  }, [settings, hydrated]);

  // 📌 ACTIVITY
  const registerActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    lastWarningRef.current = null;
  }, []);

  // 📱 APP STATE
  useEffect(() => {
    const sub = AppState.addEventListener('change', (nextState) => {
      const prev = appStateRef.current;
      appStateRef.current = nextState;

      if (nextState === 'active' && prev !== 'active') {
        registerActivity();
      }

      if (nextState === 'background' && settings.biometricLockEnabled) {
        setLockVisible(true);
      }
    });

    return () => sub.remove();
  }, [settings.biometricLockEnabled, registerActivity]);

  // ⏱ INACTIVITY CHECK
  useEffect(() => {
    if (!hydrated || !settings.biometricLockEnabled) return;

    const interval = setInterval(() => {
      if (appStateRef.current !== 'active' || lockVisible) return;

      const now = Date.now();
      const idle = now - lastActivityRef.current;
      const lockTime = settings.inactivityMinutes * 60000;
      const warnTime = lockTime - 60000;

      if (
        settings.warnBeforeLock &&
        idle >= warnTime &&
        idle < lockTime &&
        lastWarningRef.current !== lockTime
      ) {
        lastWarningRef.current = lockTime;
        Toast.warning('Verrouillage imminent', 'Moins d’une minute restante');
      }

      if (idle >= lockTime) {
        setLockVisible(true);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [settings, lockVisible, hydrated]);

  // 🔓 UNLOCK
  const unlockApp = useCallback(async () => {
    if (!settings.biometricLockEnabled) {
      setLockVisible(false);
      return;
    }

    setAuthLoading(true);

    const success = await authenticateBiometric();

    if (success) {
      registerActivity();
      setLockVisible(false);
      Toast.success('Déverrouillé', 'Accès autorisé');
    } else {
      Toast.error('Échec', 'Authentification refusée');
    }

    setAuthLoading(false);
  }, [settings.biometricLockEnabled, registerActivity]);

  const value = useMemo(
    () => ({
      ...settings,
      currentRole,
      lockVisible,
      setBiometricLockEnabled: (v: boolean) =>
        setSettings((p) => ({ ...p, biometricLockEnabled: v })),
      setInactivityMinutes: (m: number) =>
        setSettings((p) => ({ ...p, inactivityMinutes: m })),
      setWarnBeforeLock: (v: boolean) =>
        setSettings((p) => ({ ...p, warnBeforeLock: v })),
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
    [settings, currentRole, lockVisible, registerActivity, unlockApp]
  );

  const roleLabel = TYPE_USER_LABELS[currentRole] ?? currentRole;

  return (
    <AppSettingsContext.Provider value={value}>
      <View style={{ flex: 1 }} onTouchStart={registerActivity}>
        {children}
      </View>

      {/* 🔒 LOCK MODAL */}
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
              Application verrouillée
            </Text>

            <Text style={{ textAlign: 'center', color: colors.textMuted }}>
              Session {roleLabel.toLowerCase()} sécurisée
            </Text>

            <AppButton
              label={authLoading ? 'Vérification...' : 'Déverrouiller'}
              fullWidth
              onPress={unlockApp}
            />

            <Pressable onPress={unlockApp}>
              <Text style={{ textAlign: 'center', color: colors.primary, fontWeight: '700' }}>
                Réessayer
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