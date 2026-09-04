import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { avatarOptions } from '@/constants/options';
import { colors, radii } from '@/constants/theme';
import type { AvatarId } from '@/types';

const avatarImages: Record<AvatarId, number> = {
  luna: require('../../assets/images/avatar-blue-bob.png'),
  sunny: require('../../assets/images/avatar-robot.png'),
  sky: require('../../assets/images/avatar-cat.png'),
  violet: require('../../assets/images/avatar-blue-short.png'),
  ember: require('../../assets/images/avatar-alien.png'),
  // 旧アイコンを使っていたプロフィールも新しいデフォルト画像で表示する。
  mint: require('../../assets/images/avatar-blue-bob.png'),
};

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
      <Image
        accessibilityIgnoresInvertColors
        contentFit="cover"
        source={imageUri ? { uri: imageUri } : avatarImages[avatarId]}
        style={StyleSheet.absoluteFill}
        transition={120}
      />
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
