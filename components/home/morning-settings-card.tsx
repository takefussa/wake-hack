import Ionicons from '@expo/vector-icons/Ionicons';
import { Pressable, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import type { MorningRequest, VoiceMessage, WeeklyWakePlanEntry } from '@/types';

type MorningSettingsCardProps = {
  request: MorningRequest | null;
  wakeAt: string | null;
  wakeVoice: VoiceMessage | null;
  weeklyDefault: WeeklyWakePlanEntry | null;
  onEditTime: () => void;
  onEditCondition: () => void;
  onContinue: () => void;
};

function SettingRow({
  label,
  value,
  onPress,
}: {
  label: string;
  value: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${label}: ${value}`}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.rowPressed]}>
      <View style={styles.rowCopy}>
        <AppText variant="secondary" tone="lightMuted">
          {label}
        </AppText>
        <AppText variant="bodyMedium" tone="light" style={styles.rowValueText}>
          {value}
        </AppText>
      </View>
      <Ionicons color={colors.textInverseSecondary} name="chevron-forward" size={18} />
    </Pressable>
  );
}

export function MorningSettingsCard({
  request,
  wakeAt,
  wakeVoice,
  weeklyDefault,
  onEditTime,
  onEditCondition,
  onContinue,
}: MorningSettingsCardProps) {
  const usesWeeklyDefault = !request && weeklyDefault !== null;
  const timeValue = wakeAt ?? weeklyDefault?.wakeAt ?? null;
  const timeLabel = timeValue
    ? `${timeValue}${usesWeeklyDefault ? '（初期値）' : ''}`
    : '未設定';
  const conditionValue = request
    ? `${request.schedules.join('・')}・${request.mood}`
    : weeklyDefault
      ? `${weeklyDefault.schedules.join('・') || '予定なし'}（初期値）`
      : null;
  const conditionLabel = conditionValue ?? '未設定';
  const isReady = wakeVoice !== null;
  const statusLabel = !request
    ? '起きる時間と、今の気持ちを預けます。'
    : isReady
      ? wakeVoice.type === 'personal'
        ? 'あなたへの声が届いています'
        : 'みんなの声を準備しました'
      : null;
  const continueLabel = !request ? '明日の朝を準備' : isReady ? '準備した内容を見る' : null;

  return (
    <View style={styles.card}>
      <AppText variant="caption" tone="lightMuted">
        明日の朝の設定
      </AppText>

      <View style={styles.rows}>
        <SettingRow label="何時に起きるか" onPress={onEditTime} value={timeLabel} />
        <View style={styles.divider} />
        <SettingRow
          label="どんな朝になりそうか？"
          onPress={onEditCondition}
          value={conditionLabel}
        />
      </View>

      {statusLabel && continueLabel ? (
        <>
          <View style={styles.statusRow}>
            <AppText variant="secondary" tone="lightMuted">
              {statusLabel}
            </AppText>
          </View>
          <AppButton label={continueLabel} onPress={onContinue} variant="inverted" />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.xl,
    borderRadius: radii.card,
    backgroundColor: colors.navy,
    gap: spacing.lg,
  },
  rows: {
    borderRadius: radii.input,
    backgroundColor: colors.navyRaised,
  },
  row: {
    minHeight: 56,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  rowPressed: {
    opacity: 0.72,
  },
  rowCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  rowValueText: {
    fontFamily: fonts?.rounded,
  },
  divider: {
    height: 1,
    marginHorizontal: spacing.lg,
    backgroundColor: colors.navy,
  },
  statusRow: {
    paddingTop: spacing.sm,
  },
});
