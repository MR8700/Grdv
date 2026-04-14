import React from 'react';
import { View, Text, Image, ImageStyle, ViewStyle, Pressable } from 'react-native';
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

const AVATAR_COLORS = ['#1D6FA4', '#0F6E56', '#854F0B', '#712B13', '#534AB7'];

function AppAvatarComponent({ nom, prenom, photoPath, size = 44, style, imageStyle, onPress }: AppAvatarProps) {
  const { colors } = useTheme();
  const initiales = React.useMemo(() => formatInitiales(nom, prenom), [nom, prenom]);
  const uri = React.useMemo(() => (photoPath ? `${API_ORIGIN}/${photoPath}` : null), [photoPath]);
  const bgColor = React.useMemo(() => {
    const seed = initiales.charCodeAt(0) || 0;
    return AVATAR_COLORS[seed % AVATAR_COLORS.length];
  }, [initiales]);

  const wrapperStyle = React.useMemo<ViewStyle>(
    () => ({
      borderRadius: size / 2,
      padding: 2,
      backgroundColor: 'rgba(255,255,255,0.6)',
      shadowColor: '#000',
      shadowOpacity: 0.12,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 5,
    }),
    [size]
  );

  const imageBaseStyle = React.useMemo<ImageStyle>(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: colors.surfaceAlt,
    }),
    [colors.surfaceAlt, size]
  );

  const fallbackStyle = React.useMemo<ViewStyle>(
    () => ({
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: bgColor,
      alignItems: 'center',
      justifyContent: 'center',
    }),
    [bgColor, size]
  );

  const content = uri ? (
    <Image source={{ uri }} style={[imageBaseStyle, imageStyle]} />
  ) : (
    <View style={fallbackStyle}>
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

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          transform: [{ scale: pressed ? 0.96 : 1 }],
        },
      ]}
    >
      <View style={[wrapperStyle, style]}>
        <View
          style={{
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#fff',
          }}
        >
          {content}
        </View>
      </View>
    </Pressable>
  );
}

export const AppAvatar = React.memo(AppAvatarComponent);
