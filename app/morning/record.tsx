import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { BoomboxRecorder } from '@/components/voice/boombox-recorder';
import { MicrophonePermissionGate } from '@/components/voice/microphone-permission-gate';
import { RecordingRecipient } from '@/components/voice/recording-recipient';
import { prototypeConfig } from '@/constants/config';
import { colors, fonts, paperColors, shadows, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { formatRecordingDuration } from '@/features/voice/format-duration';
import { logDevelopmentError } from '@/lib/development-logger';
import { giveService } from '@/services/give-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useVoiceRecorder } from '@/hooks/use-voice-recorder';
import { useAppStore } from '@/store/use-app-store';
import type { MorningRequest, UserProfile } from '@/types';

export default function RecordVoiceScreen() {
  const params = useLocalSearchParams<{ requestId?: string | string[] }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const currentGiveReceiverIds = useAppStore((state) => state.currentGiveReceiverIds);
  const completeGive = useAppStore((state) => state.completeGive);
  const recorder = useVoiceRecorder();
  const [request, setRequest] = useState<MorningRequest | null>(null);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [displayDurationMs, setDisplayDurationMs] = useState(0);
  const isSendingRef = useRef(false);
  const isLeavingRef = useRef(false);

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

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  const currentUserId = currentUser.id;
  const currentMorningRequestId = currentMorningRequest.id;
  const hasAlreadyGiven = recipient !== null && currentGiveReceiverIds.includes(recipient.id);
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
                    <View pointerEvents="none" style={styles.blueTape} />
                    <AppText variant="caption" tone="muted">
                      この人の明日の朝へ
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
                      </View>
                    ) : (
                      <AppText variant="secondary" tone="soft" style={styles.description}>
                        長く考えなくて大丈夫です。今のあなたの声を、短く届けます。
                      </AppText>
                    )}
                  </View>
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
    alignItems: 'flex-start',
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
    position: 'relative',
    padding: spacing.lg,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: paperColors.cardGray,
    alignItems: 'center',
    gap: spacing.xs,
    ...shadows.paper,
  },
  blueTape: {
    position: 'absolute',
    top: -12,
    left: '36%',
    right: '36%',
    zIndex: 2,
    height: 23,
    backgroundColor: paperColors.tape,
    transform: [{ rotate: '1deg' }],
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
    padding: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    justifyContent: 'flex-start',
    ...shadows.paper,
  },
  description: {
    textAlign: 'center',
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
