import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Waveform } from '@/components/common/waveform';
import { getWakeStyleOption } from '@/constants/community-voice';
import { legacyColors as colors, radii, spacing } from '@/constants/theme';
import { useVoicePlayer } from '@/hooks/use-voice-player';
import type { CommunityVoice, VoiceMessage } from '@/types';

type CommunityVoiceHistoryRowProps = {
  voice: CommunityVoice;
  isDeleting?: boolean;
  onDelete?: (voice: CommunityVoice) => void;
};

function formatDate(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '--/--';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function toVoiceMessage(voice: CommunityVoice): VoiceMessage {
  return {
    id: voice.id,
    senderId: voice.senderId,
    uri: voice.uri,
    storagePath: voice.audioPath,
    durationMs: voice.durationMs,
    type: 'community',
    wakeStyle: voice.wakeStyle,
    createdAt: voice.createdAt,
  };
}

export function CommunityVoiceHistoryRow({
  voice,
  isDeleting = false,
  onDelete,
}: CommunityVoiceHistoryRowProps) {
  const player = useVoicePlayer(toVoiceMessage(voice));
  const wakeStyle = getWakeStyleOption(voice.wakeStyle);

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="caption" tone="muted">
          {formatDate(voice.createdAt)}
        </AppText>
        <View style={styles.badge}>
          <Ionicons color={colors.indigo} name={wakeStyle.icon} size={15} />
          <AppText variant="caption" tone="accent">
            {wakeStyle.label}
          </AppText>
        </View>
      </View>

      <View style={styles.playerRow}>
        <Pressable
          accessibilityRole="button"
          disabled={!player.isReady}
          onPress={() => void player.togglePlayback()}
          style={({ pressed }) => [
            styles.play,
            !player.isReady && styles.disabled,
            pressed && player.isReady && styles.pressed,
          ]}>
          {!player.isReady ? (
            <ActivityIndicator color={colors.textInverse} size="small" />
          ) : (
            <Ionicons
              color={colors.textInverse}
              name={player.isPlaying ? 'pause' : 'play'}
              size={18}
              style={!player.isPlaying ? styles.playIcon : undefined}
            />
          )}
        </Pressable>
        <View style={styles.waveform}>
          <AppText variant="secondary">Community Voice</AppText>
          <Waveform color={colors.indigo} mutedColor={colors.border} progress={player.progress} />
        </View>
      </View>

      <View style={styles.stats}>
        <AppText variant="caption" tone="soft">
          起こした人 {voice.playCount}人
        </AppText>
        <AppText variant="caption" tone="soft">
          Thanks {voice.thanksCount}
        </AppText>
      </View>

      {onDelete ? (
        <Pressable
          accessibilityRole="button"
          disabled={isDeleting}
          onPress={() => onDelete(voice)}
          style={({ pressed }) => [
            styles.deleteButton,
            isDeleting && styles.disabled,
            pressed && !isDeleting && styles.pressed,
          ]}>
          {isDeleting ? (
            <ActivityIndicator color={colors.danger} size="small" />
          ) : (
            <>
              <Ionicons color={colors.danger} name="trash-outline" size={16} />
              <AppText variant="caption" style={styles.deleteText}>
                削除
              </AppText>
            </>
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  badge: {
    minHeight: 28,
    paddingHorizontal: spacing.sm,
    borderRadius: radii.badge,
    backgroundColor: colors.indigoSoft,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  play: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.indigo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveform: {
    flex: 1,
    gap: spacing.xs,
  },
  playIcon: {
    marginLeft: 2,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  deleteButton: {
    minHeight: 40,
    borderRadius: radii.badge,
    borderWidth: 1,
    borderColor: colors.danger,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
  },
  deleteText: {
    color: colors.danger,
  },
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.76,
  },
});
