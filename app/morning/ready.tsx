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
import { useTapLock } from '@/hooks/use-tap-lock';
import { wakeService } from '@/services/wake-service';
import { useAppStore } from '@/store/use-app-store';

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

  if (!currentMorningRequest || !currentUser) {
    return <Redirect href="/morning/setup" />;
  }
  if (!assignedWakeVoice) {
    return <Redirect href="/morning/give-choice" />;
  }
  if (
    assignedWakeVoice.receiverId !== currentUser.id ||
    assignedWakeVoice.morningRequestId !== currentMorningRequest.id
  ) {
    return <Redirect href="/morning/give-choice" />;
  }

  const isCommunity = assignedWakeVoice.type === 'community';

  async function handleStartWake() {
    if (isStartingWakeRef.current || !currentMorningRequest || !currentUser) return;

    isStartingWakeRef.current = true;
    setIsStartingWake(true);
    setWakeError(null);
    try {
      const assignment = await wakeService.assignWakeVoice(
        currentMorningRequest,
        currentUser.id,
        givenVoiceMessages
      );
      const didStart = startWakeSession(assignment.voice);
      if (!didStart) {
        throw new Error('Wake session could not start');
      }
      router.push('/wake/alarm');
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
            label="ホームに戻る"
            mode="dark"
            onPress={() => runOnce(() => router.replace('/(tabs)'))}
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
            明日の朝
          </AppText>
          <AppText variant="time" tone="light" style={styles.time}>
            {currentMorningRequest.wakeAt}
          </AppText>
          <View style={styles.divider} />
          <AppText variant="bodyMedium" tone="light" style={styles.readyCopy}>
            {isCommunity
              ? 'みんなに向けて届けられた声で、朝を始めます。'
              : 'あなたに向けた声を準備しました。誰から届くかは朝までのお楽しみです。'}
          </AppText>
        </View>
      </View>

      <View style={styles.footer}>
        <AppText variant="secondary" tone="lightMuted" style={styles.footerCopy}>
          あとは、ゆっくり休んでください。
        </AppText>
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
        {isCommunity ? (
          <AppButton
            icon="mic-outline"
            label="やっぱり誰かに声を届ける"
            onPress={() => runOnce(() => router.push('/morning/request-list'))}
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
  error: {
    color: colors.warmSoft,
    textAlign: 'center',
  },
});
