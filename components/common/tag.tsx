import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, radii, spacing } from '@/constants/theme';

type TagProps = {
  label: string;
};

export function Tag({ label }: TagProps) {
  return (
    <View style={styles.tag}>
      <AppText variant="caption" tone="soft">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.chip,
    backgroundColor: colors.surfaceSubtle,
  },
});
