import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { Avatar } from '@/components/common/avatar';
import { avatarOptions } from '@/constants/options';
import { spacing } from '@/constants/theme';
import type { AvatarId } from '@/types';

type AvatarPickerProps = {
  value: AvatarId;
  onChange: (avatarId: AvatarId) => void;
};

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <ScrollView
      horizontal
      contentContainerStyle={styles.container}
      showsHorizontalScrollIndicator={false}>
      {avatarOptions.map((avatar) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={avatar.label}
          accessibilityState={{ checked: value === avatar.id }}
          key={avatar.id}
          onPress={() => onChange(avatar.id)}
          style={({ pressed }) => pressed && styles.pressed}>
          <Avatar avatarId={avatar.id} size={56} selected={value === avatar.id} />
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.md,
    paddingVertical: spacing.xs,
    paddingRight: spacing.xl,
  },
  pressed: {
    opacity: 0.72,
  },
});
