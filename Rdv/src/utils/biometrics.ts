import ReactNativeBiometrics from 'react-native-biometrics';

const rnBiometrics = new ReactNativeBiometrics();

export interface BiometricStatus {
  available: boolean;
  biometryType: string | null;
  reason?: string;
}

export async function getBiometricStatus(): Promise<BiometricStatus> {
  try {
    const result = await rnBiometrics.isSensorAvailable();
    return {
      available: Boolean(result.available),
      biometryType: result.biometryType ?? null,
      reason: result.error || undefined,
    };
  } catch (error: any) {
    return {
      available: false,
      biometryType: null,
      reason: error?.message || 'Capteur biométrique indisponible.',
    };
  }
}

export async function isBiometricAvailable() {
  const status = await getBiometricStatus();
  return status.available;
}

export async function authenticateBiometric(promptMessage = 'Authentification requise') {
  try {
    const status = await getBiometricStatus();
    if (!status.available) {
      return {
        success: false,
        error: status.reason || 'Aucune biometrie disponible sur cet appareil.',
      };
    }

    const result = await rnBiometrics.simplePrompt({ promptMessage });

    return {
      success: Boolean(result.success),
      error: result.success ? undefined : 'Authentification annulee.',
    };
  } catch (error: any) {
    return {
      success: false,
      error: error?.message || 'Authentification biometrique impossible.',
    };
  }
}
