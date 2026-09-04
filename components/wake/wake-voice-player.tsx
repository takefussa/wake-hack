import Ionicons from '@expo/vector-icons/Ionicons';
import { useEffect } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Waveform } from '@/components/common/waveform';
import {
  legacyColors as colors,
  componentSizes,
  paperColors,
  radii,
  shadows,
  spacing,
} from '@/constants/theme';
import { useVoicePlayer } from '@/hooks/use-voice-player';
import type { UserProfile, VoiceMessage } from '@/types';

type WakeVoicePlayerProps = {
  voice: VoiceMessage;
  sender: UserProfile | null;
  autoPlay?: boolean;
  onPlayerReady?: (stopPlayback: () => void) => void;
  waveformColor?: string;
  waveformMutedColor?: string;
  controlColor?: string;
};

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const rounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export function WakeVoicePlayer({
  voice,
  sender,
  autoPlay = false,
  onPlayerReady,
  waveformColor = colors.indigo,
  waveformMutedColor = colors.indigoSoft,
  controlColor = colors.indigo,
}: WakeVoicePlayerProps) {
  const player = useVoicePlayer(voice, autoPlay);
  const isCommunity = voice.type === 'community';

  useEffect(() => {
    onPlayerReady?.(player.stopPlayback);
  }, [onPlayerReady, player.stopPlayback]);

  return (
    <View style={styles.container}>
      <View style={styles.senderRow}>
        {isCommunity ? (
          <View style={styles.communityAvatar}>
            <Ionicons color={colors.indigo} name="people-outline" size={24} />
          </View>
        ) : (
          <Avatar
            avatarId={sender?.avatarId ?? 'sky'}
            imageUri={sender?.profileImageUri}
            name={sender?.nickname ?? 'Takuma'}
            size={52}
          />
        )}
        <View style={styles.senderCopy}>
          <AppText variant="bodyMedium">
            {isCommunity ? 'オキタ！のみんなから' : `${sender?.nickname ?? '誰か'}さんから`}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatSeconds(player.durationSeconds)}の声
          </AppText>
        </View>
      </View>

      <Waveform
        color={waveformColor}
        height={44}
        mutedColor={waveformMutedColor}
        progress={player.progress}
      />

      <View style={styles.controls}>
        <Pressable
          accessibilityLabel={player.isPlaying ? '声を一時停止' : '声を再生'}
          accessibilityRole="button"
          disabled={!player.isReady}
          onPress={() => void player.togglePlayback()}
          style={({ pressed }) => [
            styles.playButton,
            { backgroundColor: controlColor },
            !player.isReady && styles.disabled,
            pressed && player.isReady && styles.pressed,
          ]}>
          {!player.isReady ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Ionicons
              color={colors.textInverse}
              name={player.isPlaying ? 'pause' : 'play'}
              size={22}
              style={!player.isPlaying ? styles.playIcon : undefined}
            />
          )}
        </Pressable>
        <View style={styles.playbackCopy}>
          <AppText variant="secondary">
            {!player.isReady
              ? '声を準備しています'
              : player.isPlaying
                ? '声を再生しています'
                : '声を聞く'}
          </AppText>
          <AppText variant="caption" tone="muted">
            {formatSeconds(player.currentTimeSeconds)} / {formatSeconds(player.durationSeconds)}
          </AppText>
        </View>
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
  container: {
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: radii.card,
    backgroundColor: paperColors.base,
    gap: spacing.xl,
    ...shadows.paper,
  },
  senderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  communityAvatar: {
    width: 52,
    height: 52,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  senderCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: componentSizes.voiceControl,
    height: componentSizes.voiceControl,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    marginLeft: 2,
  },
  playbackCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.78,
  },
  error: {
    color: colors.danger,
  },
});
