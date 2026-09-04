import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { WakeStyleSelector } from '@/components/community-voice/wake-style-selector';
import { BoomboxRecorder } from '@/components/voice/boombox-recorder';
import { MicrophonePermissionGate } from '@/components/voice/microphone-permission-gate';
import { isWakeStyle } from '@/constants/community-voice';
import { prototypeConfig } from '@/constants/config';
import { legacyColors as colors, spacing } from '@/constants/theme';
import { formatRecordingDuration } from '@/features/voice/format-duration';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { communityVoiceService } from '@/services/community-voice-service';
import { useAppStore } from '@/store/use-app-store';
import type { WakeStyle } from '@/types';

export default function CommunityVoiceCreateScreen() {
  const params = useLocalSearchParams<{ wakeStyle?: string | string[] }>();
  const paramWakeStyle = Array.isArray(params.wakeStyle)
    ? params.wakeStyle[0]
    : params.wakeStyle;
  const initialWakeStyle: WakeStyle = isWakeStyle(paramWakeStyle ?? '')
    ? (paramWakeStyle as WakeStyle)
    : 'cheerful';
  const currentUser = useAppStore((state) => state.currentUser);
  const recorder = useVoiceRecorder();
  const leaveRecording = recorder.leaveRecording;
  const [wakeStyle, setWakeStyle] = useState<WakeStyle>(initialWakeStyle);
  const [displayDurationMs, setDisplayDurationMs] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    if (recorder.isRecording) {
      setDisplayDurationMs(recorder.durationMs);
    } else if (!recorder.recording) {
      setDisplayDurationMs(0);
    }
  }, [recorder.durationMs, recorder.isRecording, recorder.recording]);

  useEffect(() => () => {
    void leaveRecording();
  }, [leaveRecording]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  async function handleSubmit() {
    if (!currentUser || !recorder.recording || isSubmittingRef.current) return;
    if (recorder.recording.durationMs < prototypeConfig.recordingMinMs) {
      setSubmitError('2秒以上録音すると投稿できます。もう一度、少し長めに録音してください。');
      return;
    }

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await communityVoiceService.create({
        senderId: currentUser.id,
        uri: recorder.recording.uri,
        durationMs: recorder.recording.durationMs,
        wakeStyle,
      });
      recorder.resetRecording();
      router.replace('/community-voice/history');
    } catch {
      setSubmitError(
        'Voiceを投稿できませんでした。みんなが気持ちよく朝を迎えられる内容に変更して、もう一度お試しください。'
      );
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <Screen testID="community-voice-create-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="あなたの声を、みんなの朝へ。起こされ方を選んでから録音します。"
        onBack={() => router.replace('/(tabs)/connections')}
        stepLabel="Community Voice"
        title="みんなを起こす"
      />

      <View style={styles.section}>
        <AppText variant="sectionTitle">起こし方</AppText>
        <WakeStyleSelector selected={wakeStyle} onSelect={setWakeStyle} />
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">録音</AppText>
        {recorder.permissionState !== 'granted' ? (
          <MicrophonePermissionGate
            canAskPermissionAgain={recorder.canAskPermissionAgain}
            error={recorder.error}
            isRequestingPermission={recorder.isRequestingPermission}
            onOpenSettings={() => void Linking.openSettings()}
            onRequestPermission={() => void recorder.requestPermission()}
            permissionState={recorder.permissionState}
          />
        ) : (
          <View style={styles.recordingPanel}>
            <View style={styles.statusCard}>
              <AppText variant="caption" tone="muted">
                録音時間
              </AppText>
              <AppText variant="displayNumber">
                {formatRecordingDuration(displayDurationMs)}
              </AppText>
              <AppText variant="caption" tone="muted">
                最大10秒
              </AppText>
            </View>
            <BoomboxRecorder
              disabled={recorder.isBusy || isSubmitting}
              durationMs={displayDurationMs}
              hasRecording={recorder.recording !== null}
              isPlaying={recorder.isPlaying}
              isRecording={recorder.isRecording}
              onRetake={() => {
                recorder.resetRecording();
                void recorder.startRecording();
              }}
              onStart={() => void recorder.startRecording()}
              onStop={() => void recorder.stopRecording()}
              onTogglePlayback={() => void recorder.togglePlayback()}
              playbackProgress={recorder.playbackProgress}
            />
            {recorder.error ? (
              <AppText variant="caption" style={styles.error}>
                {recorder.error}
              </AppText>
            ) : null}
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {submitError ? (
          <AppText variant="secondary" style={styles.error}>
            {submitError}
          </AppText>
        ) : null}
        <AppButton
          disabled={!recorder.recording || recorder.isRecording || isSubmitting}
          icon="send-outline"
          label={isSubmitting ? 'Voiceを確認しています...' : '投稿する'}
          legacy
          onPress={() => void handleSubmit()}
          testID="submit-community-voice"
          variant="warm"
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  recordingPanel: {
    gap: spacing.lg,
  },
  statusCard: {
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  footer: {
    gap: spacing.md,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
