import Ionicons from '@expo/vector-icons/Ionicons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Waveform } from '@/components/common/waveform';
import { colors, paperColors, spacing } from '@/constants/theme';
import { useVoicePlayer } from '@/hooks/use-voice-player';
import type { ThanksInboxItem, VoiceMessage } from '@/types';

type ThanksInboxRowProps = {
  item: ThanksInboxItem;
};

function formatTime(createdAt: string): string {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return '0:00';
  const rounded = Math.max(0, Math.floor(seconds));
  return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, '0')}`;
}

export function ThanksInboxRow({ item }: ThanksInboxRowProps) {
  const senderName = item.sender?.nickname ?? '誰か';
  const voice = useMemo<VoiceMessage>(
    () => ({
      id: item.message.id,
      senderId: item.message.senderId,
      receiverId: item.message.receiverId,
      uri: item.message.audioUri ?? '',
      durationMs: 0,
      type: 'thanks',
      createdAt: item.message.createdAt,
    }),
    [
      item.message.audioUri,
      item.message.createdAt,
      item.message.id,
      item.message.receiverId,
      item.message.senderId,
    ]
  );
  const player = useVoicePlayer(voice);

  return (
    <View style={styles.container}>
      <Avatar
        avatarId={item.sender?.avatarId ?? 'luna'}
        imageUri={item.sender?.profileImageUri}
        name={senderName}
        size={44}
      />
      <View style={styles.copy}>
        <View style={styles.header}>
          <AppText variant="bodyMedium">{senderName}</AppText>
          <AppText variant="caption" tone="muted">
            {formatTime(item.message.createdAt)}
          </AppText>
        </View>
        <AppText variant="secondary" tone="soft">
          {senderName}さんからボイスメッセージが届きました
        </AppText>
        <AppText variant="caption" tone="muted">
          {item.contextLabel}
        </AppText>
        <View style={styles.voicePlayer}>
          <Waveform
            color={paperColors.orange}
            height={34}
            mutedColor={paperColors.paleYellow}
            progress={player.progress}
          />
          <View style={styles.voiceControls}>
            <Pressable
              accessibilityLabel={player.isPlaying ? '返ってきた声を一時停止' : '返ってきた声を再生'}
              accessibilityRole="button"
              disabled={!player.isReady}
              onPress={() => void player.togglePlayback()}
              style={({ pressed }) => [
                styles.playButton,
                !player.isReady && styles.disabled,
                pressed && player.isReady && styles.pressed,
              ]}
            >
              {!player.isReady ? (
                <ActivityIndicator color={paperColors.ink} size="small" />
              ) : (
                <Ionicons
                  color={paperColors.ink}
                  name={player.isPlaying ? 'pause' : 'play'}
                  size={18}
                />
              )}
            </Pressable>
            <View style={styles.voiceCopy}>
              <AppText variant="secondary">
                {!player.isReady
                  ? 'ボイメを準備しています'
                  : player.isPlaying
                    ? '再生しています'
                    : '返ってきたボイメを聞く'}
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
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
  },
  copy: {
    flex: 1,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  voicePlayer: {
    marginTop: spacing.xs,
    padding: spacing.md,
    borderWidth: 1.5,
    borderColor: paperColors.ink,
    borderRadius: 12,
    backgroundColor: paperColors.base,
    gap: spacing.sm,
  },
  voiceControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  playButton: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: paperColors.ink,
    borderRadius: 21,
    backgroundColor: paperColors.orange,
  },
  voiceCopy: {
    flex: 1,
    gap: 2,
  },
  disabled: {
    opacity: 0.45,
  },
  pressed: {
    opacity: 0.68,
  },
  error: {
    color: colors.danger,
  },
});
