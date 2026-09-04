import Ionicons from '@expo/vector-icons/Ionicons';
import { LinearGradient } from 'expo-linear-gradient';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { LayoutChangeEvent, Platform, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { Screen } from '@/components/common/screen';
import {
  legacyColors as colors,
  fonts,
  paperColors,
  shadows,
  spacing,
} from '@/constants/theme';
import { useAlarmSchedule } from '@/hooks/use-alarm-schedule';
import { useTapLock } from '@/hooks/use-tap-lock';
import { wakeService } from '@/services/wake-service';
import { useAppStore } from '@/store/use-app-store';

// 地面: 上の紺色の空(hero)と分けたライトグレー
const GROUND_COLOR = paperColors.clockGray;

function centeredSquare(diameter: number, centerX: number, centerY: number) {
  return {
    width: diameter,
    height: diameter,
    borderRadius: diameter / 2,
    left: centerX - diameter / 2,
    top: centerY - diameter / 2,
  };
}

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
  const [heroLayout, setHeroLayout] = useState({ width: 0, height: 0 });
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

  function handleHeroLayout(event: LayoutChangeEvent) {
    const { width, height } = event.nativeEvent.layout;
    setHeroLayout({ width, height });
  }

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

  const moonSize = heroLayout.width / 3;
  const moonCenterX = heroLayout.width / 2;
  const moonCenterY = heroLayout.height;
  const moonStyle = moonSize > 0 ? centeredSquare(moonSize, moonCenterX, moonCenterY) : null;
  const haloOuterStyle =
    moonSize > 0 ? centeredSquare(moonSize * 1.8, moonCenterX, moonCenterY) : null;
  const haloInnerStyle =
    moonSize > 0 ? centeredSquare(moonSize * 1.35, moonCenterX, moonCenterY) : null;

  return (
    <Screen
      backgroundColor={colors.navy}
      contentStyle={styles.content}
      testID="tomorrow-ready-screen"
      variant="dark"
    >
      <StatusBar style="light" />
      <View style={styles.body}>
        <View onLayout={handleHeroLayout} style={styles.hero}>
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
                {isCommunity ? 'みんなの声を準備しました' : 'あなたへの声を準備しました'}
              </AppText>
            </View>
            <AppText variant="caption" tone="lightMuted">
              {wakeProviderCopy}
            </AppText>
            <AppText variant="caption" tone="lightMuted">
              明日の朝
            </AppText>
            <AppText variant="time" tone="light" style={styles.time}>
              {currentMorningRequest.wakeAt}
            </AppText>
            <AppText variant="bodyMedium" tone="light" style={styles.readyCopy}>
              {isCommunity
                ? 'みんなに向けて届けられた声で、朝を始めます。'
                : isCurrentUserReceiver
                  ? '起こす人が確定しました。朝はその人の声で目覚めます。'
                  : '誰かの声が届いたら、その人があなたを起こします。'}
            </AppText>
          </View>
        </View>

        {moonStyle && haloOuterStyle && haloInnerStyle ? (
          <>
            <View pointerEvents="none" style={[styles.halo, styles.haloOuter, haloOuterStyle]} />
            <View pointerEvents="none" style={[styles.halo, styles.haloInner, haloInnerStyle]} />
            <View pointerEvents="none" style={[styles.moon, moonStyle]}>
              <View style={[styles.crater, styles.craterOne]} />
              <View style={[styles.crater, styles.craterTwo]} />
              <View style={[styles.crater, styles.craterThree]} />
              <View style={[styles.crater, styles.craterFour]} />
              <View style={[styles.crater, styles.craterFive]} />
              <LinearGradient
                colors={['transparent', GROUND_COLOR]}
                locations={[0.32, 0.6]}
                style={StyleSheet.absoluteFill}
              />
            </View>
          </>
        ) : null}

        <View style={styles.footer}>
          <AppText variant="secondary" tone="dark" style={styles.footerCopy}>
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
              variant="text"
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
              variant="text"
            />
          ) : null}
          {Platform.OS === 'android' &&
          alarmSchedule.state.status === 'scheduled' &&
          !alarmSchedule.hasNotificationPermission ? (
            <>
              <View style={styles.batteryNotice} testID="ready-notification-permission-notice">
                <Ionicons color={colors.textInverseSecondary} name="notifications-off-outline" size={16} />
                <AppText variant="caption" tone="lightMuted" style={styles.alarmStatusCopy}>
                  アプリの通知を許可してください。許可がないとアラームを止められません
                </AppText>
              </View>
              <AppButton
                icon="settings-outline"
                label="通知を許可する"
                onPress={() => void alarmSchedule.openNotificationSettings()}
                variant="text"
              />
            </>
          ) : null}
          {Platform.OS === 'android' &&
          alarmSchedule.state.status === 'scheduled' &&
          !alarmSchedule.isBatteryOptimizationExcluded ? (
            <>
              <View style={styles.batteryNotice} testID="ready-battery-optimization-notice">
                <Ionicons color={colors.textInverseSecondary} name="battery-half-outline" size={16} />
                <AppText variant="caption" tone="lightMuted" style={styles.alarmStatusCopy}>
                  端末の電池最適化が有効です。機種によってはアラームが鳴らないことがあります
                </AppText>
              </View>
              <AppButton
                icon="settings-outline"
                label="電池最適化の対象から外す"
                onPress={() => void alarmSchedule.openBatteryOptimizationSettings()}
                variant="text"
              />
            </>
          ) : null}
          {wakeError ? (
            <AppText variant="caption" style={styles.error}>
              {wakeError}
            </AppText>
          ) : null}
          <AppButton
            legacy
            contentColor={colors.textInverse}
            disabled={isStartingWake}
            icon="sunny-outline"
            label={isStartingWake ? '朝を準備しています…' : '朝を体験する'}
            onPress={() => void handleStartWake()}
            style={styles.primaryAction}
            testID="start-wake-demo"
            variant="warm"
          />
          <AppButton
            legacy
            icon="home-outline"
            label="ホーム画面に戻る"
            onPress={() => runOnce(() => router.replace('/(tabs)'))}
            testID="back-to-home"
            variant="text"
          />
          {isCommunity ? (
            <AppButton
              legacy
              icon="mic-outline"
              label="やっぱり誰かに声を届ける"
              onPress={() => runOnce(() => router.push('/(tabs)/connections'))}
              variant="text"
            />
          ) : null}
        </View>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
  },
  body: {
    flex: 1,
    position: 'relative',
  },
  hero: {
    minHeight: 430,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxxl,
    position: 'relative',
    zIndex: 2,
    backgroundColor: 'transparent',
  },
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
  },
  heroContent: {
    flex: 1,
    minHeight: 350,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: 'rgba(32, 42, 62, 0.78)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    ...shadows.paper,
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
  readyCopy: {
    maxWidth: 300,
    textAlign: 'center',
  },
  footer: {
    flex: 1,
    position: 'relative',
    zIndex: 2,
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xxxl,
    borderTopWidth: 2,
    borderTopColor: paperColors.ink,
    gap: spacing.xl,
    backgroundColor: GROUND_COLOR,
  },
  halo: {
    position: 'absolute',
    zIndex: 1,
    backgroundColor: '#E9EAEC',
  },
  haloOuter: {
    opacity: 0.08,
  },
  haloInner: {
    opacity: 0.14,
  },
  moon: {
    position: 'absolute',
    zIndex: 1,
    overflow: 'hidden',
    backgroundColor: '#D9D9DB',
  },
  crater: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#B7B8BA',
  },
  craterOne: {
    left: '16%',
    top: '10%',
    width: '22%',
    aspectRatio: 1,
  },
  craterTwo: {
    left: '54%',
    top: '6%',
    width: '15%',
    aspectRatio: 1,
  },
  craterThree: {
    left: '30%',
    top: '26%',
    width: '12%',
    aspectRatio: 1,
  },
  craterFour: {
    left: '68%',
    top: '24%',
    width: '10%',
    aspectRatio: 1,
  },
  craterFive: {
    left: '44%',
    top: '38%',
    width: '14%',
    aspectRatio: 1,
  },
  footerCopy: {
    textAlign: 'center',
  },
  alarmStatus: {
    minHeight: 58,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 12,
    backgroundColor: colors.navyRaised,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    ...shadows.paper,
  },
  batteryNotice: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderWidth: 1,
    borderColor: paperColors.ink,
    borderRadius: 12,
    backgroundColor: colors.navyRaised,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  alarmStatusCopy: {
    flexShrink: 1,
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: paperColors.ink,
    ...shadows.paper,
  },
});
