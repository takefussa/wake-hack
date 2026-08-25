import Ionicons from '@expo/vector-icons/Ionicons';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Waveform } from '@/components/common/waveform';
import { colors, componentSizes, radii, spacing } from '@/constants/theme';
import type { AvatarId } from '@/types';

type VoicePreviewProps = {
  avatarId: AvatarId;
  name: string;
  duration: string;
  mode?: 'light' | 'dark';
};

export function VoicePreview({ avatarId, name, duration, mode = 'light' }: VoicePreviewProps) {
  const isDark = mode === 'dark';

  return (
    <View style={[styles.container, isDark ? styles.dark : styles.light]}>
      <Avatar avatarId={avatarId} name={name} size={44} />
      <View style={styles.voice}>
        <View style={styles.meta}>
          <AppText variant="secondary" tone={isDark ? 'light' : 'dark'}>
            {name}さんから
          </AppText>
          <AppText variant="caption" tone={isDark ? 'lightMuted' : 'muted'}>
            {duration}
          </AppText>
        </View>
        <Waveform
          color={isDark ? colors.textInverse : colors.indigo}
          mutedColor={isDark ? colors.navyRaised : colors.border}
          height={28}
          progress={0.64}
        />
      </View>
      <View style={[styles.play, isDark && styles.playDark]}>
        <Ionicons
          name="play"
          size={18}
          color={isDark ? colors.navy : colors.textInverse}
          style={styles.playIcon}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 88,
    padding: spacing.lg,
    borderRadius: radii.card,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  light: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dark: {
    backgroundColor: colors.navyRaised,
  },
  voice: {
    flex: 1,
    gap: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing.sm,
  },
  play: {
    width: componentSizes.touchTarget,
    height: componentSizes.touchTarget,
    borderRadius: componentSizes.touchTarget / 2,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDark: {
    backgroundColor: colors.textInverse,
  },
  playIcon: {
    marginLeft: 2,
  },
});
