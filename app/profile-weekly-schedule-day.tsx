import { Redirect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/common/app-button';
import { AppText } from '@/components/common/app-text';
import { ChoiceChip } from '@/components/common/choice-chip';
import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { TimeWheel } from '@/components/morning/time-wheel';
import { dayOfWeekLabels, quickWakeTimes, scheduleOptions } from '@/constants/options';
import { spacing } from '@/constants/theme';
import { toggleSchedule } from '@/features/morning/morning-request-form';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useAppStore } from '@/store/use-app-store';
import type { DayOfWeek, ScheduleType } from '@/types';

function isDayOfWeek(value: unknown): value is DayOfWeek {
  return (
    typeof value === 'string' &&
    ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].includes(value)
  );
}

export default function ProfileWeeklyScheduleDayScreen() {
  const params = useLocalSearchParams<{ day?: string | string[] }>();
  const dayParam = Array.isArray(params.day) ? params.day[0] : params.day;
  const currentUser = useAppStore((state) => state.currentUser);
  const weeklyWakePlan = useAppStore((state) => state.weeklyWakePlan);
  const setWeeklyWakePlanDay = useAppStore((state) => state.setWeeklyWakePlanDay);

  const day = isDayOfWeek(dayParam) ? dayParam : null;
  const existingEntry = day ? weeklyWakePlan[day] : null;
  const [wakeAt, setWakeAt] = useState(existingEntry?.wakeAt ?? quickWakeTimes[1]);
  const [schedules, setSchedules] = useState<ScheduleType[]>(existingEntry?.schedules ?? []);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }
  if (!day) {
    return <Redirect href="/profile-weekly-schedule" />;
  }

  function handleSave() {
    if (!day) return;
    setWeeklyWakePlanDay(day, { wakeAt, schedules });
    goBackOrReplace('/profile-weekly-schedule');
  }

  function handleClear() {
    if (!day) return;
    setWeeklyWakePlanDay(day, null);
    goBackOrReplace('/profile-weekly-schedule');
  }

  return (
    <Screen contentStyle={styles.content} testID="profile-weekly-schedule-day-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="いつも起きる時間と、その曜日にありがちな予定を登録します。"
        onBack={() => goBackOrReplace('/profile-weekly-schedule')}
        title={`${dayOfWeekLabels[day]}曜日の設定`}
      />

      <View style={styles.pickerSection}>
        <TimeWheel onChange={setWakeAt} value={wakeAt} />
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

      <View style={styles.section}>
        <View style={styles.sectionHeading}>
          <AppText variant="sectionTitle">予定</AppText>
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

      <AppButton label="保存する" onPress={handleSave} testID="save-weekly-schedule-day" />

      {existingEntry ? (
        <AppButton
          label="この曜日の設定を削除"
          onPress={handleClear}
          testID="clear-weekly-schedule-day"
          variant="text"
        />
      ) : null}
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
  quickChoices: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
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
});
