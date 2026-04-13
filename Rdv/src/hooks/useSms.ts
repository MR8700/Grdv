import { Linking, Platform } from 'react-native';

export function useSms() {
  /**
   * Envoie un SMS à un ou plusieurs destinataires
   * @param phones Tableau de numéros (string)
   * @param body Contenu du message
   * @returns boolean indiquant si le SMS a pu être ouvert
   */
  const sendSms = async (phones: string[], body?: string): Promise<boolean> => {
    try {
      // Filtrer les numéros vides et nettoyer les espaces
      const recipients = phones
        .map((p) => p.trim())
        .filter(Boolean)
        .join(',');

      if (!recipients) {
        console.warn('Aucun numéro valide pour envoyer le SMS');
        return false;
      }

      // Déterminer le séparateur pour iOS vs Android
      const delimiter = Platform.OS === 'ios' ? '&' : '?';
      const url = `sms:${recipients}${body ? `${delimiter}body=${encodeURIComponent(body)}` : ''}`;

      const canOpen = await Linking.canOpenURL(url);
      if (!canOpen) {
        console.warn('Impossible d’ouvrir l’application SMS sur cet appareil');
        return false;
      }

      await Linking.openURL(url);
      return true;
    } catch (error) {
      console.error('Erreur lors de l’envoi du SMS :', error);
      return false;
    }
  };

  return { sendSms };
}