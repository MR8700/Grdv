import React, { useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View, StyleSheet, Dimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, withDelay } from 'react-native-reanimated';
import { AuthForm, AuthFormData } from '../../components/auth/AuthForm';
import { Toast } from '../../components/ui/AppAlert';
import { useApiMutation } from '../../hooks/useApiMutation';
import { useAuth } from '../../store/AuthContext';
import { useTheme } from '../../store/ThemeContext';

const { height } = Dimensions.get('window');

export function LoginScreen({ navigation }: { navigation?: any }) {
  const { login } = useAuth();
  const { colors } = useTheme();

  const cardY = useSharedValue(60);
  const cardOpacity = useSharedValue(0);
  const logoScale = useSharedValue(0);
 
  useEffect(() => {
    // Logo animation
    logoScale.value = withSpring(1, { damping: 10, stiffness: 100 });
    // Card animation
    cardY.value = withSpring(0, { damping: 18 });
    cardOpacity.value = withDelay(200, withTiming(1, { duration: 700 }));
  }, [cardOpacity, cardY, logoScale]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: cardY.value }],
    opacity: cardOpacity.value,
  }));

  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
  }));

  const { mutate: handleLogin, loading } = useApiMutation<void>(
    async (data: unknown) => {
      const payload = data as AuthFormData;
      await login(payload.login, payload.password);
    },
    {
      onSuccess: () => {
        Toast.success('Connexion réussie', 'Bienvenue !');
      },
      showToast: false,
    }
  );

  return (
    <View style={[styles.container, { backgroundColor: '#1D6FA4' }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
          {/* Header logo + texte */}
          <View style={styles.header}>
            <Animated.View style={[styles.logoWrapper, logoAnim]}>
              <Text style={styles.logoText}>UJKZ</Text>
            </Animated.View>
            <Text style={styles.title}>Clinique UJKZ</Text>
            <Text style={styles.subtitle}>Connectez-vous à votre espace sécurisé</Text>
            <Text style={styles.slogan}>Votre santé, notre priorité 💙</Text>
          </View>

          {/* Formulaire login */}
          <Animated.View
            style={[
              cardAnim,
              {
                backgroundColor: colors.surface,
                borderTopLeftRadius: 32,
                borderTopRightRadius: 32,
                padding: 28,
                paddingBottom: 48,
                shadowColor: '#000',
                shadowOpacity: 0.12,
                shadowOffset: { width: 0, height: 8 },
                shadowRadius: 20,
              },
            ]}
          >
            <AuthForm
              mode="login"
              onSubmit={handleLogin}
              loading={loading}
              onSwitchMode={() => navigation?.navigate?.('Register')}
            />
            <Text style={styles.footerText}>Système de gestion de rendez-vous médicaux</Text>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    alignItems: 'center',
    paddingTop: height * 0.12,
    paddingBottom: 40,
    gap: 12,
  },
  logoWrapper: {
    width: 90,
    height: 90,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  logoText: { fontSize: 36, color: '#FFFFFF', fontWeight: '800' },
  title: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: 1 },
  subtitle: { color: 'rgba(255,255,255,0.7)', fontSize: 14, marginTop: 4, textAlign: 'center' },
  slogan: { color: '#E0F2FF', fontSize: 12, fontWeight: '500', marginTop: 4 },
  footerText: { textAlign: 'center', color: 'rgba(0,0,0,0.5)', fontSize: 12, marginTop: 20 },
});
