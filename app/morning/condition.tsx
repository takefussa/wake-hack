import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { moodOptions, scheduleOptions, voiceStyleOptions } from '@/constants/options';
import { colors, spacing } from '@/constants/theme';
import { demoMorningDefaults } from '@/data/demo-scenario';
import { toggleSchedule } from '@/features/morning/morning-request-form';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { morningRequestService } from '@/services/morning-request-service';
import { useAppStore } from '@/store/use-app-store';
import type { MoodType, ScheduleType, VoiceStyle } from '@/types';

export default function TomorrowConditionScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const morningRequestDraft = useAppStore((state) => state.morningRequestDraft);
  const setMorningRequest = useAppStore((state) => state.setMorningRequest);
  const [schedules, setSchedules] = useState<ScheduleType[]>([
    ...demoMorningDefaults.schedules,
  ]);
  const [mood, setMood] = useState<MoodType | null>(demoMorningDefaults.mood);
  const [voiceStyle, setVoiceStyle] = useState<VoiceStyle | null>(
    demoMorningDefaults.preferredVoiceStyle
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isSavingRef = useRef(false);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  if (!morningRequestDraft) {
    return <Redirect href="/morning/setup" />;
  }

  const currentUserId = currentUser.id;
  const wakeAt = morningRequestDraft.wakeAt;
  const canSubmit = schedules.length > 0 && mood !== null && voiceStyle !== null;

  async function handleSubmit() {
    if (!canSubmit || !mood || !voiceStyle || isSavingRef.current) return;

    isSavingRef.current = true;
    setIsSaving(true);
    setError(null);

    try {
      const request = await morningRequestService.createRequest(currentUserId, {
        wakeAt,
        schedules,
        mood,
        preferredVoiceStyle: voiceStyle,
      });
      setMorningRequest(request);
      router.push('/morning/give-choice');
    } catch {
      setError('明日の朝を保存できませんでした。もう一度お試しください。');
      isSavingRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <Screen contentStyle={styles.content} testID="tomorrow-condition-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description={`${morningRequestDraft.wakeAt}の朝について、今の気持ちを少しだけ教えてください。`}
        onBack={() => goBackOrReplace('/morning/setup')}
        stepLabel="明日の朝 2 / 2"
        title="どんな朝になりそう？"
      />

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="sectionTitle">明日の予定</AppText>
          <AppText variant="caption" tone="muted">
            複数選べます
          </AppText>
        </View>
        <View style={styles.choices}>
          {scheduleOptions.map((schedule) => (
            <ChoiceChip
              key={schedule}
              label={schedule}
              onPress={() => setSchedules((current) => toggleSchedule(current, schedule))}
              selected={schedules.includes(schedule)}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">今の気分</AppText>
        <View style={styles.choices}>
          {moodOptions.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              onPress={() => setMood(option)}
              selected={mood === option}
            />
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <AppText variant="sectionTitle">どんな声がいいですか？</AppText>
        <View style={styles.choices}>
          {voiceStyleOptions.map((option) => (
            <ChoiceChip
              key={option}
              label={option}
              onPress={() => setVoiceStyle(option)}
              selected={voiceStyle === option}
            />
          ))}
        </View>
      </View>

      {error ? (
        <AppText variant="secondary" style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <AppButton
        disabled={!canSubmit || isSaving}
        label={isSaving ? '保存しています…' : '明日の朝を決める'}
        onPress={() => void handleSubmit()}
        testID="condition-submit"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  section: {
    gap: spacing.lg,
  },
  sectionHeading: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  choices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  error: {
    color: colors.danger,
  },
});
