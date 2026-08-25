import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { MorningScreen } from '@/components/wake/morning-screen';
import { colors, radii, spacing } from '@/constants/theme';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { useAppStore } from '@/store/use-app-store';

type SummaryRowProps = {
  label: string;
  value: string;
  last?: boolean;
};

function formatWakeTime(wokeAt?: string): string {
  const date = wokeAt ? new Date(wokeAt) : new Date();
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function SummaryRow({ label, value, last = false }: SummaryRowProps) {
  return (
    <View style={[styles.summaryRow, !last && styles.summaryBorder]}>
      <AppText variant="secondary" tone="soft">
        {label}
      </AppText>
      <AppText variant="bodyMedium">{value}</AppText>
    </View>
  );
}

export default function WakeCompleteScreen() {
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const sender = useVoiceSender(assignedWakeVoice);

  if (!assignedWakeVoice || !wakeSession) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status !== 'completed') {
    return <Redirect href={wakeSession.status === 'mission' ? '/wake/mission' : '/wake/alarm'} />;
  }

  const isPersonal = assignedWakeVoice.type === 'personal';
  const senderName = isPersonal
    ? `${sender?.nickname ?? '誰か'}さん`
    : 'Wake Hackのみんな';

  function handleThanks() {
    Alert.alert('ありがとう', 'ありがとうを送る機能は、次のフェーズでつながります。');
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="wake-complete-screen">
      <StatusBar style="dark" />

      <View style={styles.hero}>
        <View style={styles.sunMark}>
          <Ionicons color={colors.textInverse} name="sunny" size={32} />
        </View>
        <AppText variant="screenTitle" style={styles.centeredText}>
          おはようございます
        </AppText>
        <AppText variant="secondary" tone="soft" style={styles.centeredText}>
          今日の朝を始められました。
        </AppText>
        {isPersonal ? (
          <Avatar
            avatarId={sender?.avatarId ?? 'sky'}
            imageUri={sender?.profileImageUri}
            name={sender?.nickname ?? '誰か'}
            size={64}
          />
        ) : null}
      </View>

      <View style={styles.summary}>
        <SummaryRow label="起床時刻" value={formatWakeTime(wakeSession.wokeAt)} />
        <SummaryRow label="声をくれた相手" value={senderName} />
        <SummaryRow label="起床ミッション" last value="50歩 完了" />
      </View>

      <View style={styles.actions}>
        {isPersonal ? (
          <AppButton
            icon="heart-outline"
            label="ありがとうを送る"
            onPress={handleThanks}
          />
        ) : null}
        <AppButton
          label="ホームに戻る"
          onPress={() => router.replace('/(tabs)')}
          variant={isPersonal ? 'secondary' : 'primary'}
        />
      </View>
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    gap: spacing.xxxl,
  },
  hero: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  sunMark: {
    width: 64,
    height: 64,
    borderRadius: radii.avatar,
    backgroundColor: colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  summary: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  summaryRow: {
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  summaryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  actions: {
    gap: spacing.sm,
  },
});
