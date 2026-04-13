import React, { useCallback, useMemo, useState } from 'react';
import { Alert, Image, Text, View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';
import { useTheme } from '../../store/ThemeContext';
import { AppButton } from './AppButton';
import { AppCard } from './AppCard';
import { pickImageFromLibrary } from '../../utils/mediaPicker';

type UploadAsset = { uri: string; name: string; type: string };

export interface ImageUploadFieldProps {
  title: string;
  subtitle?: string;
  imageUri?: string | null;
  pendingSync?: boolean;
  onUpload: (asset: UploadAsset) => Promise<void>;
  placeholderEmoji?: string;
}
 
export function ImageUploadField({
  title,
  subtitle,
  imageUri,
  pendingSync = false,
  onUpload: _onUpload,
  placeholderEmoji = 'Photo',
}: ImageUploadFieldProps) {
  const { colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const preview = useMemo(() => (imageUri ? { uri: imageUri } : null), [imageUri]);

  const glowOpacity = useSharedValue(0.3);
  glowOpacity.value = withRepeat(withTiming(0.8, { duration: 1000, easing: Easing.inOut(Easing.ease) }), -1, true);

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const handlePick = useCallback(async () => {
    try {
      setUploading(true);
      setError(null);

      const asset = await pickImageFromLibrary();
      if (!asset) return;

      await _onUpload(asset);
    } catch (err: any) {
      const message = err?.message ?? 'La selection de photo a echoue.';
      setError(message);
      Alert.alert('Photo', message);
    } finally {
      setUploading(false);
    }
  }, [_onUpload]);

  return (
    <AppCard title={title} subtitle={subtitle} noPadding>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, padding: 16 }}>
        <View style={{ width: 80, height: 80 }}>
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: colors.primary,
                borderRadius: 18,
                opacity: 0.08,
                transform: [{ scale: 1.2 }],
              },
              glowStyle,
            ]}
          />
          <View
            style={{
              width: '100%',
              height: '100%',
              borderRadius: 18,
              overflow: 'hidden',
              backgroundColor: colors.surfaceAlt,
              borderWidth: 1,
              borderColor: colors.border,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#000',
              shadowOpacity: 0.08,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 2 },
            }}
          >
            {preview ? (
              <Image source={preview} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
            ) : (
              <Text style={{ fontSize: 30, opacity: 0.6 }}>{placeholderEmoji}</Text>
            )}
          </View>
        </View>

        <View style={{ flex: 1 }}>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginBottom: 8 }}>JPG, PNG ou WebP jusqu a 5 Mo</Text>
          {pendingSync && (
            <Text style={{ color: colors.warning, fontSize: 12, marginBottom: 8, fontWeight: '700' }}>
              En attente de synchronisation
            </Text>
          )}
          <AppButton label={uploading ? 'Traitement...' : 'Choisir une image'} variant="outline" loading={uploading} onPress={handlePick} />
        </View>
      </View>

      {error && (
        <Text style={{ color: colors.danger, marginHorizontal: 16, marginBottom: 16, fontWeight: '600', textAlign: 'center' }}>{error}</Text>
      )}
    </AppCard>
  );
}
