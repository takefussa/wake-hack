import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { IconButton } from '@/components/common/icon-button';
import { MorningScreen } from '@/components/wake/morning-screen';
import { WakeVoicePlayer } from '@/components/wake/wake-voice-player';
import { colors, fonts, spacing } from '@/constants/theme';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { useAppStore } from '@/store/use-app-store';

function formatCurrentTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function WakeAlarmScreen() {
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
  const cancelWakeSession = useAppStore((state) => state.cancelWakeSession);
  const startWakeMission = useAppStore((state) => state.startWakeMission);
  const sender = useVoiceSender(assignedWakeVoice);
  const [now, setNow] = useState(() => new Date());
  const stopPlaybackRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15_000);
    return () => clearInterval(timer);
  }, []);

  const handlePlayerReady = useCallback((stopPlayback: () => void) => {
    stopPlaybackRef.current = stopPlayback;
  }, []);

  if (!currentMorningRequest || !assignedWakeVoice || !wakeSession) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status === 'mission') {
    return <Redirect href="/wake/mission" />;
  }
  if (wakeSession.status === 'completed') {
    return <Redirect href="/wake/complete" />;
  }

  const isCommunity = assignedWakeVoice.type === 'community';
  const senderName = sender?.nickname ?? '誰か';

  function handleWakeUp() {
    stopPlaybackRef.current();
    startWakeMission();
    router.replace('/wake/mission');
  }

  function handleBack() {
    stopPlaybackRef.current();
    cancelWakeSession();
    router.replace('/morning/ready');
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
          {formatCurrentTime(now)}
        </AppText>
        <AppText variant="secondary" tone="soft">
          今日は {currentMorningRequest.schedules.join('・')}
        </AppText>
      </View>

      <View style={styles.voiceSection}>
        <AppText variant="sectionTitle" style={styles.centeredText}>
          {isCommunity
            ? 'Wake Hackのみんなから'
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
