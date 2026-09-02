import Ionicons from '@expo/vector-icons/Ionicons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import { colors, fonts, radii, spacing } from '@/constants/theme';
import { useAlarmSchedule } from '@/hooks/use-alarm-schedule';
import { useTapLock } from '@/hooks/use-tap-lock';
import { wakeService } from '@/services/wake-service';
import { useAppStore } from '@/store/use-app-store';

function formatAlarmTime(scheduledFor: string): string {
  return new Intl.DateTimeFormat('ja-JP', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(scheduledFor));
}

export default function TomorrowReadyScreen() {
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const currentUser = useAppStore((state) => state.currentUser);
  const givenVoiceMessages = useAppStore((state) => state.givenVoiceMessages);
  const startWakeSession = useAppStore((state) => state.startWakeSession);
  const [isStartingWake, setIsStartingWake] = useState(false);
  const [wakeError, setWakeError] = useState<string | null>(null);
  const isStartingWakeRef = useRef(false);
  const runOnce = useTapLock();
  const alarmSchedule = useAlarmSchedule(currentMorningRequest);
  const isCommunity = assignedWakeVoice?.type === 'community';
  const isCurrentUserReceiver =
    !!currentUser &&
    !!assignedWakeVoice &&
    assignedWakeVoice.receiverId === currentUser.id;
  const wakeProviderCopy = isCurrentUserReceiver
    ? isCommunity
      ? 'みんなの声で起きます'
      : 'あなたを起こす人が決まりました'
    : 'まだ誰が起こすか決まっていません';

  if (!currentMorningRequest || !currentUser) {
    return <Redirect href="/morning/setup" />;
  }
  if (!assignedWakeVoice) {
    return (
      <Redirect
        href={
          currentMorningRequest.personalEligible
            ? '/morning/summary'
            : '/morning/give-choice'
        }
      />
    );
  }
  if (
    assignedWakeVoice.receiverId !== currentUser.id ||
    assignedWakeVoice.morningRequestId !== currentMorningRequest.id
  ) {
    return <Redirect href="/morning/give-choice" />;
  }

  function handleBack() {
    runOnce(() => {
      router.replace('/(tabs)');
    });
  }

  async function handleStartWake() {
    if (isStartingWakeRef.current || !currentMorningRequest || !currentUser) return;

    isStartingWakeRef.current = true;
    setIsStartingWake(true);
    setWakeError(null);
    try {
      const experience = await wakeService.startWakeExperience(
        currentMorningRequest,
        currentUser.id,
        givenVoiceMessages,
        { isDemo: true }
      );
      const didStart = startWakeSession(experience.voice, experience.session);
      if (!didStart) {
        throw new Error('Wake session could not start');
      }
      router.push(
        experience.session.status === 'completed'
          ? '/wake/complete'
          : '/wake/alarm'
      );
    } catch {
      setWakeError('朝の声を準備できませんでした。もう一度お試しください。');
      isStartingWakeRef.current = false;
      setIsStartingWake(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="tomorrow-ready-screen" variant="dark">
      <StatusBar style="light" />
      <View style={styles.hero}>
        <View style={styles.navigation}>
          <IconButton
            icon="chevron-back"
            label="戻る"
            mode="dark"
            onPress={handleBack}
          />
        </View>
        <View style={styles.heroContent}>
          <View style={styles.status}>
            <Ionicons name="checkmark-circle" color={colors.warm} size={20} />
            <AppText variant="caption" tone="lightMuted">
              {wakeProviderCopy}
            </AppText>
          </View>
          <AppText variant="caption" tone="lightMuted">
            明日の朝
          </AppText>
          <AppText variant="time" tone="light" style={styles.time}>
            {currentMorningRequest.wakeAt}
          </AppText>
          <View style={styles.divider} />
          <AppText variant="bodyMedium" tone="light" style={styles.readyCopy}>
            {isCommunity
              ? 'みんなに向けて届けられた声で、朝を始めます。'
              : isCurrentUserReceiver
                ? '起こす人が確定しました。朝はその人の声で目覚めます。'
                : '誰かの声が届いたら、その人があなたを起こします。'}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText variant="secondary" tone="lightMuted" style={styles.footerCopy}>
          あとは、ゆっくり休んでください。
        </AppText>
        <View style={styles.alarmStatus} testID="ready-alarm-status">
          <Ionicons color={colors.textInverseSecondary} name="alarm-outline" size={18} />
          <AppText variant="caption" tone="lightMuted" style={styles.alarmStatusCopy}>
            {alarmSchedule.state.status === 'scheduled'
              ? `${formatAlarmTime(alarmSchedule.state.alarm.scheduledFor)}に${
                  alarmSchedule.state.alarm.deliveryMode === 'native'
                  ? alarmSchedule.state.alarm.sound === 'personal'
                      ? '届いた起床ボイスを設定済みです。停止するまで鳴ります'
                      : alarmSchedule.state.alarm.sound === 'community'
                        ? 'Community Voiceを設定済みです。停止するまで鳴ります'
                        : alarmSchedule.personalVoiceSyncStatus === 'error'
                        ? '標準音は設定済みですが、起床ボイスを取得できませんでした'
                        : alarmSchedule.personalVoiceSyncStatus === 'checking'
                          ? '標準音を設定し、届いた起床ボイスを確認しています'
                          : alarmSchedule.personalVoiceSyncStatus === 'waiting'
                            ? '標準音は設定済みです。寝る前にアプリを開くと届いた声を確認します'
                            : '実アラームを設定済みです。停止するまで鳴ります'
                    : '通知音を設定済みです（サイレントモードでは鳴らない場合があります）'
                }`
              : alarmSchedule.state.status === 'loading' ||
                  alarmSchedule.state.status === 'scheduling'
                ? 'アラームを確認しています'
                : alarmSchedule.state.status === 'denied'
                  ? 'アラームの使用が許可されていません'
                  : alarmSchedule.state.status === 'expired'
                    ? '設定時刻を過ぎています'
                    : alarmSchedule.state.status === 'unavailable'
                      ? 'Expo Goでは実際のアラームは利用できません。Wake Voiceの送受信は利用できます'
                      : 'アラームを設定できませんでした'}
          </AppText>
        </View>
        {alarmSchedule.state.status === 'denied' ? (
          <AppButton
            icon="settings-outline"
            label="端末の設定を開く"
            onPress={() => void alarmSchedule.openSettings()}
            variant="textOnDark"
          />
        ) : alarmSchedule.state.status === 'error' ||
          alarmSchedule.personalVoiceSyncStatus === 'error' ? (
          <AppButton
            icon="refresh-outline"
            label={
              alarmSchedule.state.status === 'error'
                ? 'アラームを再設定'
                : 'Wake Voiceを再確認'
            }
            onPress={alarmSchedule.retry}
            variant="textOnDark"
          />
        ) : null}
        {wakeError ? (
          <AppText variant="caption" style={styles.error}>
            {wakeError}
          </AppText>
        ) : null}
        <AppButton
          disabled={isStartingWake}
          icon="sunny-outline"
          label={isStartingWake ? '朝を準備しています…' : '朝を体験する'}
          onPress={() => void handleStartWake()}
          testID="start-wake-demo"
          variant="warm"
        />
        <AppButton
          icon="home-outline"
          label="ホーム画面に戻る"
          onPress={() => runOnce(() => router.replace('/(tabs)'))}
          testID="back-to-home"
          variant="textOnDark"
        />
        {isCommunity ? (
          <AppButton
            icon="mic-outline"
            label="やっぱり誰かに声を届ける"
            onPress={() => runOnce(() => router.push('/(tabs)/connections'))}
            variant="textOnDark"
          />
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: 0,
    paddingTop: 0,
  },
  hero: {
    minHeight: 430,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    borderBottomLeftRadius: radii.card,
    borderBottomRightRadius: radii.card,
    backgroundColor: colors.navy,
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
  },
  heroContent: {
    flex: 1,
    minHeight: 350,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  status: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  time: {
    fontFamily: fonts?.rounded,
  },
  divider: {
    width: 48,
    height: 1,
    marginVertical: spacing.sm,
    backgroundColor: colors.navyRaised,
  },
  readyCopy: {
    maxWidth: 280,
    textAlign: 'center',
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    gap: spacing.xl,
  },
  footerCopy: {
    textAlign: 'center',
  },
  alarmStatus: {
    minHeight: 32,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  alarmStatusCopy: {
    flexShrink: 1,
  },
  error: {
    color: colors.warmSoft,
    textAlign: 'center',
  },
});
