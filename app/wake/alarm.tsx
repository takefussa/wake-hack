import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { MorningScreen } from '@/components/wake/morning-screen';
import { WakeVoicePlayer } from '@/components/wake/wake-voice-player';
import { legacyColors as colors, fonts, spacing } from '@/constants/theme';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { useAppStore } from '@/store/use-app-store';

export default function WakeAlarmScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const cancelWakeSession = useAppStore((state) => state.cancelWakeSession);
  const sender = useVoiceSender(assignedWakeVoice);
  const runOnce = useTapLock();
  const stopPlaybackRef = useRef<() => void>(() => undefined);

  const handlePlayerReady = useCallback((stopPlayback: () => void) => {
    stopPlaybackRef.current = stopPlayback;
  }, []);

  if (!currentUser || !currentMorningRequest || !assignedWakeVoice || !wakeSession) {
    return <Redirect href="/morning/ready" />;
  }
  if (
    !isWakeContextValid({
      currentUser,
      morningRequest: currentMorningRequest,
      voice: assignedWakeVoice,
      wakeSession,
    })
  ) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status === 'completed') {
    return <Redirect href="/wake/complete" />;
  }

  const isCommunity = assignedWakeVoice.type === 'community';
  const senderName = sender?.nickname ?? '誰か';

  function handleWakeUp() {
    runOnce(() => {
      stopPlaybackRef.current();
      router.replace('/wake/mission');
    });
  }

  function handleBack() {
    runOnce(() => {
      stopPlaybackRef.current();
      cancelWakeSession();
      router.replace('/morning/ready');
    });
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="wake-alarm-screen">
      <StatusBar style="dark" />

      <View style={styles.navigation}>
        <IconButton icon="chevron-back" label="朝の準備に戻る" onPress={handleBack} />
      </View>

      <View style={styles.timeSection}>
        <AppText variant="caption" tone="soft">
          おはようございます
        </AppText>
        <AppText variant="time" style={styles.time}>
          {wakeSession.alarmAt}
        </AppText>
        <AppText variant="secondary" tone="soft">
          今日は {currentMorningRequest.schedules.join('・')}
        </AppText>
      </View>

      <View style={styles.voiceSection}>
        <AppText variant="sectionTitle" style={styles.centeredText}>
          {isCommunity
            ? 'オキタ！のみんなから'
            : `${senderName}さんから、あなたの朝へ`}
        </AppText>
        <WakeVoicePlayer
          autoPlay
          onPlayerReady={handlePlayerReady}
          sender={sender}
          voice={assignedWakeVoice}
        />
      </View>

      <View style={styles.footer}>
        <AppButton
          legacy
          icon="sunny-outline"
          label="起きる"
          onPress={handleWakeUp}
          testID="start-wake-mission"
          variant="warm"
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
  navigation: {
    minHeight: 44,
    marginLeft: -spacing.md,
    alignItems: 'flex-start',
  },
  timeSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  time: {
    color: colors.navy,
    fontFamily: fonts?.rounded,
  },
  voiceSection: {
    gap: spacing.xl,
  },
  centeredText: {
    textAlign: 'center',
  },
  footer: {
    paddingTop: spacing.lg,
  },
});
