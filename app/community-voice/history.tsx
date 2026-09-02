import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { CommunityVoiceHistoryRow } from '@/components/community-voice/community-voice-history-row';
import { legacyColors as colors, radii, spacing } from '@/constants/theme';
import { communityVoiceService } from '@/services/community-voice-service';
import { useAppStore } from '@/store/use-app-store';
import type { CommunityVoice, CommunityVoiceStats } from '@/types';

export default function CommunityVoiceHistoryScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const [voices, setVoices] = useState<CommunityVoice[]>([]);
  const [stats, setStats] = useState<CommunityVoiceStats>({
    wakeCount: 0,
    thanksCount: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadHistory = useCallback(async () => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      const [nextStats, nextVoices] = await Promise.all([
        communityVoiceService.getStats(currentUser.id),
        communityVoiceService.listMine(currentUser.id),
      ]);
      setStats(nextStats);
      setVoices(nextVoices);
    } catch {
      setError('Community Voiceの実績を読み込めませんでした。');
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen testID="community-voice-history-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="自分の声が、どれだけ誰かの朝につながったかを確認できます。"
        onBack={() => router.replace('/(tabs)/connections')}
        title="Community Voice"
      />

      <View style={styles.statsCard}>
        <View style={styles.stat}>
          <AppText variant="caption" tone="soft">
            起こした人
          </AppText>
          <AppText variant="displayNumber">{stats.wakeCount}</AppText>
        </View>
        <View style={styles.divider} />
        <View style={styles.stat}>
          <AppText variant="caption" tone="soft">
            Thanks
          </AppText>
          <AppText variant="displayNumber">{stats.thanksCount}</AppText>
        </View>
      </View>

      <View style={styles.actions}>
        <AppButton
          icon="mic-outline"
          label="Community Voiceを録る"
          legacy
          onPress={() => router.push('/community-voice/create')}
          variant="warm"
        />
      </View>

      {isLoading ? (
        <View style={styles.stateCard}>
          <ActivityIndicator color={colors.indigo} />
          <AppText variant="secondary" tone="soft">
            投稿履歴を読み込んでいます
          </AppText>
        </View>
      ) : null}

      {!isLoading && error ? (
        <View style={styles.stateCard}>
          <AppText variant="secondary" style={styles.error}>
            {error}
          </AppText>
          <AppButton
            compact
            label="もう一度読み込む"
            legacy
            onPress={() => void loadHistory()}
            variant="secondary"
          />
        </View>
      ) : null}

      {!isLoading && !error && voices.length === 0 ? (
        <View style={styles.stateCard}>
          <AppText variant="sectionTitle">まだ投稿がありません</AppText>
          <AppText variant="secondary" tone="soft" style={styles.centeredText}>
            最初の声を録って、誰かの朝に届けましょう。
          </AppText>
        </View>
      ) : null}

      {!isLoading && !error && voices.length > 0 ? (
        <View style={styles.list}>
          {voices.map((voice) => (
            <CommunityVoiceHistoryRow key={voice.id} voice={voice} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  statsCard: {
    minHeight: 120,
    padding: spacing.lg,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
  },
  divider: {
    width: 1,
    alignSelf: 'stretch',
    backgroundColor: colors.border,
  },
  actions: {
    gap: spacing.sm,
  },
  stateCard: {
    minHeight: 160,
    padding: spacing.xl,
    borderRadius: radii.card,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  list: {
    gap: spacing.md,
  },
  centeredText: {
    textAlign: 'center',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
});
