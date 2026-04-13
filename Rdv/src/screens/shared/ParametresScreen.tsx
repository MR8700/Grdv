import React, { useMemo } from 'react';
import { Pressable, Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { useTheme } from '../../store/ThemeContext';
import { AppButton } from '../../components/ui/AppButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppSwitch } from '../../components/ui/AppSwitch';
import { useAuth } from '../../store/AuthContext';
import { INACTIVITY_OPTIONS, useAppSettings } from '../../store/AppSettingsContext';
import { TYPE_USER_LABELS } from '../../utils/constants';

type RoleKey = 'patient' | 'medecin' | 'secretaire' | 'administrateur';

interface RoleAction {
  label: string;
  hint: string;
}

const ROLE_ACTIONS: Record<RoleKey, RoleAction[]> = {
  patient: [
    { label: 'Confidentialité du dossier', hint: 'Accès strict à vos données médicales.' },
    { label: 'Notifications', hint: 'Rappels de rendez-vous et alertes importantes.' },
    { label: 'Partage des documents', hint: 'Contrôle de l’export et du partage.' },
  ],
  medecin: [
    { label: 'Sécurité consultation', hint: 'Verrouillage rapide entre patients.' },
    { label: 'Alertes médicales', hint: 'Priorisation des urgences et suivis.' },
    { label: 'Exports médicaux', hint: 'Accès contrôlé aux dossiers patients.' },
  ],
  secretaire: [
    { label: 'Gestion agenda', hint: 'Organisation des rendez-vous et flux patients.' },
    { label: 'File d’attente', hint: 'Suivi en temps réel des arrivées.' },
    { label: 'Exports admin', hint: 'Documents de gestion et coordination.' },
  ],
  administrateur: [
    { label: 'Sécurité globale', hint: 'Protection renforcée des systèmes.' },
    { label: 'Audit système', hint: 'Logs et supervision complète.' },
    { label: 'Paramètres globaux', hint: 'Configuration de toute la plateforme.' },
  ],
};

export function ParametresScreen({ navigation }: { navigation?: any }) {
  const { colors, isDark, toggleTheme } = useTheme();
  const { logout } = useAuth();

  const {
    currentRole,
    biometricLockEnabled,
    inactivityMinutes,
    warnBeforeLock,
    rolePreferences,
    setBiometricLockEnabled,
    setInactivityMinutes,
    setWarnBeforeLock,
    updateRolePreferences,
  } = useAppSettings();

  const roleLabel = TYPE_USER_LABELS[currentRole] ?? currentRole;
  const roleSettings = rolePreferences[currentRole];

  const roleActions = useMemo(
    () => ROLE_ACTIONS[currentRole],
    [currentRole]
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <Text style={{
      fontSize: 15,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 10,
      marginTop: 6,
    }}>
      {title}
    </Text>
  );

  const SettingItem = ({
    label,
    hint,
    onPress,
  }: {
    label: string;
    hint: string;
    onPress?: () => void;
  }) => (
    <Pressable
      onPress={onPress}
      style={{
        padding: 14,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
        marginBottom: 10,
      }}
    >
      <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>
        {label}
      </Text>
      <Text style={{ color: colors.textMuted, fontSize: 12, marginTop: 4 }}>
        {hint}
      </Text>
    </Pressable>
  );

  const Chip = ({ value }: { value: number }) => {
    const active = inactivityMinutes === value;

    return (
      <Pressable
        onPress={() => setInactivityMinutes(value)}
        style={{
          paddingVertical: 8,
          paddingHorizontal: 12,
          borderRadius: 20,
          borderWidth: 1,
          borderColor: active ? colors.primary : colors.border,
          backgroundColor: active ? `${colors.primary}20` : colors.surface,
          marginRight: 8,
          marginBottom: 8,
        }}
      >
        <Text style={{
          color: active ? colors.primary : colors.text,
          fontWeight: '700',
          fontSize: 12,
        }}>
          {value} min
        </Text>
      </Pressable>
    );
  };

  return (
    <ScreenWrapper scroll contentStyle={{ paddingBottom: 40 }}>
      <AppHeader
        title="Paramètres"
        subtitle={`Profil ${roleLabel.toLowerCase()}`}
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
      />

      {/* HEADER VISUEL */}
      <View style={{ alignItems: 'center', marginVertical: 10 }}>
        <Text style={{ fontSize: 40, fontWeight: '900', color: colors.primary }}>
          CFG
        </Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: colors.text }}>
          Centre de configuration
        </Text>
        <Text style={{
          fontSize: 13,
          color: colors.textMuted,
          textAlign: 'center',
          marginTop: 6,
          paddingHorizontal: 20,
        }}>
          Sécurité, interface et préférences adaptées à votre rôle.
        </Text>
      </View>

      {/* COMPTE */}
      <AppCard title="Compte">
        <SettingItem label="Modifier profil" hint="Mettre à jour vos informations." />
        <SettingItem label="Changer mot de passe" hint="Sécuriser votre accès." />
      </AppCard>

      {/* SECURITE */}
      <AppCard title="Sécurité">
        <AppSwitch
          label="Verrouillage biométrique"
          value={biometricLockEnabled}
          onToggle={setBiometricLockEnabled}
        />

        <SectionTitle title="Temps d'inactivité" />

        <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
          {INACTIVITY_OPTIONS.map((v) => (
            <Chip key={v} value={v} />
          ))}
        </View>

        <View style={{ marginTop: 10 }}>
          <AppSwitch
            label="Alerte avant verrouillage"
            value={warnBeforeLock}
            onToggle={setWarnBeforeLock}
          />
        </View>
      </AppCard>

      {/* AFFICHAGE */}
      <AppCard title="Affichage">
        <AppSwitch
          label="Mode sombre"
          value={isDark}
          onToggle={toggleTheme}
        />

        <AppSwitch
          label="Notifications navigation"
          value={roleSettings.notifications}
          onToggle={(v) => updateRolePreferences(currentRole, { notifications: v })}
        />
      </AppCard>

      {/* ROLE */}
      <AppCard title={`Préférences ${roleLabel}`}>
        {roleActions.map((a) => (
          <SettingItem key={a.label} label={a.label} hint={a.hint} />
        ))}

        <AppSwitch
          label="Autoriser export"
          value={roleSettings.exportEnabled}
          onToggle={(v) => updateRolePreferences(currentRole, { exportEnabled: v })}
        />

        <AppSwitch
          label="Sync WiFi uniquement"
          value={roleSettings.syncOnWifiOnly}
          onToggle={(v) => updateRolePreferences(currentRole, { syncOnWifiOnly: v })}
        />
      </AppCard>

      {/* SYSTEME */}
      <AppCard title="Système">
        <SettingItem label="API backend" hint="Vérifier connexion serveur." />
        <SettingItem label="À propos" hint="Infos application et version." />
      </AppCard>

      {/* LOGOUT */}
      <View style={{ marginTop: 10 }}>
        <AppButton
          label="Déconnexion"
          variant="danger"
          fullWidth
          onPress={logout}
        />
      </View>
    </ScreenWrapper>
  );
}