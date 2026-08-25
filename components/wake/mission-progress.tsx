import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, radii, spacing } from '@/constants/theme';

type MissionProgressProps = {
  current: number;
  target: number;
};

export function MissionProgress({ current, target }: MissionProgressProps) {
  const progress = Math.min(1, current / Math.max(1, target));

  return (
    <View style={styles.container}>
      <View style={styles.countRow}>
        <AppText variant="displayNumber">{current}</AppText>
        <AppText variant="bodyMedium" tone="soft">
          / {target}歩
        </AppText>
      </View>
      <View
        accessibilityLabel={`${target}歩中${current}歩`}
        accessibilityRole="progressbar"
        style={styles.track}>
        <View style={[styles.progress, { width: `${progress * 100}%` }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  countRow: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  track: {
    height: 10,
    borderRadius: radii.badge,
    backgroundColor: colors.indigoSoft,
    overflow: 'hidden',
  },
  progress: {
    height: '100%',
    borderRadius: radii.badge,
    backgroundColor: colors.warm,
  },
});
