import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/common/app-logo';
import { colors, spacing } from '@/constants/theme';

export function LoadingScreen() {
  return (
    <View style={styles.container}>
      <AppLogo />
      <ActivityIndicator color={colors.warm} size="small" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    backgroundColor: colors.navy,
  },
});
