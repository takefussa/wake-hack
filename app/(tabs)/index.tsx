import { Redirect, router } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AppLogo } from '@/components/common/app-logo';
import { AppText } from '@/components/common/app-text';
import { Avatar } from '@/components/common/avatar';
import { Screen } from '@/components/common/screen';
import { MorningSettingsCard } from '@/components/home/morning-settings-card';
import { TomorrowSomeoneTimeline } from '@/components/home/tomorrow-someone-timeline';
import { spacing } from '@/constants/theme';
import { getTomorrowDayOfWeek } from '@/features/schedule/weekly-wake-plan';
import { useTapLock } from '@/hooks/use-tap-lock';
import { useAppStore } from '@/store/use-app-store';

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 11) return 'おはようございます';
  if (hour < 18) return 'こんにちは';
  return 'こんばんは';
}

export default function HomeScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const morningRequestDraft = useAppStore((state) => state.morningRequestDraft);
  const assignedWakeVoice = useAppStore((state) => state.assignedWakeVoice);
  const weeklyWakePlan = useAppStore((state) => state.weeklyWakePlan);
  const runOnce = useTapLock();

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  function handleEditTime() {
    runOnce(() => router.push('/morning/setup'));
  }

  function handleEditCondition() {
    runOnce(() => router.push(morningRequestDraft ? '/morning/condition' : '/morning/setup'));
  }

  function handleContinue() {
    runOnce(() => {
      if (!currentMorningRequest) {
        router.push('/morning/setup');
        return;
      }

      if (assignedWakeVoice) {
        router.push('/morning/ready');
      }
    });
  }

  return (
    <Screen contentStyle={styles.content} testID="home-screen">
      <View style={styles.topBar}>
        <AppLogo compact mode="light" />
        <Avatar
          avatarId={currentUser.avatarId}
          imageUri={currentUser.profileImageUri}
          name={currentUser.nickname}
          size={40}
        />
      </View>

      <View style={styles.greeting}>
        <AppText variant="screenTitle">
          {getGreeting()}、{currentUser.nickname}さん
        </AppText>
      </View>

      <MorningSettingsCard
        onContinue={handleContinue}
        onEditCondition={handleEditCondition}
        onEditTime={handleEditTime}
        request={currentMorningRequest}
        wakeAt={morningRequestDraft?.wakeAt ?? currentMorningRequest?.wakeAt ?? null}
        wakeVoice={assignedWakeVoice}
        weeklyDefault={weeklyWakePlan[getTomorrowDayOfWeek()]}
      />

      <TomorrowSomeoneTimeline />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
});
