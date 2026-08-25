import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { TimeWheel } from '@/components/morning/time-wheel';
import { quickWakeTimes } from '@/constants/options';
import { spacing } from '@/constants/theme';
import { useAppStore } from '@/store/use-app-store';

export default function MorningSetupScreen() {
  const morningRequestDraft = useAppStore((state) => state.morningRequestDraft);
  const currentMorningRequest = useAppStore((state) => state.currentMorningRequest);
  const setMorningWakeTime = useAppStore((state) => state.setMorningWakeTime);
  const [wakeAt, setWakeAt] = useState(
    morningRequestDraft?.wakeAt ?? currentMorningRequest?.wakeAt ?? '07:00'
  );

  function handleNext() {
    setMorningWakeTime(wakeAt);
    router.push('/morning/condition');
  }

  return (
    <Screen contentStyle={styles.content} testID="morning-setup-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="明日、声を届けてほしい時刻を選びます。"
        onBack={() => router.back()}
        stepLabel="明日の朝 1 / 2"
        title="何時に起きますか？"
      />

      <View style={styles.pickerSection}>
        <TimeWheel onChange={setWakeAt} value={wakeAt} />
        <AppText variant="caption" tone="muted" style={styles.minuteNote}>
          1分単位で設定できます
        </AppText>
      </View>

      <View style={styles.quickSection}>
        <AppText variant="sectionTitle">よく使う時刻</AppText>
        <View style={styles.quickChoices}>
          {quickWakeTimes.map((time) => (
            <ChoiceChip
              key={time}
              label={time}
              onPress={() => setWakeAt(time)}
              selected={wakeAt === time}
            />
          ))}
        </View>
      </View>

      <AppButton label="次へ" onPress={handleNext} testID="morning-setup-next" />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  pickerSection: {
    gap: spacing.md,
  },
  minuteNote: {
    textAlign: 'center',
  },
  quickSection: {
    gap: spacing.lg,
  },
  quickChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
});
