import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { avatarOptions } from '@/constants/options';
import { colors, fonts, radii } from '@/constants/theme';
import type { AvatarId } from '@/types';

type AvatarProps = {
  avatarId: AvatarId;
  name?: string;
  imageUri?: string;
  size?: number;
  selected?: boolean;
};

export function Avatar({
  avatarId,
  name,
  imageUri,
  size = 48,
  selected = false,
}: AvatarProps) {
  const option = avatarOptions.find((item) => item.id === avatarId) ?? avatarOptions[0];
  const initial = (name?.trim().slice(0, 1) || option.initial).toUpperCase();

  return (
    <View
      accessibilityLabel={`${name ?? option.label}のアバター`}
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: radii.avatar,
          backgroundColor: option.background,
          borderColor: selected ? colors.indigo : colors.surface,
          borderWidth: selected ? 2 : 1,
        },
      ]}>
      {imageUri ? (
        <Image
          accessibilityIgnoresInvertColors
          contentFit="cover"
          source={{ uri: imageUri }}
          style={StyleSheet.absoluteFill}
          transition={120}
        />
      ) : (
        <AppText
          variant="bodyMedium"
          style={{
            color: option.foreground,
            fontFamily: fonts?.rounded,
            fontSize: Math.max(14, Math.round(size * 0.34)),
            lineHeight: Math.max(18, Math.round(size * 0.42)),
          }}>
          {initial}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
