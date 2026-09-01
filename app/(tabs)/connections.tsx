import { Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/common/app-text';
import { LoadingState } from '@/components/common/loading-state';
import { Screen } from '@/components/common/screen';
import { StatTile } from '@/components/common/stat-tile';
import { ThanksInboxRow } from '@/components/thanks/thanks-inbox-row';
import { prototypeConfig } from '@/constants/config';
import { colors, fonts, spacing } from '@/constants/theme';
import { thanksService } from '@/services/thanks-service';
import { useAppStore } from '@/store/use-app-store';
import type { ThanksInboxItem } from '@/types';

export default function ConnectionsScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const thanksMessages = useAppStore((state) => state.thanksMessages);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const addThanksMessages = useAppStore((state) => state.addThanksMessages);
  const currentUserId = currentUser?.id;
  const [inboxItems, setInboxItems] = useState<ThanksInboxItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!currentUserId) return;
    const userId = currentUserId;

    let isMounted = true;
    async function loadInbox() {
      try {
        const availableMessages = await thanksService.getMessagesForUser(
          userId,
          thanksMessages
        );
        const items = await thanksService.getInboxItems(
          availableMessages,
          givenVoiceMessages,
          userId
        );
        if (isMounted) {
          addThanksMessages(availableMessages);
          setInboxItems(items);
          setLoadError(null);
        }
      } catch {
        let localItems: ThanksInboxItem[] = [];
        try {
          localItems = await thanksService.getInboxItems(
            thanksMessages,
            givenVoiceMessages,
            userId
          );
        } catch {
          // ローカルデータの一部が古い場合も、タブ自体は表示し続ける。
        }
        if (isMounted) {
          setInboxItems(localItems);
          setLoadError('新しいありがとうを確認できませんでした。');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void loadInbox();
    return () => {
      isMounted = false;
    };
  }, [
    addThanksMessages,
    currentUserId,
    givenVoiceMessages,
    thanksMessages,
  ]);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen contentStyle={styles.content} testID="connections-screen">
      <View style={styles.header}>
        <AppText variant="screenTitle">つながり</AppText>
        <AppText variant="secondary" tone="soft">
          同じ時間に始まった朝と、声のあとに届いた言葉。
        </AppText>
      </View>

      <View style={styles.morningSummary}>
        <AppText variant="secondary" tone="soft">
          今朝7時前後に
        </AppText>
        <View style={styles.totalRow}>
          <AppText variant="displayNumber" style={styles.totalNumber}>
            {prototypeConfig.nearbyWakeCount}
          </AppText>
          <AppText variant="secondary" tone="soft">
            人が朝を始めました
          </AppText>
        </View>
        <AppText variant="caption" tone="muted">
          同じ時間に起きた誰かがいます。
        </AppText>
      </View>

      <View style={styles.stats}>
        <StatTile
          compact
          value={prototypeConfig.totalMorningCount.toLocaleString()}
          label="今朝の合計"
        />
        <View style={styles.verticalDivider} />
        <StatTile compact value="48人" label="大学生" />
        <View style={styles.verticalDivider} />
        <StatTile compact value="17人" label="1限あり" />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="sectionTitle">届いたありがとう</AppText>
          {inboxItems.length > 0 ? (
            <AppText variant="caption" tone="muted">
              {inboxItems.length}件
            </AppText>
          ) : null}
        </View>
        <AppText variant="caption" tone="muted">
          あなたが届けた声への返事です。
        </AppText>

        {loadError ? (
          <AppText variant="caption" style={styles.error}>
            {loadError}
          </AppText>
        ) : null}

        {isLoading ? <LoadingState label="届いた言葉を読み込んでいます" /> : null}
        {!isLoading && inboxItems.length === 0 ? (
          <View style={styles.emptyState}>
            <AppText variant="bodyMedium">まだ返事は届いていません</AppText>
            <AppText variant="secondary" tone="soft">
              届けた声が誰かの朝に使われると、ここにありがとうが届きます。
            </AppText>
          </View>
        ) : null}
        {!isLoading && inboxItems.length > 0 ? (
          <View style={styles.thanksList}>
            {inboxItems.map((item) => (
              <ThanksInboxRow item={item} key={item.message.id} />
            ))}
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  header: {
    gap: spacing.sm,
  },
  morningSummary: {
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  totalNumber: {
    color: colors.indigo,
    fontFamily: fonts?.rounded,
  },
  stats: {
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  verticalDivider: {
    width: 1,
    marginVertical: spacing.md,
    backgroundColor: colors.separator,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  thanksList: {
    borderTopWidth: 1,
    borderTopColor: colors.separator,
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.separator,
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
});
