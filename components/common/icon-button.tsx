import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet } from 'react-native';

import { colors, componentSizes, radii } from '@/constants/theme';

type IconButtonProps = {
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  mode?: 'light' | 'dark';
};

export function IconButton({ icon, label, onPress, mode = 'light' }: IconButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      <Ionicons
        name={icon}
        size={22}
        color={mode === 'dark' ? colors.textInverse : colors.text}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: componentSizes.touchTarget,
    height: componentSizes.touchTarget,
    borderRadius: radii.button,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    backgroundColor: colors.surfaceSubtle,
  },
});
