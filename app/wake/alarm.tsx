import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useRef } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { MorningScreen } from '@/components/wake/morning-screen';
import { WakeVoicePlayer } from '@/components/wake/wake-voice-player';
import {
  colors,
  fonts,
  paperColors,
  shadows,
  spacing,
} from '@/constants/theme';
import { isWakeContextValid } from '@/features/wake/is-wake-context-valid';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useVoiceSender } from '@/hooks/use-voice-sender';
import { alarmService } from '@/services/alarm-service';
import { useAppStore } from '@/store/use-app-store';

export default function WakeAlarmScreen() {
  const params = useLocalSearchParams<{ review?: string | string[] }>();
  const reviewParam = Array.isArray(params.review) ? params.review[0] : params.review;
  const isReview = reviewParam === '1';
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const wakeSession = useAppStore((state) => state.wakeSession);
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
  if (wakeSession.status === 'completed' && !isReview) {
    return <Redirect href="/wake/complete" />;
  }

  const isCommunity = assignedWakeVoice.type === 'community';
  const senderName = sender?.nickname ?? '誰か';

  function handleWakeUp() {
    runOnce(() => {
      stopPlaybackRef.current();
      if (isReview) {
        router.replace({ pathname: '/wake/mission', params: { review: '1' } });
        return;
      }
      void alarmService.cancelScheduledAlarm();
      router.replace('/wake/mission');
    });
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="wake-alarm-screen">
      <StatusBar style="dark" />

      <View style={styles.greeting}>
        <AppText
          adjustsFontSizeToFit
          minimumFontScale={0.78}
          numberOfLines={1}
          style={styles.greetingText}
        >
          おはようございます
        </AppText>
      </View>

      <View style={styles.timeSection}>
        <AppText variant="time" style={styles.time}>
          {wakeSession.alarmAt}
        </AppText>
        <AppText tone="soft" style={[styles.centeredText, styles.scheduleText]}>
          今日は {currentMorningRequest.schedules.join('・')}
        </AppText>
      </View>

      <View style={styles.voiceSection}>
        <View pointerEvents="none" style={[styles.greenTape, styles.voiceTape]} />
        <AppText variant="sectionTitle" style={styles.centeredText}>
          {isCommunity
            ? 'オキタ！のみんなから'
            : `${senderName}さんから、あなたの朝へ`}
        </AppText>
        <WakeVoicePlayer
          autoPlay
          controlColor={paperColors.orange}
          onPlayerReady={handlePlayerReady}
          sender={sender}
          voice={assignedWakeVoice}
          waveformColor={paperColors.orange}
          waveformMutedColor="#D8B45A"
        />
      </View>

      <View style={styles.footer}>
        <AppButton
          buttonColor={paperColors.orange}
          contentColor="#FFFFFF"
          icon="sunny-outline"
          label="起きる"
          onPress={handleWakeUp}
          style={styles.primaryAction}
          testID="start-wake-mission"
          variant="warm"
        />
      </View>
    </MorningScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    minHeight: '100%',
    justifyContent: 'space-between',
    gap: spacing.xl,
  },
  greeting: {
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  greetingText: {
    width: '100%',
    fontSize: 38,
    lineHeight: 46,
    textAlign: 'center',
  },
  timeSection: {
    minHeight: 160,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  time: {
    fontFamily: fonts?.rounded,
    fontSize: 70,
    lineHeight: 78,
  },
  scheduleText: {
    fontSize: 18,
    lineHeight: 27,
  },
  voiceSection: {
    position: 'relative',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.cardGray,
    gap: spacing.lg,
    ...shadows.paper,
  },
  centeredText: {
    textAlign: 'center',
  },
  footer: {
    marginTop: 'auto',
    padding: spacing.lg,
    borderWidth: 2,
    borderColor: paperColors.ink,
    borderRadius: 18,
    backgroundColor: paperColors.base,
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
    transform: [{ rotate: '-1.5deg' }],
  },
  voiceTape: {
    transform: [{ rotate: '1deg' }],
  },
  primaryAction: {
    borderWidth: 2,
    borderColor: paperColors.ink,
  },
});
