import React from 'react';
import { View, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { AppCard } from '../ui/AppCard';
import { AppAvatar } from '../ui/AppAvatar';
import { useTheme } from '../../store/ThemeContext';
import { RendezVous } from '../../types/models.types';
import { formatDate, formatTime, formatNom } from '../../utils/formatters';
import { StatutBadge } from './StatutBadge';

interface RdvCardProps {
  rdv: RendezVous;
  onPress?: () => void;
  index?: number;
}

const statutMap: Record<string, 'EN_ATTENTE' | 'CONFIRME' | 'REFUSE' | 'ANNULE' | 'ARCHIVE' | 'TERMINE'> = {
  en_attente: 'EN_ATTENTE',
  confirme: 'CONFIRME',
  refuse: 'REFUSE',
  annule: 'ANNULE',
  archive: 'ARCHIVE',
  termine: 'TERMINE',
};

export function RdvCard({ rdv, onPress, index = 0 }: RdvCardProps) {
  const { colors } = useTheme();
  const patient = rdv.patient?.utilisateur;
  const medecin = rdv.medecin?.utilisateur;
  const primaryPerson = patient || medecin;
  const secondaryLabel = patient && medecin
    ? `Dr ${formatNom(medecin.nom, medecin.prenom)}`
    : rdv.disponibilite?.service?.nom_service || 'Rendez-vous clinique';

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify()}>
      <AppCard onPress={onPress} style={{ marginBottom: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
          {primaryPerson && (
            <AppAvatar
              nom={primaryPerson.nom}
              prenom={primaryPerson.prenom}
              photoPath={primaryPerson.photo_path}
              size={42}
            />
          )}
          <View style={{ flex: 1, marginLeft: 12 }}>
            {primaryPerson && (
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text }}>
                {formatNom(primaryPerson.nom, primaryPerson.prenom)}
              </Text>
            )}
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 2 }}>
              {secondaryLabel}
            </Text>
          </View>
          <StatutBadge statut={statutMap[rdv.statut_rdv || 'en_attente'] || 'EN_ATTENTE'} size="sm" />
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="calendar-outline" size={15} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>
              {formatDate(rdv.date_heure_rdv)}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Ionicons name="time-outline" size={15} color={colors.textMuted} />
            <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>
              {formatTime(rdv.date_heure_rdv)}
            </Text>
          </View>
          {rdv.disponibilite?.service?.nom_service && (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="medkit-outline" size={15} color={colors.textMuted} />
              <Text style={{ fontSize: 13, color: colors.text, fontWeight: '500' }}>
                {rdv.disponibilite.service.nom_service}
              </Text>
            </View>
          )}
        </View>

        {rdv.motif && (
          <View style={{ marginTop: 10, backgroundColor: colors.surfaceAlt, borderRadius: 8, padding: 10 }}>
            <Text style={{ fontSize: 13, color: colors.textMuted, fontStyle: 'italic' }}>
              {rdv.motif}
            </Text>
          </View>
        )}
      </AppCard>
    </Animated.View>
  );
}
