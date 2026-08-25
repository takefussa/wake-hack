import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Linking, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { RecordingRecipient } from '@/components/voice/recording-recipient';
import { VoiceRecorderPanel } from '@/components/voice/voice-recorder-panel';
import { prototypeConfig } from '@/constants/config';
import { colors, spacing } from '@/constants/theme';
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
  const isSendingRef = useRef(false);
  const isLeavingRef = useRef(false);

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
  const hasAlreadyGiven = recipient !== null && currentGiveReceiverIds.includes(recipient.id);
  const isTooShort =
    recorder.recording !== null &&
    recorder.recording.durationMs < prototypeConfig.recordingMinMs;

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
    router.back();
  }

  async function handleSend() {
    if (
      !request ||
      !recipient ||
      !recorder.recording ||
      isTooShort ||
      isSendingRef.current ||
      hasAlreadyGiven
    ) {
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
        uri: recorder.recording.uri,
        durationMs: recorder.recording.durationMs,
      });
      completeGive(voiceMessage);
      router.replace({
        pathname: '/morning/give-complete',
        params: { requestId: request.id },
      });
    } catch {
      setPageError('声を届けられませんでした。もう一度お試しください。');
      isSendingRef.current = false;
      setIsSending(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="record-voice-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="長く考えなくて大丈夫です。今のあなたの声を、短く届けます。"
        onBack={() => void handleBack()}
        title="声を届ける"
      />

      {isLoading ? <LoadingState label="相手の朝を確認しています" /> : null}

      {!isLoading && (pageError || hasAlreadyGiven) && (!request || !recipient || hasAlreadyGiven) ? (
        <View style={styles.state}>
          <AppText variant="bodyMedium">
            {hasAlreadyGiven ? 'この人には、すでに声を届けています。' : pageError}
          </AppText>
          <AppButton label="一覧に戻る" onPress={() => router.back()} variant="secondary" />
        </View>
      ) : null}

      {!isLoading && request && recipient && !hasAlreadyGiven ? (
        <>
          <RecordingRecipient request={request} user={recipient} />
          <VoiceRecorderPanel
            canAskPermissionAgain={recorder.canAskPermissionAgain}
            durationMs={recorder.durationMs}
            error={recorder.error}
            isBusy={recorder.isBusy}
            isPlaying={recorder.isPlaying}
            isPlaybackReady={recorder.isPlaybackReady}
            isRecording={recorder.isRecording}
            isRequestingPermission={recorder.isRequestingPermission}
            metering={recorder.metering}
            onOpenSettings={() => void handleOpenSettings()}
            onRequestPermission={() => void recorder.requestPermission()}
            onReset={recorder.resetRecording}
            onStart={() => void recorder.startRecording()}
            onStop={() => void recorder.stopRecording()}
            onTogglePlayback={() => void recorder.togglePlayback()}
            permissionState={recorder.permissionState}
            playbackProgress={recorder.playbackProgress}
            recording={recorder.recording}
          />

          {pageError ? (
            <AppText variant="secondary" style={styles.error}>
              {pageError}
            </AppText>
          ) : null}

          {recorder.recording ? (
            <View style={styles.sendSection}>
              {isTooShort ? (
                <AppText variant="caption" tone="muted" style={styles.sendNote}>
                  2秒以上録音すると送信できます
                </AppText>
              ) : null}
              <AppButton
                disabled={isTooShort || isSending}
                icon="paper-plane-outline"
                label={isSending ? '届けています…' : 'この声を届ける'}
                onPress={() => void handleSend()}
                testID="send-personal-voice"
              />
            </View>
          ) : null}
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  sendSection: {
    gap: spacing.md,
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
});
