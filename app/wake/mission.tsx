import Ionicons from '@expo/vector-icons/Ionicons';
import * as Haptics from 'expo-haptics';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { MissionProgress } from '@/components/wake/mission-progress';
import { MorningScreen } from '@/components/wake/morning-screen';
import { prototypeConfig } from '@/constants/config';
import { colors, radii, spacing } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

const simulationStepCount = 10;

export default function WakeMissionScreen() {
  const wakeSession = useAppStore((state) => state.wakeSession);
  const wakeMissionProgress = useAppStore((state) => state.wakeMissionProgress);
  const advanceWakeMission = useAppStore((state) => state.advanceWakeMission);
  const completeMission = useAppStore((state) => state.completeMission);

  useEffect(() => {
    if (
      wakeSession?.status === 'mission' &&
      wakeMissionProgress >= prototypeConfig.wakeMissionSteps
    ) {
      completeMission();
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/wake/complete');
    }
  }, [completeMission, wakeMissionProgress, wakeSession?.status]);

  if (!wakeSession) {
    return <Redirect href="/morning/ready" />;
  }
  if (wakeSession.status === 'ringing') {
    return <Redirect href="/wake/alarm" />;
  }
  if (wakeSession.status === 'completed') {
    return <Redirect href="/wake/complete" />;
  }

  function handleSimulateSteps() {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    advanceWakeMission(simulationStepCount);
  }

  return (
    <MorningScreen contentStyle={styles.content} testID="wake-mission-screen">
      <StatusBar style="dark" />

      <View style={styles.heading}>
        <View style={styles.icon}>
          <Ionicons color={colors.indigo} name="footsteps-outline" size={30} />
        </View>
        <AppText variant="screenTitle" style={styles.centeredText}>
          ベッドから離れよう
        </AppText>
        <AppText variant="secondary" tone="soft" style={styles.centeredText}>
          スマートフォンを持って、少しだけ歩きます。
        </AppText>
      </View>

      <View style={styles.progressSection}>
        <MissionProgress
          current={wakeMissionProgress}
          target={prototypeConfig.wakeMissionSteps}
        />
      </View>

      <View style={styles.footer}>
        <AppButton
          icon="add"
          label={`+${simulationStepCount}歩`}
          onPress={handleSimulateSteps}
          testID="simulate-steps"
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
  heading: {
    paddingTop: spacing.xxl,
    alignItems: 'center',
    gap: spacing.lg,
  },
  icon: {
    width: 64,
    height: 64,
    borderRadius: radii.avatar,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centeredText: {
    textAlign: 'center',
  },
  progressSection: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  footer: {
    paddingTop: spacing.xl,
  },
});
