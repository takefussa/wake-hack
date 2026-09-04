import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { BoomboxRecorder } from '@/components/voice/boombox-recorder';
import { MicrophonePermissionGate } from '@/components/voice/microphone-permission-gate';
import { RecordingRecipient } from '@/components/voice/recording-recipient';
import { VoiceExampleCard } from '@/components/voice/voice-example-card';
import { prototypeConfig } from '@/constants/config';
import { colors, fonts, paperColors, shadows, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { formatRecordingDuration } from '@/features/voice/format-duration';
import { logDevelopmentError } from '@/lib/development-logger';
import { giveService } from '@/services/give-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { voiceExampleService } from '@/services/voice-example-service';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useAppStore } from '@/store/use-app-store';
import type { MorningRequest, UserProfile } from '@/types';

export default function RecordVoiceScreen() {
  const params = useLocalSearchParams<{ requestId?: string | string[] }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const completeGive = useAppStore((state) => state.completeGive);
  const recorder = useVoiceRecorder();
  const [request, setRequest] = useState<MorningRequest | null>(null);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [displayDurationMs, setDisplayDurationMs] = useState(0);
  const [voiceExample, setVoiceExample] = useState<string[] | null>(null);
  const [isExampleLoading, setIsExampleLoading] = useState(false);
  const [hasExampleError, setHasExampleError] = useState(false);
  const isSendingRef = useRef(false);
  const isLeavingRef = useRef(false);
  const exampleGenerationRef = useRef(0);

  useEffect(() => {
    if (recorder.isRecording) {
      setDisplayDurationMs(recorder.durationMs);
    } else if (!recorder.recording) {
      setDisplayDurationMs(0);
    }
  }, [recorder.isRecording, recorder.durationMs, recorder.recording]);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipient() {
      if (!requestId) {
        setPageError('朝リクエストが見つかりませんでした。');
        setIsLoading(false);
        return;
      }

      try {
        const nextRequest = await morningRequestService.getRequest(requestId);
        const nextRecipient = nextRequest
          ? await profileService.getProfile(nextRequest.userId)
          : null;
        if (!isMounted) return;

        if (!nextRequest || !nextRecipient) {
          setPageError('朝リクエストが見つかりませんでした。');
          return;
        }

        setRequest(nextRequest);
        setRecipient(nextRecipient);
      } catch {
        if (isMounted) {
          setPageError('相手の情報を読み込めませんでした。');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadRecipient();
    return () => {
      isMounted = false;
    };
  }, [requestId]);

  useEffect(() => {
    if (!request || !recipient) return;

    const generationId = exampleGenerationRef.current + 1;
    exampleGenerationRef.current = generationId;
    setIsExampleLoading(true);
    setHasExampleError(false);

    void voiceExampleService
      .generate({ recipient, request })
      .then((lines) => {
        if (exampleGenerationRef.current === generationId) {
          setVoiceExample(lines);
        }
      })
      .catch(() => {
        if (exampleGenerationRef.current === generationId) {
          setHasExampleError(true);
        }
      })
      .finally(() => {
        if (exampleGenerationRef.current === generationId) {
          setIsExampleLoading(false);
        }
      });
  }, [recipient, request]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  const currentUserId = currentUser.id;
  const currentMorningRequestId = currentMorningRequest.id;
  // A recipient can be selected again for a new morning request. The old
  // receiver-id list is only a session shortcut and may contain yesterday's
  // deliveries, so deduplicate by the actual target request and sender.
  const hasAlreadyGiven =
    request !== null &&
    recipient !== null &&
    givenVoiceMessages.some(
      (voice) =>
        voice.type === 'personal' &&
        voice.senderId === currentUserId &&
        voice.receiverId === recipient.id &&
        voice.morningRequestId === request.id
    );
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
    setPageError(null);
    try {
      await Linking.openSettings();
    } catch {
      setPageError('設定を開けませんでした。端末の設定からマイクを許可してください。');
    }
  }

  async function handleBack() {
    if (isLeavingRef.current || isSendingRef.current) return;

    isLeavingRef.current = true;
    await recorder.leaveRecording();
    goBackOrReplace('/(tabs)/connections');
  }

  async function handleGenerateExample() {
    if (!request || !recipient || isExampleLoading) return;

    const generationId = exampleGenerationRef.current + 1;
    exampleGenerationRef.current = generationId;
    setIsExampleLoading(true);
    setHasExampleError(false);

    try {
      const lines = await voiceExampleService.generate({ recipient, request });
      if (exampleGenerationRef.current === generationId) {
        setVoiceExample(lines);
      }
    } catch {
      if (exampleGenerationRef.current === generationId) {
        setHasExampleError(true);
      }
    } finally {
      if (exampleGenerationRef.current === generationId) {
        setIsExampleLoading(false);
      }
    }
  }

  async function handleSkip() {
    if (isLeavingRef.current || isSendingRef.current || !requestId) return;

    isLeavingRef.current = true;
    await recorder.leaveRecording();
    router.replace({
      pathname: '/morning/give-complete',
      params: { requestId, preview: '1' },
    });
  }

  async function handleSend() {
    if (recorder.recording && isTooShort) {
      setPageError('声は2秒以上必要です。もう一度、少し長めに録音してください。');
      return;
    }

    if (isSendingRef.current || hasAlreadyGiven) {
      return;
    }
    if (!request || !recipient || !recorder.recording) {
      setPageError('相手の情報を確認できませんでした。画面を開き直してお試しください。');
      return;
    }

    isSendingRef.current = true;
    setIsSending(true);
    setPageError(null);

    try {
      const voiceMessage = await giveService.sendPersonalVoice({
        senderId: currentUserId,
        receiverId: recipient.id,
        morningRequestId: request.id,
        senderMorningRequestId: currentMorningRequestId,
        uri: recorder.recording.uri,
        durationMs: recorder.recording.durationMs,
      });
      if (!completeGive(voiceMessage)) {
        throw new Error('Give state could not be completed');
      }
      router.replace({
        pathname: '/morning/give-complete',
        params: { requestId: request.id },
      });
    } catch (error) {
      logDevelopmentError('morningRecord.send', error);
      setPageError(
        'Voiceを送信できませんでした。相手が気持ちよく朝を迎えられる内容に変更して、もう一度お試しください。'
      );
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  return (
    <Screen contentStyle={styles.screenContent} scroll={false} testID="record-voice-screen">
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scrollArea}>
          <View style={styles.navigation}>
            <IconButton
              icon="chevron-back"
              label="この人の明日の朝へ戻る"
              onPress={() => void handleBack()}
            />
            <Pressable
              accessibilityLabel="声の送信をスキップして次へ"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => void handleSkip()}
              style={({ pressed }) => [
                styles.skipButton,
                pressed && styles.skipButtonPressed,
              ]}
            >
              <AppText style={styles.skipText}>スキップ</AppText>
              <View pointerEvents="none" style={styles.skipUnderline} />
            </Pressable>
          </View>

          <View style={styles.heading}>
            <AppText style={styles.title}>声を届ける</AppText>
            <View pointerEvents="none" style={styles.titleUnderline} />
          </View>

          {isLoading ? <LoadingState label="相手の朝を確認しています" /> : null}

          {!isLoading &&
          (pageError || hasAlreadyGiven) &&
          (!request || !recipient || hasAlreadyGiven) ? (
            <View style={styles.state}>
              <AppText variant="bodyMedium">
                {hasAlreadyGiven ? 'この人には、すでに声を届けています。' : pageError}
              </AppText>
              <AppButton
                label="一覧に戻る"
                onPress={() => goBackOrReplace('/(tabs)/connections')}
                variant="secondary"
              />
            </View>
          ) : null}

          {!isLoading && request && recipient && !hasAlreadyGiven ? (
            <>
              <RecordingRecipient request={request} user={recipient} />

              <VoiceExampleCard
                error={hasExampleError}
                isLoading={isExampleLoading}
                lines={voiceExample}
                onRegenerate={() => void handleGenerateExample()}
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
                  {!recorder.recording ? (
                    <View style={styles.statusCard}>
                      <View style={styles.statusTimeBlock}>
                        <AppText variant="caption" tone="muted">
                          録音時間
                        </AppText>
                        <AppText variant="displayNumber" style={styles.statusTime}>
                          {formatRecordingDuration(displayDurationMs)}
                        </AppText>
                      </View>
                      <View style={styles.statusCopy}>
                        <AppText variant="caption" tone="muted">
                          最大10秒
                        </AppText>
                        <AppText variant="secondary" tone="soft" style={styles.statusLabel}>
                          {stateLabel ?? '録音前'}
                        </AppText>
                      </View>
                    </View>
                  ) : null}

                  {recorder.recording ? (
                    <View style={styles.actionArea}>
                      <View style={styles.sendSection}>
                        {isTooShort ? (
                          <AppText variant="caption" tone="muted" style={styles.sendNote}>
                            2秒以上録音すると送信できます
                          </AppText>
                        ) : null}
                        <AppButton
                          buttonColor={paperColors.salmon}
                          contentColor={paperColors.ink}
                          disabled={isSending}
                          icon="paper-plane-outline"
                          label={
                            isSending
                              ? 'Voiceを確認しています...'
                              : isTooShort
                                ? '2秒以上録音してください'
                                : 'この声を届ける'
                          }
                          onPress={() => void handleSend()}
                          style={styles.sendButton}
                          testID="send-personal-voice"
                        />
                        <AppText variant="secondary" tone="soft" style={styles.recordingComplete}>
                          {stateLabel ?? '録音できました'}
                        </AppText>
                      </View>
                    </View>
                  ) : null}
                </>
              )}

              {pageError ? (
                <AppText variant="secondary" style={styles.error}>
                  {pageError}
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
            </>
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
    gap: spacing.lg,
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  skipButton: {
    minHeight: 44,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonPressed: {
    opacity: 0.6,
  },
  skipText: {
    color: paperColors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  skipUnderline: {
    width: 54,
    height: 3,
    marginTop: 1,
    borderRadius: 2,
    backgroundColor: paperColors.ruleBlue,
    transform: [{ rotate: '-2deg' }],
  },
  heading: {
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: fonts?.handwritten,
    color: paperColors.ink,
    fontSize: 36,
    lineHeight: 44,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 180,
    height: 7,
    marginTop: spacing.xs,
    borderRadius: 4,
    backgroundColor: paperColors.ruleBlue,
    opacity: 0.8,
    transform: [{ rotate: '-1deg' }],
  },
  statusCard: {
    minHeight: 76,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 16,
    backgroundColor: paperColors.cardGray,
    ...shadows.paper,
  },
  statusTimeBlock: {
    alignItems: 'center',
  },
  statusTime: {
    fontSize: 30,
    lineHeight: 34,
  },
  statusCopy: {
    minWidth: 104,
    gap: 3,
  },
  statusLabel: {
    fontSize: 14,
    lineHeight: 20,
  },
  actionArea: {
    minHeight: 84,
    padding: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    justifyContent: 'flex-start',
    ...shadows.paper,
  },
  sendSection: {
    gap: spacing.sm,
  },
  sendButton: {
    borderWidth: 2,
    borderColor: paperColors.ink,
  },
  sendNote: {
    textAlign: 'center',
  },
  recordingComplete: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  state: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  dock: {
    marginTop: -spacing.lg,
    marginHorizontal: -spacing.xl,
    paddingBottom: spacing.sm,
  },
});
