import React from 'react';
import { Text, View } from 'react-native';
import { ScreenWrapper } from '../../components/layout/ScreenWrapper';
import { AppHeader } from '../../components/ui/AppHeader';
import { useTheme } from '../../store/ThemeContext';
import { PdfExportButton } from '../../components/ui/PdfExportButton';
import { AppCard } from '../../components/ui/AppCard';
import { AppButton } from '../../components/ui/AppButton';

export function MonDossierScreen({ navigation }: { navigation?: any }) {
  const { colors } = useTheme();
  const reportRows = [
    { rubrique: 'Identite', statut: 'Disponible dans le profil utilisateur' },
    { rubrique: 'Rendez-vous', statut: 'Consultables dans Mes RDV' },
    { rubrique: 'Synchronisation', statut: 'Suivi hors ligne disponible' },
  ];

  return (
    <ScreenWrapper scroll>
      <AppHeader
        title="Mon dossier"
        subtitle="Vue simplifiée du suivi patient"
        onBack={navigation?.canGoBack() ? () => navigation.goBack() : undefined}
        rightActions={
          <PdfExportButton
            title="Export dossier patient"
            rows={reportRows}
            columns={[
              { key: 'rubrique', label: 'Rubrique', value: (r) => r.rubrique },
              { key: 'statut', label: 'Statut', value: (r) => r.statut },
            ]}
          />
        }
      />

      <View style={{ paddingTop: 8, gap: 16 }}>
        <AppCard title="Etat du dossier" subtitle="Base de travail prête a être enrichie">
          <Text style={{ color: colors.textMuted, lineHeight: 20 }}>
            Cet écran sert de point d\'entrée pour le suivi patient. Il rassemble les rubriques utiles déjà
            disponibles dans l\'application et facilite l\'export d\'un resumé.
          </Text>
        </AppCard>

        {reportRows.map((item) => (
          <AppCard key={item.rubrique}>
            <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 6 }}>{item.rubrique}</Text>
            <Text style={{ color: colors.textMuted }}>{item.statut}</Text>
          </AppCard>
        ))}

        <AppCard title="Actions rapides">
          <View style={{ gap: 12 }}>
            <AppButton label="Mes rendez-vous" onPress={() => navigation?.navigate?.('MesRdv')} />
            <AppButton label="Mon profil" variant="outline" onPress={() => navigation?.navigate?.('Profil')} />
          </View>
        </AppCard>
      </View>
    </ScreenWrapper>
  );
}
