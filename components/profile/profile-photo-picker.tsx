import Ionicons from '@expo/vector-icons/Ionicons';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { colors, radii, spacing } from '@/constants/theme';
import { profileMediaService } from '@/services/profile-media-service';
import type { AvatarId } from '@/types';

type ProfilePhotoPickerProps = {
  avatarId: AvatarId;
  imageUri?: string;
  name: string;
  onChange: (imageUri?: string) => void;
};

export function ProfilePhotoPicker({
  avatarId,
  imageUri,
  name,
  onChange,
}: ProfilePhotoPickerProps) {
  const [isPicking, setIsPicking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePickImage() {
    if (isPicking) return;

    setIsPicking(true);
    setError(null);
    try {
      const selection = await profileMediaService.pickImage();
      if (selection.status === 'selected') {
        onChange(selection.uri);
      }
    } catch {
      setError('写真を開けませんでした。もう一度お試しください。');
    } finally {
      setIsPicking(false);
    }
  }

  return (
    <View style={styles.container}>
      <Pressable
        accessibilityLabel={imageUri ? 'プロフィール画像を変更' : 'プロフィール画像を選ぶ'}
        accessibilityRole="button"
        disabled={isPicking}
        onPress={() => void handlePickImage()}
        style={({ pressed }) => [styles.preview, pressed && styles.pressed]}>
        <Avatar avatarId={avatarId} imageUri={imageUri} name={name} size={88} />
        <View style={styles.editMark}>
          <Ionicons color={colors.textInverse} name="image-outline" size={16} />
        </View>
      </Pressable>

      <View style={styles.actions}>
        <AppButton
          compact
          disabled={isPicking}
          icon="image-outline"
          label={isPicking ? '写真を開いています…' : imageUri ? '写真を変更' : '写真を選ぶ'}
          onPress={() => void handlePickImage()}
          variant="secondary"
        />
        {imageUri ? (
          <AppButton compact label="写真を削除" onPress={() => onChange()} variant="text" />
        ) : null}
      </View>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
    gap: 14,
  },
  preview: {
    position: 'relative',
  },
  editMark: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 30,
    height: 30,
    borderRadius: radii.avatar,
    borderWidth: 2,
    borderColor: colors.background,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pressed: {
    opacity: 0.76,
  },
  error: {
    color: colors.danger,
  },
});
