import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { wakeStyleOptions } from '@/constants/community-voice';
import { legacyColors as colors, radii, spacing } from '@/constants/theme';
import type { WakeStyle } from '@/types';

type WakeStyleSelectorProps = {
  selected: WakeStyle;
  onSelect: (wakeStyle: WakeStyle) => void;
};

export function WakeStyleSelector({ selected, onSelect }: WakeStyleSelectorProps) {
  return (
    <View style={styles.container}>
      {wakeStyleOptions.map((option) => {
        const isSelected = selected === option.id;
        return (
          <Pressable
            accessibilityRole="button"
            key={option.id}
            onPress={() => onSelect(option.id)}
            style={({ pressed }) => [
              styles.option,
              isSelected && styles.optionSelected,
              pressed && styles.pressed,
            ]}>
            <View style={[styles.icon, isSelected && styles.iconSelected]}>
              <Ionicons
                color={isSelected ? colors.textInverse : colors.indigo}
                name={option.icon}
                size={21}
              />
            </View>
            <View style={styles.copy}>
              <AppText variant="bodyMedium">{option.label}</AppText>
              <AppText variant="caption" tone="soft">
                {option.description}
              </AppText>
            </View>
            {isSelected ? (
              <Ionicons color={colors.success} name="checkmark-circle" size={22} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  option: {
    minHeight: 78,
    padding: spacing.md,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  optionSelected: {
    borderColor: colors.indigo,
    backgroundColor: colors.indigoSoft,
  },
  icon: {
    width: 42,
    height: 42,
    borderRadius: radii.avatar,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.indigoSoft,
  },
  iconSelected: {
    backgroundColor: colors.indigo,
  },
  copy: {
    flex: 1,
    gap: 2,
  },
  pressed: {
    opacity: 0.76,
  },
});
