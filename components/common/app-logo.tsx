import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Waveform } from '@/components/common/waveform';
import { colors, spacing } from '@/constants/theme';

type AppLogoProps = {
  compact?: boolean;
  mode?: 'light' | 'dark';
};

export function AppLogo({ compact = false, mode = 'dark' }: AppLogoProps) {
  const isDark = mode === 'dark';

  return (
    <View style={styles.container}>
      <View style={[styles.wave, compact && styles.waveCompact]}>
        <Waveform
          color={isDark ? colors.textInverse : colors.indigo}
          height={compact ? 16 : 20}
          levels={[5, 11, 16, 8, 13, 7]}
        />
      </View>
      <AppText variant={compact ? 'bodyMedium' : 'sectionTitle'} tone={isDark ? 'light' : 'dark'}>
        Wake Hack
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  wave: {
    width: 28,
  },
  waveCompact: {
    width: 22,
  },
});
