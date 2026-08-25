import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { MorningRequestCard } from '@/components/morning/morning-request-card';
import { spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useTapLock } from '@/hooks/use-tap-lock';
import { rankMorningRequests } from '@/services/matching-service';
import type { MorningRequestMatch } from '@/services/matching-service';
import { morningRequestService } from '@/services/morning-request-service';
import { profileService } from '@/services/profile-service';
import { useAppStore } from '@/store/use-app-store';
import type { UserProfile } from '@/types';

type RequestCandidate = MorningRequestMatch & {
  user: UserProfile;
};

function isUserProfile(profile: UserProfile | null): profile is UserProfile {
  return profile !== null;
}

export default function RequestListScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const currentGiveReceiverIds = useAppStore((state) => state.currentGiveReceiverIds);
  const replaceMorningRequest = useAppStore(
    (state) => state.replaceMorningRequest
  );
  const [candidates, setCandidates] = useState<RequestCandidate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const runOnce = useTapLock();

  const loadCandidates = useCallback(async () => {
    if (!currentUser || !currentMorningRequest) return;

    setIsLoading(true);
    setError(null);

    try {
      const remoteCurrentRequest =
        await morningRequestService.ensureRemoteRequest(currentMorningRequest);
      if (remoteCurrentRequest.id !== currentMorningRequest.id) {
        replaceMorningRequest(remoteCurrentRequest);
        return;
      }

      const availableRequests = await morningRequestService.getAvailableRequests(
        currentUser.id,
        remoteCurrentRequest.id
      );
      const requests = availableRequests.filter(
        (request) => !currentGiveReceiverIds.includes(request.userId)
      );
      const profiles = (
        await Promise.all(requests.map((request) => profileService.getProfile(request.userId)))
      ).filter(isUserProfile);
      const matches = rankMorningRequests(
        currentUser,
        remoteCurrentRequest,
        requests,
        profiles
      );

      setCandidates(
        matches.flatMap((match) => {
          const user = profiles.find((profile) => profile.id === match.request.userId);
          return user ? [{ ...match, user }] : [];
        })
      );
    } catch {
      setError('朝リクエストを読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, [
    currentGiveReceiverIds,
    currentMorningRequest,
    currentUser,
    replaceMorningRequest,
  ]);

  useEffect(() => {
    void loadCandidates();
  }, [loadCandidates]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  if (!currentMorningRequest) {
    return <Redirect href="/morning/setup" />;
  }

  const backDestination = currentMorningRequest.personalEligible
    ? '/morning/ready'
    : '/morning/give-choice';

  return (
    <Screen contentStyle={styles.content} testID="request-list-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="まだ声が届いていない人から、あなたに近い順に並んでいます。"
        onBack={() => goBackOrReplace(backDestination)}
        title="明日の誰か"
      />

      {isLoading ? <LoadingState label="あなたに近い朝を探しています" /> : null}

      {!isLoading && error ? (
        <View style={styles.state}>
          <AppText variant="bodyMedium">{error}</AppText>
          <AppButton label="もう一度読み込む" onPress={() => void loadCandidates()} variant="secondary" />
        </View>
      ) : null}

      {!isLoading && !error && candidates.length === 0 ? (
        <View style={styles.state}>
          <AppText variant="bodyMedium">今は個別の朝リクエストがありません</AppText>
          <AppText variant="secondary" tone="soft" style={styles.stateCopy}>
            少し時間を置くか、今日はみんなに向けた声で朝を迎えられます。
          </AppText>
          <AppButton
            label="選択画面に戻る"
            onPress={() => goBackOrReplace(backDestination)}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && !error ? (
        <View style={styles.list}>
          {candidates.map(({ request, user, commonPoints }) => (
            <MorningRequestCard
              commonPoints={commonPoints}
              key={request.id}
              onPress={() =>
                runOnce(() =>
                  router.push({
                    pathname: '/morning/request-detail',
                    params: { requestId: request.id },
                  })
                )
              }
              request={request}
              user={user}
            />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  list: {
    gap: spacing.lg,
  },
  state: {
    minHeight: 280,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  stateCopy: {
    maxWidth: 300,
    textAlign: 'center',
  },
});
