import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { Storage } from '../utils/storage';
import { COLORS } from '../utils/constants';

export type Theme = 'light' | 'dark';

export const LIGHT_COLORS = {
  background: '#F4F7FB',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF3F8',
  border: '#D6E0EA',
  text: '#102433',
  textMuted: '#5F7387',
  textLight: '#8A9CAE',
  primary: COLORS.primary,
  secondary: COLORS.secondary,
  accent: COLORS.accent,
  success: COLORS.success,
  warning: COLORS.warning,
  danger: COLORS.danger,
  info: COLORS.info,
  shadow: 'rgba(16,36,51,0.12)',
  overlay: 'rgba(0,0,0,0.5)',
  headerBg: '#EAF2F8',
  headerCard: '#FFFFFF',
  headerText: '#102433',
  headerMuted: '#5F7387',
  tabBg: '#FFFFFF',
  tabActive: COLORS.primary,
  tabInactive: '#8396AA',
};

export const DARK_COLORS: typeof LIGHT_COLORS = {
  background: '#0F1C26',
  surface: '#172936',
  surfaceAlt: '#213847',
  border: '#2D4657',
  text: '#F3F7FB',
  textMuted: '#A6B6C5',
  textLight: '#71879A',
  primary: '#59A8C6',
  secondary: '#3F7C91',
  accent: '#E1A545',
  success: '#46B985',
  warning: '#E4B44C',
  danger: '#E37B7B',
  info: '#6DA8D6',
  shadow: 'rgba(0,0,0,0.36)',
  overlay: 'rgba(0,0,0,0.7)',
  headerBg: '#13222D',
  headerCard: '#1A2F3C',
  headerText: '#F3F7FB',
  headerMuted: '#A6B6C5',
  tabBg: '#172936',
  tabActive: '#7BC0D8',
  tabInactive: '#71879A',
};

interface ThemeContextValue {
  theme: Theme;
  isDark: boolean;
  colors: typeof LIGHT_COLORS;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const defaultTheme: Theme = systemScheme === 'dark' ? 'dark' : 'light';
  const [theme, setTheme] = useState<Theme>(defaultTheme);

  useEffect(() => {
    (async () => {
      const saved = await Storage.getTheme();
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
      }
    })();
  }, []);

  const toggleTheme = useCallback(() => {
    const nextTheme: Theme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    Storage.setTheme(nextTheme);
  }, [theme]);

  const colors = useMemo(() => (theme === 'dark' ? DARK_COLORS : LIGHT_COLORS), [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark: theme === 'dark', colors, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
