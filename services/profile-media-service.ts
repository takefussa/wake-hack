import * as ImagePicker from 'expo-image-picker';

export type ProfileImageSelection =
  | { status: 'selected'; uri: string }
  | { status: 'canceled' };

export class ProfileMediaService {
  async pickImage(): Promise<ProfileImageSelection> {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled || !result.assets[0]?.uri) {
      return { status: 'canceled' };
    }

    return { status: 'selected', uri: result.assets[0].uri };
  }
}

export const profileMediaService = new ProfileMediaService();
