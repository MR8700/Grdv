import React from 'react';
import { Text, View } from 'react-native';
import { Disponibilite, RendezVous } from '../../types/models.types';
import { formatDate } from '../../utils/formatters';
import { AppCard } from '../ui/AppCard';
import { DispoSlot } from './DispoSlot';
import { RdvCard } from './RdvCard';
import { useTheme } from '../../store/ThemeContext';

interface AgendaDayProps {
  title: string;
  date: string;
  disponibilites: Disponibilite[];
  rendezVous: RendezVous[];
  selectedDispoId?: number;
  onSelectDispo?: (disponibilite: Disponibilite) => void;
  onPressRdv?: (rendezVous: RendezVous) => void;
}
 
export function AgendaDay({
  title,
  date,
  disponibilites,
  rendezVous,
  selectedDispoId,
  onSelectDispo,
  onPressRdv,
}: AgendaDayProps) {
  const { colors } = useTheme();

  return (
    <AppCard title={title} subtitle={formatDate(date)} style={{ marginBottom: 16 }}>
      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 10 }}>Creneaux disponibles</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 12 }}>
        {disponibilites.map((disponibilite) => (
          <DispoSlot
            key={disponibilite.id_dispo}
            dispo={disponibilite}
            selected={disponibilite.id_dispo === selectedDispoId}
            onSelect={(value) => onSelectDispo?.(value)}
          />
        ))}
      </View>

      <Text style={{ color: colors.text, fontWeight: '600', marginBottom: 10 }}>Rendez-vous du jour</Text>
      {rendezVous.map((rdv, index) => (
        <RdvCard key={rdv.id_rdv} rdv={rdv} index={index} onPress={() => onPressRdv?.(rdv)} />
      ))}
    </AppCard>
  );
}
