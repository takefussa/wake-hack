import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { colors, spacing } from '@/constants/theme';

type LoadingStateProps = {
  label: string;
};

export function LoadingState({ label }: LoadingStateProps) {
  return (
    <View accessibilityLiveRegion="polite" style={styles.container}>
      <ActivityIndicator color={colors.indigo} />
      <AppText variant="secondary" tone="soft">
        {label}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
