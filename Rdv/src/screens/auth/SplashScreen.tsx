import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import { COLORS } from '../../utils/constants';

const { width } = Dimensions.get('window');

export function SplashScreen() {
  const nav = useNavigation<any>();
 
  // rotation rapide
  const rotation = useSharedValue(0);
  // barre de progression
  const progress = useSharedValue(0);
  // messages animés
  const messageOpacity = useSharedValue(0);

  // Simulation du chargement réel (remplacer par état réel de l'app)
  useEffect(() => {
    const goToLogin = () => nav.replace('Login');

    // apparaitre le message
    messageOpacity.value = withTiming(1, { duration: 800 });

    // rotation initiale rapide
    rotation.value = withRepeat(
      withTiming(360, { duration: 400, easing: Easing.linear }),
      -1
    );

    // simulation barre de chargement
    let load = 0;
    const interval = setInterval(() => {
      load += Math.random() * 0.07; // progression pseudo-aléatoire
      if (load >= 1) load = 1;
      progress.value = withTiming(load, { duration: 200 });

      if (load >= 1) {
        // ralentir rotation
        rotation.value = withTiming(rotation.value + 90, { duration: 1200, easing: Easing.out(Easing.exp) }, () => {
          // fin de l'animation, naviguer
          runOnJS(goToLogin)();
        });
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [messageOpacity, nav, progress, rotation]);

  const logoAnim = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const progressAnim = useAnimatedStyle(() => ({
    width: progress.value * (width - 60),
  }));

  const messageAnim = useAnimatedStyle(() => ({
    opacity: messageOpacity.value,
  }));

  return (
    <View style={[styles.container, { backgroundColor: COLORS.primary }]}>
      {/* Message d'accueil en haut */}
      <Animated.View style={[messageAnim]}>
        <Text style={styles.welcomeText}>Bienvenue sur votre Centre de Santé !</Text>
        <Text style={styles.descriptionText}>Système de gestion de rendez-vous moderne et rapide</Text>
      </Animated.View>

      {/* Logo tournant */}
      <Animated.View style={[styles.logoWrapper, logoAnim]}>
        <Text style={styles.logo}>🏥</Text>
      </Animated.View>

      {/* Barre de progression et message */}
      <View style={{ width: '100%', alignItems: 'center', marginTop: 40 }}>
        <View style={styles.progressBackground}>
          <Animated.View style={[styles.progressBar, progressAnim]} />
        </View>
        <Text style={styles.loadingText}>Veuillez patienter un instant...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 40,
  },
  welcomeText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  descriptionText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  logo: { fontSize: 60 },
  progressBackground: {
    width: width - 60,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  loadingText: {
    marginTop: 6,
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
  },
});
