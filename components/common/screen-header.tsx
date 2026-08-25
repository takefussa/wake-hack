import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { spacing } from '@/constants/theme';

type ScreenHeaderProps = {
  title: string;
  description?: string;
  stepLabel?: string;
  onBack?: () => void;
};

export function ScreenHeader({
  title,
  description,
  stepLabel,
  onBack,
}: ScreenHeaderProps) {
  return (
    <View style={styles.container}>
      {onBack || stepLabel ? (
        <View style={styles.navigation}>
          {onBack ? (
            <View style={styles.backButton}>
              <IconButton icon="chevron-back" label="戻る" onPress={onBack} />
            </View>
          ) : (
            <View />
          )}
          {stepLabel ? (
            <AppText variant="caption" tone="muted">
              {stepLabel}
            </AppText>
          ) : null}
        </View>
      ) : null}

      <View style={styles.copy}>
        <AppText variant="screenTitle">{title}</AppText>
        {description ? (
          <AppText variant="secondary" tone="soft">
            {description}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.lg,
  },
  navigation: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    marginLeft: -spacing.md,
  },
  copy: {
    gap: spacing.sm,
  },
});
