import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, componentSizes, radii, spacing } from '@/constants/theme';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  mode?: 'light' | 'dark';
  emphasized?: boolean;
};

export function ChoiceChip({
  label,
  selected,
  onPress,
  mode = 'light',
  emphasized = false,
}: ChoiceChipProps) {
  const isDark = mode === 'dark';
  const textTone = isDark ? 'light' : selected ? 'accent' : 'soft';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        emphasized && styles.emphasized,
        isDark ? styles.dark : styles.light,
        selected && (isDark ? styles.selectedDark : styles.selectedLight),
        pressed && styles.pressed,
      ]}>
      <AppText variant="secondary" tone={textTone}>
        {label}
      </AppText>
      {selected ? (
        <Ionicons
          name="checkmark"
          size={15}
          color={isDark ? colors.textInverse : colors.indigo}
        />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: componentSizes.touchTarget,
    borderRadius: radii.chip,
    borderWidth: 1,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  emphasized: {
    borderWidth: 2,
  },
  light: {
    backgroundColor: colors.transparent,
    borderColor: colors.border,
  },
  dark: {
    backgroundColor: colors.transparent,
    borderColor: colors.textInverseSecondary,
  },
  selectedLight: {
    backgroundColor: colors.indigoSoft,
    borderColor: colors.indigo,
  },
  selectedDark: {
    backgroundColor: colors.navyRaised,
    borderColor: colors.textInverse,
  },
  pressed: {
    opacity: 0.68,
  },
});
