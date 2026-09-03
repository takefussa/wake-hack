import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { File, Paths } from 'expo-file-system';
import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { onboardingRoute } from '@/features/navigation/onboarding-route';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { BoomboxRecorder } from '@/components/voice/boombox-recorder';
import { MicrophonePermissionGate } from '@/components/voice/microphone-permission-gate';
import { prototypeConfig } from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { formatRecordingDuration } from '@/features/voice/format-duration';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useAppStore } from '@/store/use-app-store';
import type { VoiceStyle } from '@/types';

export default function CommunityRecordScreen() {
  const params = useLocalSearchParams<{ voiceStyle?: string | string[] }>();
  const style = (Array.isArray(params.voiceStyle) ? params.voiceStyle[0] : params.voiceStyle) as VoiceStyle;
  const currentUser = useAppStore((state) => state.currentUser);
  const addCommunityVoice = useAppStore((state) => state.addCommunityVoice);
  const recorder = useVoiceRecorder();
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [displayDurationMs, setDisplayDurationMs] = useState(0);
  const sending = useRef(false);

  useEffect(() => {
    if (recorder.isRecording) {
      setDisplayDurationMs(recorder.durationMs);
    } else if (!recorder.recording) {
      setDisplayDurationMs(0);
    }
  }, [recorder.isRecording, recorder.durationMs, recorder.recording]);

  if (!currentUser) return <Redirect href={onboardingRoute} />;
  const user = currentUser;

  const isTooShort =
    recorder.recording !== null &&
    recorder.recording.durationMs < prototypeConfig.recordingMinMs;
  const stateLabel = recorder.isRecording
    ? '録音しています'
    : recorder.recording
      ? !recorder.isPlaybackReady
        ? '再生を準備しています'
        : recorder.isPlaying
          ? '再生しています'
          : '録音できました'
      : null;

  function handleRetakeFromBoombox() {
    recorder.resetRecording();
    void recorder.startRecording();
  }

  async function handleOpenSettings() {
    setError(null);
    try {
      await Linking.openSettings();
    } catch {
      setError('設定を開けませんでした。端末の設定からマイクを許可してください。');
    }
  }

  async function save() {
    if (!recorder.recording || isTooShort || sending.current) {
      setError('2秒以上録音してください。');
      return;
    }
    sending.current = true;
    setIsSending(true);
    setError(null);
    let voiceUri = recorder.recording.uri;
    try {
      const source = new File(voiceUri);
      if (source.exists) {
        const destination = new File(Paths.document, `community-${Date.now()}-${user.id}.wav`);
        source.copy(destination);
        voiceUri = destination.uri;
      }
    } catch {
      // Keep the recorder URI if the device cannot copy the file.
    }
    addCommunityVoice({
      id: `community-${Date.now()}-${user.id}`,
      senderId: user.id,
      uri: voiceUri,
      durationMs: recorder.recording.durationMs,
      type: 'community',
      voiceStyle: style,
      createdAt: new Date().toISOString(),
    });
    router.replace('/(tabs)/connections');
  }

  return (
    <Screen contentStyle={styles.screenContent} scroll={false} testID="community-record-screen">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}>
        <ScreenHeader
          onBack={() => void recorder.leaveRecording().then(() => router.back())}
          title="コミュニティボイスを録る"
          description={`${style || 'あなたらしい'}声で、みんなの朝へ届けます。`}
        />

        {recorder.permissionState !== 'granted' ? (
          <MicrophonePermissionGate
            canAskPermissionAgain={recorder.canAskPermissionAgain}
            error={recorder.error}
            isRequestingPermission={recorder.isRequestingPermission}
            onOpenSettings={() => void handleOpenSettings()}
            onRequestPermission={() => void recorder.requestPermission()}
            permissionState={recorder.permissionState}
          />
        ) : (
          <>
            <View style={styles.statusCard}>
              <AppText variant="caption" tone="muted">
                みんなの明日の朝へ
              </AppText>
              <AppText variant="displayNumber" style={styles.time}>
                {formatRecordingDuration(displayDurationMs)}
              </AppText>
              <AppText variant="caption" tone="muted">
                最大10秒
              </AppText>
              <AppText
                variant="secondary"
                tone="soft"
                style={[styles.stateLabel, !stateLabel && styles.hiddenLabel]}
              >
                {stateLabel ?? ' '}
              </AppText>
            </View>

            <View style={styles.actionArea}>
              {recorder.recording ? (
                <View style={styles.sendSection}>
                  <AppText
                    variant="caption"
                    tone="muted"
                    style={[styles.sendNote, !isTooShort && styles.hiddenLabel]}
                  >
                    2秒以上録音すると送信できます
                  </AppText>
                  <AppButton
                    disabled={isSending || isTooShort}
                    icon="paper-plane-outline"
                    label={
                      isSending
                        ? '届けています…'
                        : isTooShort
                          ? '2秒以上録音してください'
                          : 'コミュニティへ届ける'
                    }
                    onPress={() => void save()}
                    testID="send-community-voice"
                  />
                </View>
              ) : (
                <AppText variant="secondary" tone="soft" style={styles.description}>
                  長く考えなくて大丈夫です。今のあなたの声を、短く届けます。
                </AppText>
              )}
            </View>
          </>
        )}

        {error ? (
          <AppText variant="secondary" style={styles.error}>
            {error}
          </AppText>
        ) : null}

        {recorder.permissionState === 'granted' ? (
          <View style={styles.dock}>
            <BoomboxRecorder
              disabled={recorder.isBusy}
              durationMs={displayDurationMs}
              hasRecording={recorder.recording !== null}
              isPlaying={recorder.isPlaying}
              playbackProgress={recorder.playbackProgress}
              isRecording={recorder.isRecording}
              onRetake={handleRetakeFromBoombox}
              onStart={() => void recorder.startRecording()}
              onStop={() => void recorder.stopRecording()}
              onTogglePlayback={() => void recorder.togglePlayback()}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screenContent: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  statusCard: {
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.xs,
  },
  time: {
    marginTop: spacing.xs,
  },
  stateLabel: {
    marginTop: spacing.sm,
  },
  hiddenLabel: {
    opacity: 0,
  },
  actionArea: {
    minHeight: 84,
    justifyContent: 'flex-start',
  },
  description: {
    textAlign: 'center',
  },
  sendSection: {
    gap: spacing.sm,
  },
  sendNote: {
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  dock: {
    marginTop: -spacing.lg,
    marginHorizontal: -spacing.xl,
    paddingBottom: spacing.sm,
  },
});
