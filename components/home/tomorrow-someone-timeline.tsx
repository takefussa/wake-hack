import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { LoadingState } from '@/components/common/loading-state';
import { MorningRequestCard } from '@/components/morning/morning-request-card';
import { useMorningRequestCandidates } from '@/hooks/use-morning-request-candidates';
import { useTapLock } from '@/hooks/use-tap-lock';
import { colors, radii, spacing } from '@/constants/theme';

export function TomorrowSomeoneTimeline() {
  const { candidates, isLoading, error, reload, hasMorningRequest } =
    useMorningRequestCandidates();
  const runOnce = useTapLock();

  return (
    <View style={styles.section}>
      <View style={styles.heading}>
        <AppText variant="sectionTitle">明日の誰か</AppText>
        <AppText variant="caption" tone="muted">
          あなたに近い順
        </AppText>
      </View>

      {!hasMorningRequest ? (
        <View style={styles.placeholder}>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            上の設定を終えると、声を届けられる相手がここに並びます。
          </AppText>
        </View>
      ) : null}

      {hasMorningRequest && isLoading ? (
        <LoadingState label="あなたに近い朝を探しています" />
      ) : null}

      {hasMorningRequest && !isLoading && error ? (
        <View style={styles.placeholder}>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            {error}
          </AppText>
          <AppButton label="もう一度読み込む" onPress={() => void reload()} variant="secondary" />
        </View>
      ) : null}

      {hasMorningRequest && !isLoading && !error && candidates.length === 0 ? (
        <View style={styles.placeholder}>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            今は個別の朝リクエストがありません。少し時間を置いてみてください。
          </AppText>
        </View>
      ) : null}

      {hasMorningRequest && !isLoading && !error && candidates.length > 0 ? (
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
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.lg,
  },
  heading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  list: {
    gap: spacing.lg,
  },
  placeholder: {
    padding: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: spacing.md,
  },
  centeredText: {
    textAlign: 'center',
  },
});
