import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, radii, spacing } from '@/constants/theme';

type SettingsRowProps = {
  label: string;
  value?: string;
  onPress: () => void;
  testID?: string;
};

export function SettingsRow({ label, value, onPress, testID }: SettingsRowProps) {
  return (
    <Pressable
      accessibilityLabel={value ? `${label}: ${value}` : label}
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
      testID={testID}>
      <AppText variant="bodyMedium">{label}</AppText>
      <View style={styles.right}>
        {value ? (
          <AppText tone="soft" variant="secondary">
            {value}
          </AppText>
        ) : null}
        <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 56,
    paddingHorizontal: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.72,
  },
  right: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
