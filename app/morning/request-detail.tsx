import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { IconButton } from '@/components/common/icon-button';
import { LoadingState } from '@/components/common/loading-state';
import { MorningScreen } from '@/components/wake/morning-screen';
import { fonts, paperColors, shadows, spacing } from '@/constants/theme';
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

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }
  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  function handleStartRecording() {
    if (!request) return;
    runOnce(() => {
      selectGiveRequest(request.id);
      router.push({
        pathname: '/morning/record',
        params: { requestId: request.id },
      });
    });
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="request-detail-screen">
      <StatusBar style="dark" />

      <View style={styles.navigation}>
        <IconButton
          icon="chevron-back"
          label="タイムラインに戻る"
          onPress={() => goBackOrReplace('/(tabs)/connections')}
        />
      </View>

      <View style={styles.heading}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          numberOfLines={1}
          style={styles.title}
        >
          この人の明日の朝へ
        </AppText>
        <View pointerEvents="none" style={styles.titleUnderline} />
      </View>

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
            <View pointerEvents="none" style={styles.blueTape} />
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
            <View pointerEvents="none" style={[styles.blueTape, styles.morningTape]} />
            <AppText variant="caption" style={styles.morningLabel}>
              明日の起床時刻
            </AppText>
            <AppText variant="time" style={styles.time}>
              {request.wakeAt}
            </AppText>
            <AppText variant="secondary" tone="soft" style={styles.centeredText}>
              この時間に、あなたの声が届きます。
            </AppText>
          </View>

          <View style={styles.details}>
            <View pointerEvents="none" style={[styles.blueTape, styles.detailsTape]} />
            <DetailRow label="明日の予定" value={request.schedules.join('・')} />
            <DetailRow label="今の気分" value={request.mood} />
            <DetailRow label="希望する声" last value={request.preferredVoiceStyle} />
          </View>

          <AppButton
            buttonColor={paperColors.salmon}
            contentColor={paperColors.ink}
            icon="mic-outline"
            label="この人に声を届ける"
            onPress={handleStartRecording}
            style={styles.primaryAction}
            testID="request-detail-give"
          />
        </>
      ) : null}
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
  },
  heading: {
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
  },
  title: {
    width: '100%',
    fontFamily: fonts?.handwritten,
    fontSize: 34,
    lineHeight: 43,
    textAlign: 'center',
  },
  titleUnderline: {
    width: 230,
    height: 7,
    marginTop: spacing.xs,
    borderRadius: 4,
    backgroundColor: paperColors.ruleBlue,
    opacity: 0.8,
    transform: [{ rotate: '-1deg' }],
  },
  person: {
    position: 'relative',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    ...shadows.paper,
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
    position: 'relative',
    padding: spacing.xl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.cardGray,
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.paper,
  },
  morningLabel: {
    color: paperColors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  time: {
    fontFamily: fonts?.rounded,
    color: paperColors.ink,
    fontSize: 60,
    lineHeight: 68,
  },
  centeredText: {
    textAlign: 'center',
  },
  details: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    ...shadows.paper,
  },
  detailRow: {
    minHeight: 68,
    paddingVertical: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  detailRowBorder: {
    borderBottomWidth: 1.5,
    borderBottomColor: paperColors.ink,
  },
  detailLabel: {
    width: 84,
    color: paperColors.ink,
    fontSize: 15,
    lineHeight: 21,
  },
  detailValue: {
    flex: 1,
    color: paperColors.ink,
    fontSize: 19,
    lineHeight: 25,
    textAlign: 'right',
  },
  blueTape: {
    position: 'absolute',
    top: -12,
    left: '36%',
    right: '36%',
    zIndex: 2,
    height: 23,
    backgroundColor: paperColors.tape,
    transform: [{ rotate: '-1deg' }],
  },
  morningTape: {
    transform: [{ rotate: '1deg' }],
  },
  detailsTape: {
    transform: [{ rotate: '-0.5deg' }],
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },
  state: {
    flex: 1,
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
});
