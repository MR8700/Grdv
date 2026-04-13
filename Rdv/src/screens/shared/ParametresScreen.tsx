import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { useTheme } from '../../store/ThemeContext';
import { AppButton } from '../../components/ui/AppButton';
import { PdfExportButton } from '../../components/ui/PdfExportButton';

interface SettingItem {
  label: string;
  icon: string;
  onPress: () => void;
}

interface SettingsSectionType {
  title: string;
  items: SettingItem[];
}

export function ParametresScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();

  const SETTINGS_SECTIONS: SettingsSectionType[] = [
    {
      title: 'Compte',
      items: [
        { label: 'Modifier profil', icon: 'USR', onPress: () => console.log('Modifier profil') },
        { label: 'Changer mot de passe', icon: 'PWD', onPress: () => console.log('Changer mot de passe') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { label: 'Theme', icon: 'THM', onPress: () => console.log('Changer thème') },
        { label: 'Notifications', icon: 'NTF', onPress: () => console.log('Notifications') },
      ],
    },
    {

      title: 'Systeme',
      items: [
        { label: 'API backend', icon: 'API', onPress: () => console.log('API backend') },
        { label: 'A propos', icon: 'INF', onPress: () => console.log('A propos') },
      ],
    },
  ];

  const exportRows = SETTINGS_SECTIONS.flatMap((section) =>
    section.items.map((item) => ({
      section: section.title,
      label: item.label,
      icon: item.icon,
    }))
  );

  const SettingsSection = ({ section }: { section: SettingsSectionType }) => (
    <View
      style={{
        marginBottom: 20,
        backgroundColor: colors.surface,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.text, marginBottom: 8 }}>
        {section.title}
      </Text>
      {section.items.map((item) => (
        <TouchableOpacity
          key={item.label}
          onPress={item.onPress}
          activeOpacity={0.7}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 12,
            paddingHorizontal: 8,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
          }}
        >
          <Text style={{ fontSize: 14, width: 36, marginRight: 12, color: colors.primary, fontWeight: '700' }}>
            {item.icon}
          </Text>
          <Text style={{ fontSize: 14, color: colors.text, fontWeight: '600' }}>{item.label}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <ScreenWrapper scroll contentStyle={{ paddingBottom: 40 }}>
      <AppHeader
        title="Parametres"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export paramètres"
            rows={exportRows}
            columns={[
              { key: 'section', label: 'Section', value: (r) => r.section },
              { key: 'label', label: 'Option', value: (r) => r.label },
              { key: 'icon', label: 'Code', value: (r) => r.icon },
            ]}
          />
        }
      />

      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <Text style={{ fontSize: 40, marginBottom: 12, color: colors.primary, fontWeight: '800' }}>
          CFG
        </Text>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>Paramètres</Text>
        <Text style={{ color: colors.textMuted, fontSize: 14, marginTop: 4, textAlign: 'center' }}>
          Configuration du compte et de l\'application
        </Text>
      </View>

      {SETTINGS_SECTIONS.map((section) => (
        <SettingsSection key={section.title} section={section} />
      ))}

      <View style={{ marginTop: 20 }}>
        <AppButton
          label="Deconnexion"
          variant="danger"
          fullWidth
          onPress={() => console.log('Déconnexion')}
        />
      </View>
    </ScreenWrapper>
  );
}
