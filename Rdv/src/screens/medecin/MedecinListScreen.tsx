import React from 'react';
import { View } from 'react-native';
import { MedecinList } from '../../components/medecin/MedecinList';
import { Medecin } from '../../types/models.types';

export const MedecinListScreen: React.FC<{ navigation?: any }> = ({ navigation }) => {
  const handleBookAppointment = (medecin: Medecin) => {
    navigation?.navigate?.('PriseRdv', { medecinId: medecin.id_user });
  };

  return (
    <View style={{ flex: 1 }}>
      <MedecinList showBookAppointment onBookAppointment={handleBookAppointment} />
    </View>
  );
};

 