import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export async function isBiometricAvailable() {
  const { available } = await rnBiometrics.isSensorAvailable();
  return available;
}

export async function authenticateBiometric() {
  try {
    const result = await rnBiometrics.simplePrompt({
      promptMessage: 'Authentification requise',
    });

    return result.success;
  } catch {
    return false;
  }
}