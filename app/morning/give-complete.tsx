import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { onboardingRoute } from '@/features/navigation/onboarding-route';
import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { paperColors, shadows, spacing } from '@/constants/theme';
import { isSupabaseUuid } from '@/lib/identifiers';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { voiceService } from '@/services/voice-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile } from '@/types';

export default function GiveCompleteScreen() {
  const params = useLocalSearchParams<{
    requestId?: string | string[];
    preview?: string | string[];
  }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const preview = Array.isArray(params.preview) ? params.preview[0] : params.preview;
  const isPreview = preview === '1';
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const completedVoice = givenVoiceMessages.find(
    (voice) =>
      voice.senderId === currentUser?.id &&
      voice.morningRequestId === requestId &&
      typeof voice.receiverId === 'string'
  );
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [alarmReceivedAt, setAlarmReceivedAt] = useState<string | null>(
    completedVoice?.alarmReceivedAt ?? null
  );
  const isNavigatingRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function loadRecipient() {
      try {
        const request = requestId ? await morningRequestService.getRequest(requestId) : null;
        const nextRecipient = request ? await profileService.getProfile(request.userId) : null;
        if (!isMounted) return;

        if (!nextRecipient) {
          setError('相手の情報を読み込めませんでした。');
          return;
        }
        setError(null);
        setRecipient(nextRecipient);
      } catch {
        if (isMounted) {
          setError('相手の情報を読み込めませんでした。');
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
    if (!completedVoice || !isSupabaseUuid(completedVoice.id)) return;

    const voiceMessageId = completedVoice.id;
    let isMounted = true;
    async function refreshDelivery() {
      try {
        const receivedAt = await voiceService.getAlarmReceivedAt(
          voiceMessageId
        );
        if (isMounted) setAlarmReceivedAt(receivedAt);
      } catch {
        // Keep showing "waiting" if the device is temporarily offline. This
        // status is refreshed without Push whenever B leaves this screen open.
      }
    }

    void refreshDelivery();
    const interval = setInterval(() => void refreshDelivery(), 5_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [completedVoice]);

  if (!currentUser) {
    return <Redirect href={onboardingRoute} />;
  }
  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }
  if (!requestId || (!completedVoice && !isPreview)) {
    return <Redirect href="/(tabs)/connections" />;
  }

  function navigateOnce(action: () => void) {
    if (isNavigatingRef.current) return;
    isNavigatingRef.current = true;
    action();
  }

  return (
    <Screen contentStyle={styles.content} testID="give-complete-screen">
      <StatusBar style="dark" />

      {isLoading ? <LoadingState label="声を届けています" /> : null}

      {!isLoading && error && !recipient ? (
        <View style={styles.state}>
          <AppText variant="bodyMedium">{error}</AppText>
          <AppButton
            label="明日の準備へ戻る"
            onPress={() =>
              navigateOnce(() => router.replace('/morning/summary'))
            }
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && recipient ? (
        <>
          <View style={styles.hero}>
            <View pointerEvents="none" style={styles.heroTape} />
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark" color={paperColors.ink} size={30} />
            </View>
            <Avatar
              avatarId={recipient.avatarId}
              imageUri={recipient.profileImageUri}
              name={recipient.nickname}
              size={72}
            />
            <View style={styles.copy}>
              <AppText variant="screenTitle" style={styles.centeredText}>
                声を届けました
              </AppText>
              <View pointerEvents="none" style={styles.titleUnderline} />
              <AppText variant="bodyMedium" style={styles.centeredText}>
                {recipient.nickname}さんへ
              </AppText>
              <AppText variant="secondary" tone="soft" style={styles.centeredText}>
                明日の朝、少しだけ力になりますように。
              </AppText>
            </View>

            <View
              style={[
                styles.deliveryStatus,
                alarmReceivedAt && styles.deliveryStatusReceived,
              ]}
              testID="personal-voice-delivery-status"
            >
              <Ionicons
                color={paperColors.ink}
                name={alarmReceivedAt ? 'checkmark-circle' : 'time-outline'}
                size={21}
              />
              <View style={styles.deliveryCopy}>
                <AppText variant="bodyMedium">
                  {alarmReceivedAt
                    ? `${recipient.nickname}さんに届きました`
                    : `${recipient.nickname}さんの受け取り待ち`}
                </AppText>
                <AppText variant="secondary" tone="soft">
                  {alarmReceivedAt
                    ? 'Wake Voiceの保存とアラーム設定が完了しています。'
                    : '相手がアプリを開くと自動で受け取ります。'}
                </AppText>
              </View>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              buttonColor={paperColors.salmon}
              contentColor={paperColors.ink}
              icon="people-outline"
              label="もう1人応援する"
              onPress={() =>
                navigateOnce(() => router.replace('/(tabs)/connections'))
              }
              style={styles.primaryButton}
              testID="give-another"
            />
            <AppButton
              buttonColor={paperColors.base}
              contentColor={paperColors.ink}
              label="明日の準備へ戻る"
              onPress={() =>
                navigateOnce(() => router.replace('/morning/summary'))
              }
              style={styles.secondaryButton}
            />
          </View>
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: '100%',
    justifyContent: 'space-between',
    gap: spacing.xxxl,
  },
  hero: {
    position: 'relative',
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    ...shadows.paper,
  },
  heroTape: {
    position: 'absolute',
    zIndex: 2,
    top: -11,
    left: '39%',
    width: 82,
    height: 22,
    backgroundColor: paperColors.tape,
    transform: [{ rotate: '1deg' }],
  },
  completeIcon: {
    width: 56,
    height: 56,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 28,
    backgroundColor: paperColors.olive,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleUnderline: {
    width: 190,
    height: 5,
    borderRadius: 3,
    backgroundColor: paperColors.ruleBlue,
    transform: [{ rotate: '-1deg' }],
  },
  deliveryStatus: {
    width: '100%',
    maxWidth: 420,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 10,
    backgroundColor: paperColors.noteBlue,
  },
  deliveryStatusReceived: {
    backgroundColor: paperColors.olive,
  },
  deliveryCopy: {
    flex: 1,
    gap: 2,
  },
  centeredText: {
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  primaryButton: {
    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },
  secondaryButton: {
    borderWidth: 2,
    borderColor: paperColors.ink,
  },
  state: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 16,
    backgroundColor: paperColors.base,
    ...shadows.paper,
  },
});
