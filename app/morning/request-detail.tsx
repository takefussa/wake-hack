import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useTapLock } from '@/hooks/use-tap-lock';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { MorningRequest, UserProfile } from '@/types';

type DetailRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

function DetailRow({ label, value, last = false }: DetailRowProps) {
  return (
    <View style={[styles.detailRow, !last && styles.detailRowBorder]}>
      <AppText variant="caption" tone="muted" style={styles.detailLabel}>
        {label}
      </AppText>
      <AppText variant="bodyMedium" style={styles.detailValue}>
        {value}
      </AppText>
    </View>
  );
}

export default function RequestDetailScreen() {
  const params = useLocalSearchParams<{ requestId?: string | string[] }>();
  const requestId = Array.isArray(params.requestId) ? params.requestId[0] : params.requestId;
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const currentGiveReceiverIds = useAppStore((state) => state.currentGiveReceiverIds);
  const selectGiveRequest = useAppStore((state) => state.selectGiveRequest);
  const [request, setRequest] = useState<MorningRequest | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const runOnce = useTapLock();

  useEffect(() => {
    let isMounted = true;

    async function loadDetail() {
      if (!requestId) {
        setError('朝リクエストが見つかりませんでした。');
        setIsLoading(false);
        return;
      }

      try {
        const nextRequest = await morningRequestService.getRequest(requestId);
        const nextUser = nextRequest ? await profileService.getProfile(nextRequest.userId) : null;

        if (!isMounted) return;
        if (!nextRequest || !nextUser) {
          setError('朝リクエストが見つかりませんでした。');
          return;
        }

        setRequest(nextRequest);
        setUser(nextUser);
      } catch {
        if (isMounted) {
          setError('朝リクエストを読み込めませんでした。');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadDetail();
    return () => {
      isMounted = false;
    };
  }, [requestId]);

  const hasAlreadyGiven = user !== null && currentGiveReceiverIds.includes(user.id);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }
  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  function handleStartRecording() {
    if (!request || hasAlreadyGiven) return;
    runOnce(() => {
      selectGiveRequest(request.id);
      router.push({
        pathname: '/morning/record',
        params: { requestId: request.id },
      });
    });
  }

  return (
    <Screen contentStyle={styles.content} testID="request-detail-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        onBack={() => goBackOrReplace('/(tabs)/connections')}
        title="この人の明日の朝へ"
      />

      {isLoading ? <LoadingState label="朝の様子を読み込んでいます" /> : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <AppText variant="bodyMedium">{error}</AppText>
          <AppButton
            label="一覧に戻る"
            onPress={() => goBackOrReplace('/(tabs)/connections')}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && request && user ? (
        <>
          <View style={styles.person}>
            <Pressable
              accessibilityLabel={`${user.nickname}さんのプロフィールを見る`}
              accessibilityRole="button"
              hitSlop={8}
              onPress={() =>
                router.push({ pathname: '/user/[id]', params: { id: user.id } })
              }
              style={({ pressed }) => pressed && styles.avatarPressed}>
              <Avatar
                avatarId={user.avatarId}
                imageUri={user.profileImageUri}
                name={user.nickname}
                size={72}
              />
            </Pressable>
            <View style={styles.personCopy}>
              <AppText variant="sectionTitle">{user.nickname}</AppText>
              <AppText variant="secondary" tone="soft">
                {user.userType}
              </AppText>
              {user.bio ? (
                <AppText variant="secondary" tone="soft">
                  {user.bio}
                </AppText>
              ) : null}
            </View>
          </View>

          <View style={styles.morningCard}>
            <AppText variant="caption" tone="lightMuted">
              明日の起床時刻
            </AppText>
            <AppText variant="time" tone="light" style={styles.time}>
              {request.wakeAt}
            </AppText>
            <AppText variant="secondary" tone="lightMuted">
              この時間に、あなたの声が届きます。
            </AppText>
          </View>

          <View style={styles.details}>
            <DetailRow label="明日の予定" value={request.schedules.join('・')} />
            <DetailRow label="今の気分" value={request.mood} />
            <DetailRow label="希望する声" last value={request.preferredVoiceStyle} />
          </View>

          <AppButton
            disabled={hasAlreadyGiven}
            icon={hasAlreadyGiven ? 'checkmark' : 'mic-outline'}
            label={hasAlreadyGiven ? 'この人には届けました' : 'この人に声を届ける'}
            onPress={handleStartRecording}
            testID="request-detail-give"
          />
        </>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  person: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  personCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  avatarPressed: {
    opacity: 0.6,
    transform: [{ scale: 0.96 }],
  },
  morningCard: {
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.navy,
    gap: spacing.sm,
  },
  time: {
    fontFamily: fonts?.rounded,
  },
  details: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  detailRow: {
    minHeight: 68,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  detailRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.separator,
  },
  detailLabel: {
    width: 84,
  },
  detailValue: {
    flex: 1,
    textAlign: 'right',
  },
  state: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
