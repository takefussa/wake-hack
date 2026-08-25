import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Waveform } from '@/components/common/waveform';
import { colors, componentSizes, radii, spacing } from '@/constants/theme';
import { useVoicePlayer } from '@/hooks/use-voice-player';
import type { AvatarId, VoiceMessage } from '@/types';

type VoicePreviewProps = {
  avatarId: AvatarId;
  name: string;
  voice: VoiceMessage;
  mode?: 'light' | 'dark';
};

function formatDuration(seconds: number): string {
  const rounded = Math.max(0, Math.round(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export function VoicePreview({ avatarId, name, voice, mode = 'light' }: VoicePreviewProps) {
  const isDark = mode === 'dark';
  const player = useVoicePlayer(voice);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, isDark ? styles.dark : styles.light]}>
        <Avatar avatarId={avatarId} name={name} size={44} />
        <View style={styles.voice}>
          <View style={styles.meta}>
            <AppText variant="secondary" tone={isDark ? 'light' : 'dark'}>
              {name}さんから
            </AppText>
            <AppText variant="caption" tone={isDark ? 'lightMuted' : 'muted'}>
              {formatDuration(player.durationSeconds)}
            </AppText>
          </View>
          <Waveform
            color={isDark ? colors.textInverse : colors.indigo}
            mutedColor={isDark ? colors.navyRaised : colors.border}
            height={28}
            progress={player.progress}
          />
        </View>
        <Pressable
          accessibilityLabel={player.isPlaying ? '声を一時停止' : '声を再生'}
          accessibilityRole="button"
          disabled={!player.isReady}
          onPress={() => void player.togglePlayback()}
          style={({ pressed }) => [
            styles.play,
            isDark && styles.playDark,
            !player.isReady && styles.disabled,
            pressed && player.isReady && styles.pressed,
          ]}>
          {!player.isReady ? (
            <ActivityIndicator color={isDark ? colors.navy : colors.textInverse} size="small" />
          ) : (
            <Ionicons
              name={player.isPlaying ? 'pause' : 'play'}
              size={18}
              color={isDark ? colors.navy : colors.textInverse}
              style={!player.isPlaying ? styles.playIcon : undefined}
            />
          )}
        </Pressable>
      </View>
      {player.error ? (
        <AppText variant="caption" style={styles.error}>
          {player.error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: spacing.sm,
  },
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
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.76,
  },
  error: {
    color: colors.warmSoft,
  },
});
