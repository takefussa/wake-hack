import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { spacing } from '@/constants/theme';

type StatTileProps = {
  value: string;
  label: string;
  compact?: boolean;
};

export function StatTile({ value, label, compact = false }: StatTileProps) {
  return (
    <View style={[styles.metric, compact ? styles.compact : styles.half]}>
      <AppText variant="sectionTitle">{value}</AppText>
      <AppText variant="caption" tone="soft">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  metric: {
    flex: 1,
    paddingVertical: spacing.md,
    gap: spacing.xs,
  },
  compact: {
    minWidth: 0,
  },
  half: {
    flexBasis: '40%',
    minWidth: 112,
  },
});
