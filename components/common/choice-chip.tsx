import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, componentSizes, paperColors, radii, spacing } from '@/constants/theme';

type ChoiceChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  mode?: 'light' | 'dark';
  emphasized?: boolean;
  selectedStyle?: 'default' | 'warm';
};

export function ChoiceChip({
  label,
  selected,
  onPress,
  mode = 'light',
  emphasized = false,
  selectedStyle = 'default',
}: ChoiceChipProps) {
  const isDark = mode === 'dark';
  const isWarmSelected = selected && selectedStyle === 'warm';
  const textTone = isDark ? 'light' : selected && !isWarmSelected ? 'accent' : 'soft';

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
        isWarmSelected && styles.selectedWarm,
        pressed && styles.pressed,
      ]}>
      <AppText
        variant="secondary"
        tone={textTone}
        style={isWarmSelected ? styles.warmContent : undefined}
      >
        {label}
      </AppText>
      {selected ? (
        <Ionicons
          name="checkmark"
          size={15}
          color={isDark ? colors.textInverse : isWarmSelected ? paperColors.ink : colors.indigo}
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
  selectedWarm: {
    backgroundColor: paperColors.paleYellow,
    borderColor: paperColors.orange,
  },
  warmContent: {
    color: paperColors.ink,
  },
  pressed: {
    opacity: 0.68,
  },
});
