import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

import { Screen } from '@/components/common/screen';
import { ScreenHeader } from '@/components/common/screen-header';
import { SettingsRow } from '@/components/common/settings-row';
import { daysOfWeek, dayOfWeekLabels } from '@/constants/options';
import { spacing } from '@/constants/theme';
import { goBackOrReplace } from '@/features/navigation/go-back';
import { useAppStore } from '@/store/use-app-store';

export default function ProfileWeeklyScheduleScreen() {
  const currentUser = useAppStore((state) => state.currentUser);
  const weeklyWakePlan = useAppStore((state) => state.weeklyWakePlan);

  if (!currentUser) {
    return <Redirect href="/onboarding" />;
  }

  return (
    <Screen contentStyle={styles.content} testID="profile-weekly-schedule-screen">
      <StatusBar style="dark" />
      <ScreenHeader
        description="曜日ごとに、いつもの起きる時間と予定の傾向を登録しておくと、明日の朝の設定に自動で反映されます。"
        onBack={() => goBackOrReplace('/(tabs)/profile')}
        title="定期的な起床スケジュール"
      />

      <View style={styles.list}>
        {daysOfWeek.map((day) => {
          const entry = weeklyWakePlan[day];
          return (
            <SettingsRow
              key={day}
              label={`${dayOfWeekLabels[day]}曜日`}
              onPress={() =>
                router.push({
                  pathname: '/profile-weekly-schedule-day',
                  params: { day },
                })
              }
              testID={`weekly-schedule-${day}`}
              value={entry ? `${entry.wakeAt}・${entry.schedules.join('・') || '予定なし'}` : '未設定'}
            />
          );
        })}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xxl,
  },
  list: {
    gap: spacing.md,
  },
});
