import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { MorningRequest, VoiceMessage } from '@/types';

type NextMorningCardProps = {
  request: MorningRequest | null;
  wakeVoice: VoiceMessage | null;
  onPrepare: () => void;
};

export function NextMorningCard({ request, wakeVoice, onPrepare }: NextMorningCardProps) {
  if (!request) {
    return (
      <View style={styles.card}>
        <AppText variant="caption" tone="lightMuted">
          次の朝
        </AppText>
        <View style={styles.emptyCopy}>
          <AppText variant="screenTitle" tone="light">
            明日の朝を準備する
          </AppText>
          <AppText variant="secondary" tone="lightMuted">
            起きる時間と、今の気持ちを預けます。
          </AppText>
        </View>
        <AppButton label="明日の朝を準備" onPress={onPrepare} variant="warm" />
      </View>
    );
  }

  const isReady = wakeVoice !== null;
  const statusLabel = isReady
    ? wakeVoice.type === 'personal'
      ? 'あなたへの声が届いています'
      : 'みんなの声を準備しました'
    : '声を届ける前です';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText variant="caption" tone="lightMuted">
          明日の朝
        </AppText>
        <View style={styles.statusBadge}>
          <View style={[styles.statusDot, isReady && styles.statusDotReady]} />
          <AppText variant="caption" tone="light">
            {isReady ? '準備完了' : '受付中'}
          </AppText>
        </View>
      </View>

      <AppText variant="time" tone="light" style={styles.time}>
        {request.wakeAt}
      </AppText>

      <View style={styles.contextRow}>
        <AppText variant="bodyMedium" tone="light">
          {request.schedules.join('・')}
        </AppText>
        <View style={styles.contextDivider} />
        <AppText variant="secondary" tone="lightMuted">
          {request.mood}
        </AppText>
      </View>

      <View style={styles.statusRow}>
        <AppText variant="secondary" tone="lightMuted">
          {statusLabel}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.navy,
    gap: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  emptyCopy: {
    gap: spacing.sm,
  },
  statusBadge: {
    minHeight: 28,
    paddingHorizontal: spacing.md,
    borderRadius: radii.badge,
    backgroundColor: colors.navyRaised,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.warm,
  },
  statusDotReady: {
    backgroundColor: colors.success,
  },
  time: {
    fontFamily: fonts?.rounded,
  },
  contextRow: {
    minHeight: 28,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  contextDivider: {
    width: 1,
    height: 18,
    backgroundColor: colors.navyRaised,
  },
  statusRow: {
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.navyRaised,
  },
});
