import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { IconButton } from '@/components/common/icon-button';
import { MorningScreen } from '@/components/wake/morning-screen';
import { colors, fonts, paperColors, radii, shadows, spacing } from '@/constants/theme';
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
      <AppText style={styles.summaryLabel}>
        {label}
      </AppText>
      <AppText style={styles.summaryValue}>{value}</AppText>
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
    return <Redirect href="/wake/alarm" />;
  }

  const isPersonal = assignedWakeVoice.type === 'personal';
  const senderName = isPersonal
    ? `${sender?.nickname ?? '誰か'}さん`
    : 'オキタ！のみんな';
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

      <View style={styles.navigation}>
        <IconButton
          icon="chevron-back"
          label="起きた証明に戻る"
          onPress={() =>
            runOnce(() =>
              router.replace({ pathname: '/wake/mission', params: { review: '1' } })
            )
          }
        />
      </View>

      <View style={styles.hero}>
        <View style={styles.sunMark}>
          <Ionicons color={colors.textInverse} name="sunny" size={32} />
        </View>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          numberOfLines={1}
          style={[styles.centeredText, styles.heroTitle]}
        >
          おはようございます
        </AppText>
        <AppText style={[styles.centeredText, styles.completeMessage]}>
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
        <View pointerEvents="none" style={styles.greenTape} />
        <SummaryRow label="起床時刻" value={formatWakeTime(wakeSession.wokeAt)} />
        <SummaryRow label="声をくれた相手" last value={senderName} />
      </View>

      <View style={styles.actions}>
        <AppButton
          buttonColor={paperColors.orange}
          contentColor={paperColors.ink}
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
          style={styles.primaryAction}
        />
        <AppButton
          contentColor={colors.success}
          label="ホームに戻る"
          onPress={() => runOnce(() => router.replace('/(tabs)'))}
          style={styles.homeAction}
          variant="secondary"
        />
      </View>
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.lg,
  },
  sunMark: {
    width: 64,
    height: 64,
    borderRadius: radii.avatar,
    borderWidth: 2,
    borderColor: paperColors.ink,
    backgroundColor: colors.warm,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.paper,
  },
  heroTitle: {
    width: '100%',
    fontFamily: fonts?.handwritten,
    fontSize: 36,
    lineHeight: 44,
  },
  completeMessage: {
    fontFamily: fonts?.handwritten,
    fontSize: 21,
    lineHeight: 30,
  },
  centeredText: {
    textAlign: 'center',
  },
  summary: {
    position: 'relative',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.cardGray,
    ...shadows.paper,
  },
  summaryRow: {
    minHeight: 74,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.lg,
  },
  summaryBorder: {
    borderBottomWidth: 1,
    borderBottomColor: paperColors.ink,
  },
  summaryLabel: {
    fontFamily: fonts?.handwritten,
    fontSize: 18,
    lineHeight: 25,
  },
  summaryValue: {
    fontFamily: fonts?.handwritten,
    fontSize: 22,
    lineHeight: 29,
  },
  actions: {
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
    gap: spacing.sm,
    ...shadows.paper,
  },
  greenTape: {
    position: 'absolute',
    top: -13,
    left: '34%',
    right: '34%',
    zIndex: 2,
    height: 24,
    backgroundColor: colors.success,
    opacity: 0.82,
    transform: [{ rotate: '-1deg' }],
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: paperColors.ink,
  },
  homeAction: {
    borderWidth: 2,
    borderColor: colors.success,
  },
});
