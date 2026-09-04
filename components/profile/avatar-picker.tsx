import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar } from '@/components/common/avatar';
import { spacing } from '@/constants/theme';
import type { AvatarId } from '@/types';

type AvatarPickerProps = {
  value: AvatarId;
  onChange: (avatarId: AvatarId) => void;
};

const avatarCandidates: { id: AvatarId; label: string }[] = [
  { id: 'ember', label: 'avatar-alien.png' },
  { id: 'luna', label: 'avatar-blue-bob.png' },
  { id: 'violet', label: 'avatar-blue-short.png' },
  { id: 'sky', label: 'avatar-cat.png' },
  { id: 'sunny', label: 'avatar-robot.png' },
];

export function AvatarPicker({ value, onChange }: AvatarPickerProps) {
  return (
    <View style={styles.container}>
      {avatarCandidates.map((avatar) => (
        <Pressable
          accessibilityRole="radio"
          accessibilityLabel={avatar.label}
          accessibilityState={{ checked: value === avatar.id }}
          key={avatar.id}
          onPress={() => onChange(avatar.id)}
          style={({ pressed }) => pressed && styles.pressed}>
          <Avatar
            avatarId={avatar.id}
            name={avatar.label}
            size={42}
            selected={value === avatar.id}
          />
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
