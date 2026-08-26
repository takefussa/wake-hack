import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Waveform } from '@/components/common/waveform';
import { prototypeConfig } from '@/constants/config';
import { colors, componentSizes, fonts, radii, spacing } from '@/constants/theme';
import { formatRecordingDuration } from '@/features/voice/format-duration';
import type { LocalVoiceRecording, MicrophonePermissionState } from '@/hooks/use-voice-recorder';

type VoiceRecorderPanelProps = {
  permissionState: MicrophonePermissionState;
  canAskPermissionAgain: boolean;
  isRequestingPermission: boolean;
  recording: LocalVoiceRecording | null;
  isRecording: boolean;
  isPlaying: boolean;
  isPlaybackReady: boolean;
  durationMs: number;
  playbackProgress: number;
  metering?: number;
  error: string | null;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
  onTogglePlayback: () => void;
};

const waveformLevels = [8, 18, 28, 14, 36, 24, 10, 32, 20, 40, 16, 30, 12, 24, 34];

export function VoiceRecorderPanel({
  permissionState,
  canAskPermissionAgain,
  isRequestingPermission,
  recording,
  isRecording,
  isPlaying,
  isPlaybackReady,
  durationMs,
  playbackProgress,
  metering,
  error,
  onRequestPermission,
  onOpenSettings,
  onTogglePlayback,
}: VoiceRecorderPanelProps) {
  if (permissionState === 'checking') {
    return (
      <View style={styles.permissionState}>
        <ActivityIndicator color={colors.indigo} />
        <AppText variant="secondary" tone="soft">
          マイクを確認しています
        </AppText>
      </View>
    );
  }

  if (permissionState === 'denied') {
    return (
      <View style={styles.permissionState}>
        <View style={styles.permissionIcon}>
          <Ionicons name="mic-outline" color={colors.indigo} size={28} />
        </View>
        <View style={styles.permissionCopy}>
          <AppText variant="sectionTitle">声を録音するには</AppText>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            マイクの使用を許可してください。録音した声は、この端末内に保存されます。
          </AppText>
        </View>
        <AppButton
          disabled={isRequestingPermission}
          label={canAskPermissionAgain ? 'マイクを許可する' : '設定を開く'}
          onPress={canAskPermissionAgain ? onRequestPermission : onOpenSettings}
        />
        {error ? (
          <AppText variant="caption" style={styles.error}>
            {error}
          </AppText>
        ) : null}
      </View>
    );
  }

  const meterStrength = Math.min(1, Math.max(0, ((metering ?? -60) + 60) / 60));
  const levels = waveformLevels.map((level, index) =>
    isRecording ? Math.max(5, Math.round(level * (0.55 + meterStrength * ((index % 3) + 1) / 3))) : level
  );
  const progress = isRecording
    ? durationMs / prototypeConfig.recordingMaxMs
    : recording
      ? isPlaying
        ? playbackProgress
        : 1
      : 0;
  const maxSeconds = Math.round(prototypeConfig.recordingMaxMs / 1_000);
  const isIdle = !isRecording && !recording;

  return (
    <View style={styles.panel}>
      {isIdle ? (
        <View style={styles.prompt}>
          <AppText tone="muted" variant="caption">
            今日のおだい
          </AppText>
          <AppText style={styles.centeredText} variant="bodyMedium">
            語尾をのばして録音
          </AppText>
          <View style={styles.hintBubble}>
            <Ionicons color={colors.indigo} name="mic-outline" size={14} />
            <AppText tone="accent" variant="caption">
              Let&apos;s say!!
            </AppText>
          </View>
        </View>
      ) : null}

      <View style={styles.timerRow}>
        {isRecording ? <View style={styles.recDot} /> : null}
        <AppText tone="dark" style={styles.time} variant="displayNumber">
          {formatRecordingDuration(durationMs)}
        </AppText>
      </View>
      <AppText tone="muted" variant="caption">
        最大{maxSeconds}秒
      </AppText>

      <Waveform
        color={isRecording ? colors.warm : colors.indigo}
        height={40}
        levels={levels}
        mutedColor={colors.surfaceSubtle}
        progress={progress}
      />

      {recording && !isRecording ? (
        <Pressable
          accessibilityLabel={isPlaying ? '再生を一時停止' : '録音を再生'}
          accessibilityRole="button"
          disabled={!isPlaybackReady}
          onPress={onTogglePlayback}
          style={({ pressed }) => [
            styles.playButton,
            !isPlaybackReady && styles.disabled,
            pressed && isPlaybackReady && styles.pressed,
          ]}>
          {!isPlaybackReady ? (
            <ActivityIndicator color={colors.textInverse} />
          ) : (
            <Ionicons
              color={colors.textInverse}
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              style={!isPlaying ? styles.playIcon : undefined}
            />
          )}
        </Pressable>
      ) : null}

      <AppText tone="muted" variant="caption">
        {isRecording
          ? '録音しています'
          : recording
            ? !isPlaybackReady
              ? '再生を準備しています'
              : isPlaying
                ? '再生しています'
                : '録音できました'
            : 'タップして録音'}
      </AppText>

      {error ? (
        <AppText variant="caption" style={styles.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  prompt: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  hintBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radii.badge,
    backgroundColor: colors.indigoSoft,
  },
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  recDot: {
    width: 10,
    height: 10,
    borderRadius: radii.avatar,
    backgroundColor: colors.danger,
  },
  time: {
    fontFamily: fonts?.rounded,
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
  disabled: {
    opacity: 0.48,
  },
  pressed: {
    opacity: 0.78,
  },
  centeredText: {
    textAlign: 'center',
  },
  permissionState: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  permissionIcon: {
    width: 64,
    height: 64,
    borderRadius: radii.avatar,
    backgroundColor: colors.indigoSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionCopy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
