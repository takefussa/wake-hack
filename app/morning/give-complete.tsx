import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { colors, radii, spacing } from '@/constants/theme';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile } from '@/types';

export default function GiveCompleteScreen() {
  const params = useLocalSearchParams<{ requestId?: string | string[] }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const [recipient, setRecipient] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isNavigatingRef = useRef(false);

  const completedVoice = givenVoiceMessages.find(
    (voice) =>
      voice.senderId === currentUser?.id &&
      voice.morningRequestId === requestId &&
      typeof voice.receiverId === 'string'
  );

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

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }
  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }
  if (!requestId || !completedVoice) {
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

      {!isLoading && error ? (
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
            <View style={styles.completeIcon}>
              <Ionicons name="checkmark" color={colors.textInverse} size={30} />
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
              <AppText variant="bodyMedium" style={styles.centeredText}>
                {recipient.nickname}さんへ
              </AppText>
              <AppText variant="secondary" tone="soft" style={styles.centeredText}>
                明日の朝、少しだけ力になりますように。
              </AppText>
            </View>
          </View>

          <View style={styles.actions}>
            <AppButton
              icon="people-outline"
              label="もう1人応援する"
              onPress={() =>
                navigateOnce(() => router.replace('/(tabs)/connections'))
              }
              testID="give-another"
            />
            <AppButton
              label="明日の準備へ戻る"
              onPress={() =>
                navigateOnce(() => router.replace('/morning/summary'))
              }
              variant="secondary"
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
    flex: 1,
    minHeight: 420,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
  },
  completeIcon: {
    width: 56,
    height: 56,
    borderRadius: radii.avatar,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  centeredText: {
    textAlign: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  state: {
    flex: 1,
    minHeight: 360,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
