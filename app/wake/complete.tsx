import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { MorningScreen } from '@/components/wake/morning-screen';
import { colors, radii, spacing } from '@/constants/theme';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { thanksService } from '@/services/thanks-service';
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
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const currentUser = useAppStore((state) => state.currentUser);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const thanksMessages = useAppStore((state) => state.thanksMessages);
  const addThanksMessages = useAppStore((state) => state.addThanksMessages);
  const sender = useVoiceSender(assignedWakeVoice);
  const runOnce = useTapLock();
  const currentUserId = currentUser?.id;
  const hasValidCompleteContext = Boolean(
    currentUser &&
      currentMorningRequest &&
      assignedWakeVoice &&
      wakeSession &&
      isWakeContextValid({
        currentUser,
        morningRequest: currentMorningRequest,
        voice: assignedWakeVoice,
        wakeSession,
      })
  );

  useEffect(() => {
    if (
      !hasValidCompleteContext ||
      !currentUserId ||
      wakeSession?.status !== 'completed'
    ) {
      return;
    }
    const userId = currentUserId;

    let isMounted = true;
    async function receiveGiveThanks() {
      try {
        const messages = await thanksService.createIncomingForGives(
          givenVoiceMessages,
          userId
        );
        if (isMounted) addThanksMessages(messages);
      } catch {
        // Thanksは次回表示時にも再生成できるため、朝の完了体験を止めない。
      }
    }

    void receiveGiveThanks();
    return () => {
      isMounted = false;
    };
  }, [
    addThanksMessages,
    currentUserId,
    givenVoiceMessages,
    hasValidCompleteContext,
    wakeSession?.status,
  ]);

  if (
    !hasValidCompleteContext ||
    !currentUser ||
    !currentMorningRequest ||
    !assignedWakeVoice ||
    !wakeSession
  ) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status !== 'completed') {
    return <Redirect href={wakeSession.status === 'mission' ? '/wake/mission' : '/wake/alarm'} />;
  }

  const isPersonal = assignedWakeVoice.type === 'personal';
  const senderName = isPersonal
    ? `${sender?.nickname ?? '誰か'}さん`
    : 'Wake Hackのみんな';
  const hasSentThanks = currentUser
    ? thanksMessages.some(
        (message) =>
          message.senderId === currentUser.id &&
          message.sourceVoiceMessageId === assignedWakeVoice.id
      )
    : false;

  function handleThanks() {
    runOnce(() => {
      if (hasSentThanks) {
        router.push(isPersonal ? '/friend/request' : '/(tabs)/connections');
        return;
      }
      router.push('/wake/thanks');
    });
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
        <AppButton
          icon="heart-outline"
          label={
            hasSentThanks
              ? isPersonal
                ? '朝のつながりを見る'
                : 'つながりを見る'
              : isPersonal
                ? '声をくれた人にありがとうを送る'
                : 'みんなの声にリアクションする'
          }
          onPress={handleThanks}
        />
        <AppButton
          label="ホームに戻る"
          onPress={() => runOnce(() => router.replace('/(tabs)'))}
          variant="secondary"
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
