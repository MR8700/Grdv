import { Asset, ImageLibraryOptions, launchImageLibrary } from 'react-native-image-picker';

export interface PickedImageAsset {
  uri: string;
  name: string;
  type: string;
}

const IMAGE_OPTIONS: ImageLibraryOptions = {
  mediaType: 'photo',
  selectionLimit: 1,
  quality: 0.9,
  includeExtra: false,
  presentationStyle: 'fullScreen',
};

function getFileExtension(asset: Asset) {
  if (asset.type?.includes('/')) {
    return asset.type.split('/')[1];
  }

  const fileName = asset.fileName ?? '';
  const lastDot = fileName.lastIndexOf('.');
  return lastDot >= 0 ? fileName.slice(lastDot + 1) : 'jpg';
}

function normalizeAsset(asset: Asset): PickedImageAsset {
  if (!asset.uri) {
    throw new Error('Aucune image exploitable n a ete retournee.');
  }

  const type = asset.type || 'image/jpeg';
  const extension = getFileExtension(asset);
  const name = asset.fileName || `image-${Date.now()}.${extension}`;

  return {
    uri: asset.uri,
    name,
    type,
  };
}

export function getImagePickerErrorMessage(errorCode?: string) {
  switch (errorCode) {
    case 'camera_unavailable':
      return 'La galerie ou la camera n est pas disponible sur cet appareil.';
    case 'permission':
      return 'L acces aux photos a ete refuse. Autorisez la permission puis recommencez.';
    case 'others':
      return 'La selection de photo a echoue. Reessayez avec une autre image.';
    default:
      return 'Impossible d ouvrir la galerie de photos.';
  }
}

export async function pickImageFromLibrary(options?: ImageLibraryOptions): Promise<PickedImageAsset | null> {
  const result = await launchImageLibrary({ ...IMAGE_OPTIONS, ...options });

  if (result.didCancel) {
    return null;
  }

  if (result.errorCode) {
    throw new Error(result.errorMessage || getImagePickerErrorMessage(result.errorCode));
  }

  const asset = result.assets?.find((item) => Boolean(item.uri));
  if (!asset) {
    throw new Error('Aucune image n a ete selectionnee.');
  }

  return normalizeAsset(asset);
}
