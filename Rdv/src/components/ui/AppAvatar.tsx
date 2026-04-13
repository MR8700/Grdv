import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Image,
  ImageStyle,
  ViewStyle,
  Animated,
  Pressable,
} from 'react-native';
import { useTheme } from '../../store/ThemeContext';
import { formatInitiales } from '../../utils/formatters';
import { API_ORIGIN } from '../../utils/constants';

interface AppAvatarProps {
  nom: string;
  prenom: string;
  photoPath?: string | null;
  size?: number;
  style?: ViewStyle;
  imageStyle?: ImageStyle;
  onPress?: () => void;
} 

export function AppAvatar({
  nom,
  prenom,
  photoPath,
  size = 44,
  style,
  imageStyle,
  onPress,
}: AppAvatarProps) {
  const { colors } = useTheme();
  const initiales = formatInitiales(nom, prenom);
  const uri = photoPath ? `${API_ORIGIN}/${photoPath}` : null;

  //////////////////////////////////////////////////////////////
  // 🎬 ANIMATIONS
  //////////////////////////////////////////////////////////////
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  }, [opacity, scale]);

  //////////////////////////////////////////////////////////////
  // 🎨 BACKGROUND DYNAMIQUE
  //////////////////////////////////////////////////////////////
  const colors_list = ['#1D6FA4', '#0F6E56', '#854F0B', '#712B13', '#534AB7'];
  const bgColor = colors_list[initiales.charCodeAt(0) % colors_list.length];

  //////////////////////////////////////////////////////////////
  // 🧩 CONTENU AVATAR
  //////////////////////////////////////////////////////////////
  const content = uri ? (
    <Image
      source={{ uri }}
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.surfaceAlt,
        },
        imageStyle,
      ]}
    />
  ) : (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bgColor,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          color: '#FFF',
          fontSize: size * 0.36,
          fontWeight: '700',
          letterSpacing: 0.5,
        }}
      >
        {initiales}
      </Text>
    </View>
  );

  //////////////////////////////////////////////////////////////
  // 🧠 WRAPPER PREMIUM
  //////////////////////////////////////////////////////////////
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <Animated.View
        style={[
          {
            opacity,
            transform: [{ scale }],
            borderRadius: size / 2,

            // 🔥 BORDER PREMIUM (ring effect)
            padding: 2,
            backgroundColor: 'rgba(255,255,255,0.6)',

            // 🔥 SHADOW SOFT
            shadowColor: '#000',
            shadowOpacity: 0.12,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 5,
          },
          style,
        ]}
      >
        <View
          style={{
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          {content}
        </View>
      </Animated.View>
    </Pressable>
  );
}
