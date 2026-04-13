import React from 'react';
import { TouchableOpacity, Text, View } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Disponibilite } from '../../types/models.types';
import { formatTime } from '../../utils/formatters';
import { useTheme } from '../../store/ThemeContext';

const AnimTouch = Animated.createAnimatedComponent(TouchableOpacity);

interface DispoSlotProps {
  dispo: Disponibilite;
  selected: boolean;
  onSelect: (d: Disponibilite) => void;
}

export function DispoSlot({ dispo, selected, onSelect }: DispoSlotProps) {
  const { colors } = useTheme();
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimTouch
      onPress={() => {
        scale.value = withSpring(0.95, {}, () => {
          scale.value = withSpring(1);
        });
        onSelect(dispo);
      }}
      disabled={!dispo.est_libre}
      style={[
        anim,
        {
          paddingVertical: 12,
          paddingHorizontal: 14,
          borderRadius: 14,
          marginRight: 8,
          marginBottom: 8,
          minWidth: 140,
          backgroundColor: !dispo.est_libre ? colors.surfaceAlt : selected ? colors.primary : colors.surface,
          borderWidth: 1.5,
          borderColor: !dispo.est_libre ? colors.border : selected ? colors.primary : colors.border,
          opacity: dispo.est_libre ? 1 : 0.45,
        },
      ]}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <Text style={{ fontSize: 13, fontWeight: '800', color: selected ? '#fff' : colors.text }}>
          {formatTime(dispo.date_heure_debut)}
        </Text>
        <Ionicons
          name={selected ? 'checkbox' : 'square-outline'}
          size={18}
          color={selected ? '#fff' : colors.textMuted}
        />
      </View>

      <Text style={{ fontSize: 11, color: selected ? '#ffffffCC' : colors.textMuted, marginTop: 3 }}>
        vers {formatTime(dispo.date_heure_fin)}
      </Text>

      {!dispo.est_libre && (
        <Text style={{ fontSize: 10, color: colors.danger, marginTop: 4, fontWeight: '700' }}>Complet</Text>
      )}
    </AnimTouch>
  );
}
