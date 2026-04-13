import { Share, Platform } from 'react-native';

export function useShare() {
  /**
   * Partage un texte simple ou une URL
   */
  const shareText = async (text: string, title?: string) => {
    try {
      await Share.share(
        { message: text, title },
        { dialogTitle: title || 'Partager' }
      );
    } catch (error) {
      console.warn('Erreur lors du partage de texte :', error);
    }
  };

  /**
   * Partage un fichier via URI
   * ⚠️ Note : React Native Share core ne gère pas tous les fichiers locaux sur Android/iOS.
   * Pour un vrai partage de fichiers, utiliser expo-sharing / react-native-share.
   */
  const shareFile = async (uri: string, title?: string) => {
    try {
      const shareOptions = Platform.select({
        ios: { url: uri, message: title },
        android: { url: uri, message: title || uri },
      });
      await Share.share(shareOptions as any);
    } catch (error) {
      console.warn('Erreur lors du partage du fichier :', error);
    }
  };

  /**
   * Partage combiné texte + fichiers
   * Pour l’instant, essaie de partager le texte + le premier fichier uniquement
   */
  const shareTextAndFile = async (text: string, fileUri?: string, title?: string) => {
    if (fileUri) {
      await shareFile(fileUri, text);
    } else {
      await shareText(text, title);
    }
  };

  return { shareText, shareFile, shareTextAndFile };
}