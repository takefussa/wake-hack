import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/common/avatar';
import { avatarOptions } from '@/constants/options';
import { spacing } from '@/constants/theme';
import type { AvatarId } from '@/types';

type AvatarPickerProps = {
  value: AvatarId;
  onChange: (avatarId: AvatarId) => void;
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  const selectableAvatars = avatarOptions.filter((avatar) => avatar.selectable !== false);

  return (
    <View style={styles.container}>
      {selectableAvatars.map((avatar) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={avatar.label}
          accessibilityState={{ checked: value === avatar.id }}
          key={avatar.id}
          onPress={() => onChange(avatar.id)}
          style={({ pressed }) => pressed && styles.pressed}>
          <Avatar avatarId={avatar.id} size={42} selected={value === avatar.id} />
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 150,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
});
