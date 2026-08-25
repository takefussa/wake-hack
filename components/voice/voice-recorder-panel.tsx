import Ionicons from '@expo/vector-icons/Ionicons';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Waveform } from '@/components/common/waveform';
import { prototypeConfig } from '@/constants/config';
import { colors, fonts, radii, spacing } from '@/constants/theme';
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
  isBusy: boolean;
  durationMs: number;
  playbackProgress: number;
  metering?: number;
  error: string | null;
  onRequestPermission: () => void;
  onOpenSettings: () => void;
  onStart: () => void;
  onStop: () => void;
  onTogglePlayback: () => void;
  onReset: () => void;
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
  isBusy,
  durationMs,
  playbackProgress,
  metering,
  error,
  onRequestPermission,
  onOpenSettings,
  onStart,
  onStop,
  onTogglePlayback,
  onReset,
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
  const actionLabel = isRecording
    ? '録音を停止'
    : recording
      ? !isPlaybackReady
        ? '再生を準備中'
        : isPlaying
        ? '再生を一時停止'
        : '録音を再生'
      : '録音を開始';
  const actionIcon = isRecording ? 'stop' : recording ? (isPlaying ? 'pause' : 'play') : 'mic';
  const stateLabel = isRecording
    ? '録音しています'
    : recording
      ? !isPlaybackReady
        ? '再生を準備しています'
        : isPlaying
        ? '再生しています'
        : '録音できました'
      : 'タップして録音';
  const handleAction = isRecording ? onStop : recording ? onTogglePlayback : onStart;

  return (
    <View style={styles.panel}>
      <View style={styles.heading}>
        <AppText variant="caption" tone="lightMuted">
          この人の明日の朝へ
        </AppText>
        <AppText variant="displayNumber" tone="light" style={styles.time}>
          {formatRecordingDuration(durationMs)}
        </AppText>
        <AppText variant="caption" tone="lightMuted">
          最大10秒
        </AppText>
      </View>

      <Waveform
        color={isRecording ? colors.warm : colors.textInverse}
        height={48}
        levels={levels}
        mutedColor={colors.navyRaised}
        progress={progress}
      />

      <View style={styles.controlGroup}>
        <Pressable
          accessibilityLabel={actionLabel}
          accessibilityRole="button"
          disabled={isBusy || (recording !== null && !isPlaybackReady)}
          onPress={handleAction}
          style={({ pressed }) => [
            styles.recordButton,
            isRecording && styles.recordButtonActive,
            (isBusy || (recording !== null && !isPlaybackReady)) &&
              styles.recordButtonDisabled,
            pressed && !isBusy && isPlaybackReady && styles.recordButtonPressed,
          ]}>
          {isBusy || (recording !== null && !isPlaybackReady) ? (
            <ActivityIndicator color={colors.navy} />
          ) : (
            <Ionicons
              color={isRecording ? colors.textInverse : colors.navy}
              name={actionIcon}
              size={30}
              style={actionIcon === 'play' ? styles.playIcon : undefined}
            />
          )}
        </Pressable>
        <AppText variant="secondary" tone="lightMuted">
          {stateLabel}
        </AppText>
      </View>

      {recording && !isRecording ? (
        <Pressable
          accessibilityLabel="録り直す"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onReset}
          style={({ pressed }) => [styles.retakeButton, pressed && styles.retakeButtonPressed]}>
          <Ionicons color={colors.textInverseSecondary} name="refresh" size={18} />
          <AppText variant="secondary" tone="lightMuted">
            録り直す
          </AppText>
        </Pressable>
      ) : null}

      {error ? (
        <AppText variant="caption" style={styles.errorLight}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.navy,
    gap: spacing.xl,
  },
  heading: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    fontFamily: fonts?.rounded,
  },
  controlGroup: {
    alignItems: 'center',
    gap: spacing.md,
  },
  recordButton: {
    width: 76,
    height: 76,
    borderRadius: radii.avatar,
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  recordButtonActive: {
    backgroundColor: colors.warm,
  },
  recordButtonDisabled: {
    opacity: 0.62,
  },
  recordButtonPressed: {
    transform: [{ scale: 0.96 }],
  },
  playIcon: {
    marginLeft: spacing.xs,
  },
  retakeButton: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  retakeButtonPressed: {
    opacity: 0.68,
  },
  permissionState: {
    minHeight: 330,
    padding: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
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
  centeredText: {
    maxWidth: 300,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  errorLight: {
    color: colors.warmSoft,
    textAlign: 'center',
  },
});
