import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, TouchableOpacity, View } from 'react-native';
import { medecinsApi } from '../../api/medecins.api';
import { Medecin } from '../../types/models.types';
import { AppButton } from '../ui/AppButton';
import { AppInput } from '../ui/AppInput';

interface MedecinListProps {
  onSelectMedecin?: (medecin: Medecin) => void;
  showBookAppointment?: boolean;
  onBookAppointment?: (medecin: Medecin) => void;
}
 
export const MedecinList: React.FC<MedecinListProps> = ({
  onSelectMedecin,
  showBookAppointment = false,
  onBookAppointment,
}) => {
  const [medecins, setMedecins] = useState<Medecin[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await medecinsApi.getAll({ limit: 100 });
        const payload = response.data?.data ?? [];
        setMedecins(Array.isArray(payload) ? payload : []);
      } catch (err: any) {
        setError(err?.response?.data?.message ?? 'Impossible de charger les medecins.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return medecins;

    return medecins.filter((item) => {
      const fullName = `${item.utilisateur?.prenom ?? ''} ${item.utilisateur?.nom ?? ''}`.toLowerCase();
      const specialty = (item.specialite_principale ?? '').toLowerCase();
      return fullName.includes(query) || specialty.includes(query);
    });
  }, [medecins, search]);

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#1D6FA4" />
        <Text style={{ marginTop: 10 }}>Chargement des medecins...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F8FAFC' }}>
      <AppInput label="Recherche medecin" placeholder="Nom ou specialite" value={search} onChangeText={setSearch} containerStyle={{ margin: 12 }} />

      {error ? <Text style={{ color: '#B91C1C', marginHorizontal: 12, marginBottom: 8 }}>{error}</Text> : null}

      <FlatList
        data={filtered}
        keyExtractor={(item) => String(item.id_user)}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => onSelectMedecin?.(item)}
            activeOpacity={0.85}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 12,
              padding: 14,
              marginBottom: 10,
              borderWidth: 1,
              borderColor: '#E2E8F0',
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: '700', color: '#0F172A' }}>
              Dr. {item.utilisateur?.prenom} {item.utilisateur?.nom}
            </Text>
            <Text style={{ color: '#475569', marginTop: 4 }}>
              {item.specialite_principale || 'Medecin generaliste'}
            </Text>
            {item.utilisateur?.email ? <Text style={{ color: '#64748B', marginTop: 2 }}>{item.utilisateur.email}</Text> : null}

            {showBookAppointment && onBookAppointment ? (
              <AppButton
                label="Prendre RDV"
                onPress={() => onBookAppointment(item)}
                size="sm"
                style={{ marginTop: 10, alignSelf: 'flex-start' }}
              />
            ) : null}
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={{ textAlign: 'center', color: '#64748B', marginTop: 40 }}>Aucun medecin trouve.</Text>}
      />
    </View>
  );
};

