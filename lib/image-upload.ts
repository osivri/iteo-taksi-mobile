import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

const MAX_WIDTH = 1280;
const UPLOAD_QUALITY = 0.8;

export interface PreparedImage {
  uri: string;
  name: string;
  type: string;
}

export async function prepareImageForUpload(uri: string): Promise<PreparedImage> {
  const manipulated = await ImageManipulator.manipulateAsync(
    uri,
    [{ resize: { width: MAX_WIDTH } }],
    { compress: UPLOAD_QUALITY, format: ImageManipulator.SaveFormat.JPEG },
  );

  return {
    uri: manipulated.uri,
    name: 'image.jpg',
    type: 'image/jpeg',
  };
}

export function appendImageToFormData(formData: FormData, image: PreparedImage, fieldName = 'file') {
  formData.append(fieldName, {
    uri: image.uri,
    name: image.name,
    type: image.type,
  } as unknown as Blob);
}

export async function pickImageFromLibrary(
  options: ImagePicker.ImagePickerOptions = {},
): Promise<ImagePicker.ImagePickerAsset | null> {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.9,
    ...options,
  });

  if (result.canceled || !result.assets[0]) return null;
  return result.assets[0];
}

export async function pickAndPrepareFromLibrary(
  options: ImagePicker.ImagePickerOptions = {},
): Promise<PreparedImage | null> {
  const asset = await pickImageFromLibrary(options);
  if (!asset) return null;
  return prepareImageForUpload(asset.uri);
}
